'use client'
import { useEffect, useState } from 'react'
import { supabase, getLowStockItems } from '@/lib/supabase'
import type { Booking, InventoryItem } from '@/types/database'

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - today.getTime()) / (1000*60*60*24))
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('nb-NO', { day:'numeric', month:'long' })
}

function nights(b: Booking) {
  return Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000)
}

function fmt(n: number) { return n.toLocaleString('nb-NO') }

export default function Dashboard() {
  const [nextBooking, setNextBooking] = useState<Booking | null>(null)
  const [lowStock, setLowStock]       = useState<InventoryItem[]>([])
  const [inntekt, setInntekt]         = useState<number | null>(null)
  const [utgifter, setUtgifter]       = useState<number | null>(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const uid = session.user.id

      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const from = `${year}-${String(month).padStart(2,'0')}-01`
      const to   = `${year}-${String(month).padStart(2,'0')}-${new Date(year, month, 0).getDate()}`

      const [stock, bookingsRes, nextRes, expensesRes] = await Promise.all([
        getLowStockItems(),
        supabase
          .from('bookings')
          .select('id, check_in, check_out, price_per_night, cleaning_fee, status')
          .eq('user_id', uid)
          .neq('status', 'cancelled')
          .lte('check_in', to)
          .gte('check_out', from),
        supabase
          .from('bookings')
          .select('*')
          .eq('user_id', uid)
          .neq('status', 'cancelled')
          .gte('check_in', new Date().toISOString().split('T')[0])
          .order('check_in')
          .limit(1),
        supabase
          .from('economy_entries')
          .select('amount')
          .eq('user_id', uid)
          .eq('type', 'expense')
          .gte('date', from)
          .lte('date', to),
      ])

      const bookings = bookingsRes.data ?? []
      const totalInntekt = bookings.reduce((a, b) => {
        const n = Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000)
        return a + n * b.price_per_night + b.cleaning_fee
      }, 0)

      const totalUtgifter = (expensesRes.data ?? []).reduce((a, e) => a + e.amount, 0)

      setLowStock(stock)
      setNextBooking(nextRes.data?.[0] ?? null)
      setInntekt(totalInntekt)
      setUtgifter(totalUtgifter)
      setLoading(false)
    }
    load()
  }, [])

  const month = new Date().toLocaleString('nb-NO', { month:'long', year:'numeric' })
  const netto = inntekt !== null && utgifter !== null ? inntekt - utgifter : null

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-5 pt-2">
        <div>
          <h1 className="display text-3xl leading-tight">Tunet</h1>
          <p className="text-xs text-[var(--c-muted)] mt-0.5">Gardshus · Vossestrand</p>
        </div>
        <span className="badge badge-green mt-1">● Ledig</span>
      </div>

      <p className="section-lbl">Neste booking</p>
      {loading ? (
        <div className="card animate-pulse h-20" />
      ) : nextBooking ? (
        <div className="card" style={{ borderLeft: '3px solid var(--c-accent)' }}>
          <div className="text-base font-medium mb-0.5">{nextBooking.guest_name || 'Airbnb-gjest'}</div>
          <div className="text-sm text-[var(--c-muted)] mb-2.5">
            {formatDate(nextBooking.check_in)} – {formatDate(nextBooking.check_out)}
            {' · '}{nights(nextBooking)} netter · {nextBooking.num_guests} gjester
          </div>
          <div className="flex gap-2 items-center">
            <span className="badge badge-green">Bekrefta</span>
            <span className="text-xs text-[var(--c-muted)]">
              om {daysUntil(nextBooking.check_in)} dagar
            </span>
          </div>
        </div>
      ) : (
        <div className="card text-sm text-[var(--c-muted)]">Ingen komande bookingar</div>
      )}

      {lowStock.length > 0 && (
        <>
          <p className="section-lbl">Lagervarslar</p>
          <div className="card" style={{ background: 'var(--c-amber-lt)', borderColor: 'var(--c-amber)' }}>
            <div className="text-sm font-medium text-[var(--c-amber)] mb-1.5">
              ⚠ {lowStock.length} vare{lowStock.length > 1 ? 'r' : ''} under minstebeholdning
            </div>
            <div className="text-xs text-[var(--c-amber)]">
              {lowStock.map(i => `${i.name} (${i.current_qty} ${i.unit})`).join(' · ')}
            </div>
          </div>
        </>
      )}

      <p className="section-lbl">Økonomi — {month}</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="stat-card">
          <div className="text-xs text-[var(--c-muted)] mb-1">Inntekt</div>
          <div className="stat-val text-[var(--c-accent)]">{inntekt !== null ? fmt(inntekt) : '—'}</div>
          <div className="text-xs text-[var(--c-muted)]">kr</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[var(--c-muted)] mb-1">Utgifter</div>
          <div className="stat-val text-[var(--c-red)]">{utgifter !== null ? fmt(utgifter) : '—'}</div>
          <div className="text-xs text-[var(--c-muted)]">kr</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[var(--c-muted)] mb-1">Netto</div>
          <div className={`stat-val ${netto !== null && netto >= 0 ? 'text-[var(--c-accent)]' : 'text-[var(--c-red)]'}`}>
            {netto !== null ? fmt(netto) : '—'}
          </div>
          <div className="text-xs text-[var(--c-muted)]">kr</div>
        </div>
      </div>
    </div>
  )
}
