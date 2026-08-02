'use client'
import { useState, useEffect, useCallback } from 'react'
import { getBookingsForMonth, createBooking, createBookingEconomyEntries, supabase } from '@/lib/supabase'
import { syncIcalBookings } from '@/lib/ical'
import type { Booking } from '@/types/database'

const MONTHS = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember']
const DAYS   = ['Ma','Ti','On','To','Fr','Lø','Sø']

function nightsCount(b: Booking) {
  return Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000)
}

function totalRevenue(b: Booking) {
  return nightsCount(b) * b.price_per_night + b.cleaning_fee
}

export default function CalendarPage() {
  const now = new Date()
  const [year,  setYear]    = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth() + 1)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [icalUrl, setIcalUrl] = useState<string | null>(null)
  const [editBooking, setEditBooking] = useState<Booking | null>(null)
  const [editName, setEditName] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [form, setForm] = useState({
    guest_name: '', check_in: '', check_out: '',
    num_guests: 2, price_per_night: 900, cleaning_fee: 400, notes: ''
  })

  const load = useCallback(() => {
    getBookingsForMonth(year, month).then(setBookings)
  }, [year, month])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('user_profiles')
        .select('ical_url, last_synced')
        .eq('id', session.user.id)
        .single()
      if (data?.ical_url) setIcalUrl(data.ical_url)
      if (data?.last_synced) setLastSynced(data.last_synced)
    }
    loadProfile()
  }, [])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  async function handleSync() {
    if (!icalUrl) return
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncIcalBookings(icalUrl)
      setSyncResult({ ok: true, msg: `Synkronisert! ${result.created} nye bookingar, ${result.skipped} allereie lagra.` })
      // Oppdater last_synced
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.from('user_profiles').update({ last_synced: new Date().toISOString() }).eq('id', session.user.id)
        setLastSynced(new Date().toISOString())
      }
      load()
    } catch {
      setSyncResult({ ok: false, msg: 'Kalenderen kunne ikkje synkroniserast. Kontroller at iCal-lenka er riktig i innstillingar.' })
    } finally {
      setSyncing(false)
    }
  }

  const bookedDays = new Set<number>()
  const turnoverDays = new Set<number>()
  bookings.forEach(b => {
    const ci = new Date(b.check_in);  ci.setHours(12)
    const co = new Date(b.check_out); co.setHours(12)
    for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === year && d.getMonth() + 1 === month)
        bookedDays.add(d.getDate())
    }
    const to = new Date(ci); to.setDate(to.getDate() - 1)
    if (to.getFullYear() === year && to.getMonth() + 1 === month)
      turnoverDays.add(to.getDate())
  })

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDow    = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const today       = now.getDate()
  const isThisMonth = now.getFullYear() === year && now.getMonth() + 1 === month

  async function handleSave() {
    if (!form.guest_name || !form.check_in || !form.check_out) return
    setSaving(true)
    try {
      const booking = await createBooking({ ...form, status: 'confirmed', platform: 'direct' })
      await createBookingEconomyEntries(booking)
      setShowModal(false)
      setForm({ guest_name:'', check_in:'', check_out:'', num_guests:2, price_per_night:900, cleaning_fee:400, notes:'' })
      load()
    } catch {
      alert('Noko gjekk gale. Prøv igjen.')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditSave() {
    if (!editBooking || !editName.trim()) return
    setEditSaving(true)
    await supabase.from('bookings').update({ guest_name: editName }).eq('id', editBooking.id)
    setEditBooking(null)
    load()
    setEditSaving(false)
  }

  async function handleCancel() {
    if (!editBooking) return
    if (!confirm('Er du sikker på at du vil kansellere denne bookinga?')) return
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', editBooking.id)
    setEditBooking(null)
    load()
  }

  function f(k: string, v: string | number) { setForm(p => ({ ...p, [k]: v })) }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pt-2">
        <button onClick={prevMonth} className="p-1 text-[var(--c-muted)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <h2 className="display text-xl capitalize">{MONTHS[month-1]} {year}</h2>
        <button onClick={nextMonth} className="p-1 text-[var(--c-muted)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </button>
      </div>

      {/* iCal sync-status */}
      {icalUrl && (
        <div className="card mb-3 flex justify-between items-center py-2.5">
          <div>
            <div className="text-xs font-medium">Airbnb-kalender</div>
            <div className="text-xs text-[var(--c-muted)]">
              {lastSynced
                ? `Sist synkronisert: ${new Date(lastSynced).toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                : 'Ikkje synkronisert enno'}
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: 'var(--c-accent-lt)', color: 'var(--c-accent)' }}
          >
            {syncing ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Synkar...
              </span>
            ) : '↓ Synkroniser'}
          </button>
        </div>
      )}

      {syncResult && (
        <div className="mb-3 p-3 rounded-xl text-xs"
          style={{
            background: syncResult.ok ? 'var(--c-accent-lt)' : 'var(--c-red-lt)',
            color: syncResult.ok ? 'var(--c-accent)' : 'var(--c-red)'
          }}>
          {syncResult.ok ? '✓ ' : '⚠ '}{syncResult.msg}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3 mb-3 flex-wrap">
        <span className="badge badge-green">■ Booka</span>
        <span className="badge badge-amber">■ Klargjerast</span>
        <span className="text-xs text-[var(--c-muted)] self-center">□ Ledig</span>
      </div>

      {/* Calendar grid */}
      <div className="cal-grid mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs text-[var(--c-muted)] py-1">{d}</div>)}
      </div>
      <div className="cal-grid mb-4">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const isBooked   = bookedDays.has(day)
          const isTurnover = !isBooked && turnoverDays.has(day)
          const isToday    = isThisMonth && day === today
          return (
            <div key={day}
              className={`cal-day text-[13px]
                ${isBooked ? 'cal-booked' : isTurnover ? 'cal-turnover' : ''}
                ${isToday ? 'cal-today' : ''}`}
            >
              {day}
              {(isBooked || isTurnover) && (
                <div className="w-1 h-1 rounded-full bg-current opacity-60" />
              )}
            </div>
          )
        })}
      </div>

      {/* Bookings list */}
      <p className="section-lbl">Bookingar denne månaden</p>
      {bookings.length === 0 ? (
        <div className="card text-sm text-[var(--c-muted)] mb-3">Ingen bookingar denne månaden</div>
      ) : (
        <div className="card mb-3">
          {bookings.map((b, i) => (
            <div key={b.id}
              onClick={() => { setEditBooking(b); setEditName(b.guest_name) }}
              className={`flex justify-between items-center py-2.5 cursor-pointer active:opacity-70 ${i < bookings.length-1 ? 'border-b border-[var(--c-border)]' : ''}`}>
              <div>
                <div className="font-medium text-sm">{b.guest_name || 'Airbnb-gjest'}</div>
                <div className="text-xs text-[var(--c-muted)]">
                  {new Date(b.check_in).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
                  {' – '}
                  {new Date(b.check_out).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
                  {' · '}{nightsCount(b)} netter
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">{totalRevenue(b).toLocaleString('nb-NO')} kr</div>
                <span className={`badge ${b.status==='confirmed'?'badge-green':b.status==='cancelled'?'badge-red':'badge-amber'}`}>
                  {b.status==='confirmed'?'Bekrefta':b.status==='cancelled'?'Kansellert':'Venter'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Ny booking</button>

      {/* Rediger booking modal */}
      {editBooking && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setEditBooking(null)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-1">Rediger booking</h2>
            <p className="text-xs text-[var(--c-muted)] mb-4">
              {new Date(editBooking.check_in).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
              {' – '}
              {new Date(editBooking.check_out).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
            </p>
            <label className="block mb-4">
              <span className="field-label">Gjestens namn</span>
              <input className="field-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Familie Hansen" autoFocus />
            </label>
            <button className="btn btn-primary mb-2" onClick={handleEditSave} disabled={editSaving || !editName.trim()}>
              {editSaving ? 'Lagrar...' : 'Lagre namn'}
            </button>
            <button className="btn btn-secondary mb-2" onClick={() => setEditBooking(null)}>Avbryt</button>
            <button
              className="w-full py-2.5 rounded-xl text-sm font-medium mt-2"
              style={{ color: 'var(--c-red)', border: '1px solid var(--c-red)', background: 'transparent' }}
              onClick={handleCancel}
            >
              Kanseller booking
            </button>
          </div>
        </div>
      )}

      {/* Ny booking modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-4">Ny booking</h2>
            <label className="block mb-3">
              <span className="field-label">Gjestens namn</span>
              <input className="field-input" value={form.guest_name} onChange={e=>f('guest_name',e.target.value)} placeholder="Familie Hansen" />
            </label>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <label className="block">
                <span className="field-label">Innsjekk</span>
                <input type="date" className="field-input" value={form.check_in} onChange={e=>f('check_in',e.target.value)} />
              </label>
              <label className="block">
                <span className="field-label">Utsjekk</span>
                <input type="date" className="field-input" value={form.check_out} onChange={e=>f('check_out',e.target.value)} />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <label className="block">
                <span className="field-label">Gjester</span>
                <input type="number" className="field-input" value={form.num_guests} min={1} max={10} onChange={e=>f('num_guests',+e.target.value)} />
              </label>
              <label className="block">
                <span className="field-label">Kr/natt</span>
                <input type="number" className="field-input" value={form.price_per_night} onChange={e=>f('price_per_night',+e.target.value)} />
              </label>
              <label className="block">
                <span className="field-label">Vaskegebyr</span>
                <input type="number" className="field-input" value={form.cleaning_fee} onChange={e=>f('cleaning_fee',+e.target.value)} />
              </label>
            </div>
            <label className="block mb-4">
              <span className="field-label">Notat</span>
              <textarea className="field-input h-16 resize-none" value={form.notes} onChange={e=>f('notes',e.target.value)} placeholder="Allergiar, spesielle ønske, husdyr..." />
            </label>
            {form.check_in && form.check_out && (
              <div className="card mb-3" style={{ background: 'var(--c-accent-lt)' }}>
                <div className="text-xs text-[var(--c-accent)]">
                  {Math.ceil((new Date(form.check_out).getTime()-new Date(form.check_in).getTime())/86400000)} netter ×{' '}
                  {form.price_per_night} kr + {form.cleaning_fee} kr vask ={' '}
                  <strong>
                    {(Math.ceil((new Date(form.check_out).getTime()-new Date(form.check_in).getTime())/86400000)*form.price_per_night+form.cleaning_fee).toLocaleString('nb-NO')} kr
                  </strong>
                </div>
              </div>
            )}
            <button className="btn btn-primary mb-2" onClick={handleSave} disabled={saving}>
              {saving ? 'Lagrar...' : 'Lagre booking'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  )
}
