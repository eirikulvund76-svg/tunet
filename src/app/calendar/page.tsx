'use client'
import { useState, useEffect, useCallback } from 'react'
import { getBookingsForMonth, createBooking, createBookingEconomyEntries } from '@/lib/supabase'
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
  const [form, setForm] = useState({
    guest_name: '', check_in: '', check_out: '',
    num_guests: 2, price_per_night: 900, cleaning_fee: 400, notes: ''
  })

  const load = useCallback(() => {
    getBookingsForMonth(year, month).then(setBookings)
  }, [year, month])

  useEffect(() => { load() }, [load])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
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
    } finally { setSaving(false) }
  }

  function f(k: string, v: string | number) { setForm(p => ({ ...p, [k]: v })) }

  return (
    <div className="p-4">
      {/* Månadsveljar — sentrert på same linje */}
      <div className="flex justify-center items-center gap-4 mb-4 pt-2">
        <button onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--c-border)] text-[var(--c-muted)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <h2 className="display text-xl capitalize w-40 text-center">{MONTHS[month-1]} {year}</h2>
        <button onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--c-border)] text-[var(--c-muted)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-3 flex-wrap">
        <span className="badge badge-green">■ Booka</span>
        <span className="badge badge-amber">■ Klargjerast</span>
        <span className="text-xs text-[var(--c-muted)] self-center">□ Ledig</span>
      </div>

      {/* Kalender */}
      <div className="cal-grid mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-[var(--c-muted)] py-1">{d}</div>
        ))}
      </div>
      <div className="cal-grid mb-4">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const isBooked   = bookedDays.has(day)
          const isTurnover = !isBooked && turnoverDays.has(day)
          const isToday    = isThisMonth && day === today
          return (
            <div key={day}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                borderRadius: '10px',
                cursor: 'pointer',
                gap: '3px',
                padding: '6px 2px',
                background: isBooked
                  ? 'var(--c-accent-lt)'
                  : isTurnover
                    ? 'var(--c-amber-lt)'
                    : isToday
                      ? 'transparent'
                      : 'rgba(0,0,0,0.03)',
                border: isToday ? '2px solid var(--c-accent)' : '1px solid transparent',
                color: isBooked
                  ? 'var(--c-accent)'
                  : isTurnover
                    ? 'var(--c-amber)'
                    : 'var(--c-text)',
                fontWeight: isBooked || isTurnover ? '500' : '400',
                fontSize: '13px',
              }}
            >
              {day}
              {(isBooked || isTurnover) && (
                <div style={{
                  width: '5px', height: '5px',
                  borderRadius: '50%',
                  background: 'currentColor',
                  opacity: 0.6
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Bookingsliste */}
      <p className="section-lbl">Bookingar denne månaden</p>
      {bookings.length === 0 ? (
        <div className="card text-sm text-[var(--c-muted)]">Ingen bookingar denne månaden</div>
      ) : (
        <div className="card">
          {bookings.map((b, i) => (
            <div key={b.id}
              className={`flex justify-between items-center py-2.5
                ${i < bookings.length-1 ? 'border-b border-[var(--c-border)]' : ''}`}>
              <div>
                <div className="font-medium text-sm">{b.guest_name}</div>
                <div className="text-xs text-[var(--c-muted)]">
                  {new Date(b.check_in).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
                  {' – '}
                  {new Date(b.check_out).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
                  {' · '}{nightsCount(b)} netter · {b.num_guests} gjester
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">{totalRevenue(b).toLocaleString('nb-NO')} kr</div>
                <span className={`badge ${b.status==='confirmed'?'badge-green':b.status==='paid'?'badge-blue':'badge-amber'}`}>
                  {b.status==='confirmed'?'Bekrefta':b.status==='paid'?'Betalt':'Venter'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Ny booking</button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-4">Ny booking</h2>
            <label className="block mb-3">
              <span className="field-label">Gjestens namn</span>
              <input className="field-input" value={form.guest_name}
                onChange={e=>f('guest_name',e.target.value)} placeholder="Familie Hansen" />
            </label>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <label className="block">
                <span className="field-label">Innsjekk</span>
                <input type="date" className="field-input" value={form.check_in}
                  onChange={e=>f('check_in',e.target.value)} />
              </label>
              <label className="block">
                <span className="field-label">Utsjekk</span>
                <input type="date" className="field-input" value={form.check_out}
                  onChange={e=>f('check_out',e.target.value)} />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <label className="block">
                <span className="field-label">Gjester</span>
                <input type="number" className="field-input" value={form.num_guests}
                  min={1} max={10} onChange={e=>f('num_guests',+e.target.value)} />
              </label>
              <label className="block">
                <span className="field-label">Kr/natt</span>
                <input type="number" className="field-input" value={form.price_per_night}
                  onChange={e=>f('price_per_night',+e.target.value)} />
              </label>
              <label className="block">
                <span className="field-label">Vaskegebyr</span>
                <input type="number" className="field-input" value={form.cleaning_fee}
                  onChange={e=>f('cleaning_fee',+e.target.value)} />
              </label>
            </div>
            <label className="block mb-4">
              <span className="field-label">Notat</span>
              <textarea className="field-input h-16 resize-none" value={form.notes}
                onChange={e=>f('notes',e.target.value)}
                placeholder="Allergiar, spesielle ønske..." />
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
