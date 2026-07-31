'use client'
import { useEffect, useState } from 'react'
import { supabase, getLowStockItems } from '@/lib/supabase'
import type { Booking, InventoryItem } from '@/types/database'

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long' })
}

function nights(b: Booking) {
  return Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000)
}

function fmt(n: number) { return n.toLocaleString('nb-NO') }

export default function Dashboard() {
  const [nextBooking, setNextBooking]   = useState<Booking | null>(null)
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null)
  const [lowStock, setLowStock]         = useState<InventoryItem[]>([])
  const [inntekt, setInntekt]           = useState<number | null>(null)
  const [utgifter, setUtgifter]         = useState<number | null>(null)
  const [husnamn, setHusnamn]           = useState('Huset ditt')
  const [stad, setStad]                 = useState('')
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const uid = session.user.id
      const today = new Date().toISOString().split('T')[0]

      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const from = `${year}-${String(month).padStart(2,'0')}-01`
      const to   = `${year}-${String(month).padStart(2,'0')}-${new Date(year, month, 0).getDate()}`

      const [profRes, stockRes, nextRes, currentRes, bookingsRes, expensesRes] = await Promise.all([
        supabase.from('user_profiles').select('house_name, house_location').eq('id', uid).single(),
        getLowStockItems(),
        supabase.from('bookings').select('*').eq('user_id', uid).neq('status', 'cancelled').gt('check_in', today).order('check_in').limit(1),
        supabase.from('bookings').select('*').eq('user_id', uid).neq('status', 'cancelled').lte('check_in', today).gte('check_out', today).limit(1),
        supabase.from('bookings').select('check_in, check_out, price_per_night, cleaning_fee').eq('user_id', uid).neq('status', 'cancelled').lte('check_in', to).gte('check_out', from),
        supabase.from('economy_entries').select('amount').eq('user_id', uid).eq('type', 'expense').gte('date', from).lte('date', to),
      ])

      if (profRes.data?.house_name) setHusnamn(profRes.data.house_name)
      if (profRes.data?.house_location) setStad(profRes.data.house_location)
      setLowStock(stockRes ?? [])
      setNextBooking(nextRes.data?.[0] ?? null)
      setCurrentBooking(currentRes.data?.[0] ?? null)

      const totalInntekt = (bookingsRes.data ?? []).reduce((a, b) => {
        const n = Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000)
        return a + n * b.price_per_night + b.cleaning_fee
      }, 0)
      const totalUtgifter = (expensesRes.data ?? []).reduce((a, e) => a + e.amount, 0)

      setInntekt(totalInntekt)
      setUtgifter(totalUtgifter)
      setLoading(false)
    }
    load()
  }, [])

  const netto = inntekt !== null && utgifter !== null ? inntekt - utgifter : null
  const month = new Date().toLocaleString('nb-NO', { month: 'long', year: 'numeric' })
  const daysToNext = nextBooking ? daysUntil(nextBooking.check_in) : null
  const isOccupied = currentBooking !== null

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-start mb-5 pt-2">
        <div>
          <h1 className="display text-3xl leading-tight">{husnamn}</h1>
          {stad && <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>Gardshus · {stad}</p>}
        </div>
        <span className={`badge mt-1 ${isOccupied ? 'badge-amber' : 'badge-green'}`}>
          {isOccupied ? '● Opptatt' : '● Ledig'}
        </span>
      </div>

      {/* Innsjekking no */}
      {isOccupied && currentBooking && (
        <>
          <p className="section-lbl">Gjest inne no</p>
          <div className="card mb-3" style={{ borderLeft: '3px solid var(--c-amber)' }}>
            <div className="font-medium text-sm mb-0.5">{currentBooking.guest_name || 'Airbnb-gjest'}</div>
            <div className="text-sm" style={{ color: 'var(--c-muted)' }}>
              Til {formatDate(currentBooking.check_out)} · {nights(currentBooking)} netter
            </div>
          </div>
        </>
      )}

      {/* Neste booking */}
      <p className="section-lbl">Neste booking</p>
      {loading ? (
        <div className="card animate-pulse h-20 mb-3" />
      ) : nextBooking ? (
        <div className="card mb-3" style={{ borderLeft: '3px solid var(--c-accent)' }}>
          <div className="font-medium text-sm mb-0.5">{nextBooking.guest_name || 'Airbnb-gjest'}</div>
          <div className="text-sm mb-2" style={{ color: 'var(--c-muted)' }}>
            {formatDate(nextBooking.check_in)} – {formatDate(nextBooking.check_out)}
            {' · '}{nights(nextBooking)} netter
          </div>
          <div className="flex gap-2 items-center">
            <span className="badge badge-green">Bekrefta</span>
            <span className="text-xs" style={{ color: 'var(--c-muted)' }}>
              {daysToNext === 0 ? 'Innsjekk i dag!' :
               daysToNext === 1 ? 'Innsjekk i morgon!' :
               `om ${daysToNext} dagar`}
            </span>
          </div>
        </div>
      ) : (
        <div className="card mb-3 text-sm" style={{ color: 'var(--c-muted)' }}>
          Ingen komande bookingar
        </div>
      )}

      {/* Varsel: tomt lenge */}
      {!isOccupied && daysToNext !== null && daysToNext > 14 && (
        <div className="card mb-3" style={{ background: 'var(--c-amber-lt)', borderColor: 'var(--c-amber)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--c-amber)' }}>
            Huset står tomt i {daysToNext} dagar
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--c-amber)' }}>
            Vurder å justere prisen for å få fleire bookingar.
          </div>
        </div>
      )}

      {/* Varsel: innsjekk snart */}
      {daysToNext !== null && daysToNext <= 2 && daysToNext > 0 && (
        <div className="card mb-3" style={{ background: 'var(--c-accent-lt)', borderColor: 'var(--c-accent)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--c-accent)' }}>
            Innsjekk {daysToNext === 1 ? 'i morgon' : 'om 2 dagar'}!
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--c-accent)' }}>
            Husk å klargjere huset og bytte kodeboks-kode.
          </div>
        </div>
      )}

      {/* Lagervarslar */}
      {lowStock.length > 0 && (
        <>
          <p className="section-lbl">Lagervarslar</p>
          <div className="card mb-3" style={{ background: 'var(--c-amber-lt)', borderColor: 'var(--c-amber)' }}>
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--c-amber)' }}>
              {lowStock.length} vare{lowStock.length > 1 ? 'r' : ''} treng påfyll
            </div>
            {lowStock.map(i => (
              <div key={i.id} className="text-xs py-1 border-b border-[var(--c-border)] last:border-0" style={{ color: 'var(--c-amber)' }}>
                {i.name} — {i.current_qty} {i.unit} att (min: {i.min_qty})
              </div>
            ))}
          </div>
        </>
      )}

      {/* Økonomi */}
      <p className="section-lbl">Økonomi — {month}</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="stat-card">
          <div className="text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Inntekt</div>
          <div className="stat-val" style={{ color: 'var(--c-accent)' }}>
            {loading ? '—' : fmt(inntekt ?? 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--c-muted)' }}>kr</div>
        </div>
        <div className="stat-card">
          <div className="text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Utgifter</div>
          <div className="stat-val" style={{ color: 'var(--c-red)' }}>
            {loading ? '—' : fmt(utgifter ?? 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--c-muted)' }}>kr</div>
        </div>
        <div className="stat-card">
          <div className="text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Netto</div>
          <div className="stat-val" style={{ color: netto !== null && netto >= 0 ? 'var(--c-accent)' : 'var(--c-red)' }}>
            {loading ? '—' : fmt(netto ?? 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--c-muted)' }}>kr</div>
        </div>
      </div>
    </div>
  )
}
