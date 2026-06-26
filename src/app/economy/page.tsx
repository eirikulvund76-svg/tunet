'use client'
// src/app/economy/page.tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const MONTHS = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember']

const EXPENSE_CATS: Record<string,string> = {
  electricity: 'Straum',
  insurance: 'Forsikring',
  maintenance: 'Vedlikehald',
  consumables: 'Forbruksvarer',
  platform_fee: 'Plattformgebyr',
  other: 'Anna utgift',
}

function fmt(n: number) { return n.toLocaleString('nb-NO') }
function nights(ci: string, co: string) {
  return Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86400000)
}

type Booking = { id: string; guest_name: string; check_in: string; check_out: string; price_per_night: number; cleaning_fee: number; status: string }
type Expense = { id: string; category: string; amount: number; description: string | null; date: string }

export default function EconomyPage() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [tab, setTab]     = useState<'oversikt'|'utgifter'>('oversikt')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showAdd, setShowAdd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({ category: 'electricity', amount: '', description: '', date: '' })

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const uid = session.user.id

    // Hent bookingar som overlapper med månaden
    const from = `${year}-${String(month).padStart(2,'0')}-01`
    const to   = `${year}-${String(month).padStart(2,'0')}-${new Date(year, month, 0).getDate()}`

    const { data: b } = await supabase
      .from('bookings')
      .select('id, guest_name, check_in, check_out, price_per_night, cleaning_fee, status')
      .eq('user_id', uid)
      .neq('status', 'cancelled')
      .lte('check_in', to)
      .gte('check_out', from)
      .order('check_in')

    // Hent utgifter frå economy_entries
    const { data: e } = await supabase
      .from('economy_entries')
      .select('id, category, amount, description, date')
      .eq('user_id', uid)
      .eq('type', 'expense')
      .gte('date', from)
      .lte('date', to)
      .order('date')

    setBookings(b ?? [])
    setExpenses(e ?? [])
  }

  useEffect(() => { load() }, [year, month])

  function prevMonth() { if (month===1){setMonth(12);setYear(y=>y-1)}else setMonth(m=>m-1) }
  function nextMonth() { if (month===12){setMonth(1);setYear(y=>y+1)}else setMonth(m=>m+1) }

  const totalInntekt  = bookings.reduce((a, b) => a + nights(b.check_in, b.check_out) * b.price_per_night + b.cleaning_fee, 0)
  const totalUtgifter = expenses.reduce((a, e) => a + e.amount, 0)
  const netto         = totalInntekt - totalUtgifter

  async function handleAdd() {
    if (!form.amount || !form.date) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('economy_entries').insert({
      user_id: session.user.id,
      type: 'expense',
      category: form.category,
      amount: +form.amount,
      description: form.description || null,
      date: form.date,
      booking_id: null,
    })
    setSaving(false)
    setShowAdd(false)
    setForm({ category: 'electricity', amount: '', description: '', date: '' })
    load()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('economy_entries').delete().eq('id', id)
    setDeleting(null)
    load()
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pt-2">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1 text-[var(--c-muted)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <h1 className="display text-2xl capitalize">{MONTHS[month-1]} {year}</h1>
          <button onClick={nextMonth} className="p-1 text-[var(--c-muted)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
        </div>
      </div>

      {/* Summakort */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="card text-center py-3">
          <div className="text-xs text-[var(--c-muted)] mb-1">Inntekt</div>
          <div className="font-semibold text-[var(--c-accent)]">{fmt(totalInntekt)}</div>
          <div className="text-xs text-[var(--c-muted)]">kr</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xs text-[var(--c-muted)] mb-1">Utgifter</div>
          <div className="font-semibold text-[var(--c-red)]">{fmt(totalUtgifter)}</div>
          <div className="text-xs text-[var(--c-muted)]">kr</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xs text-[var(--c-muted)] mb-1">Netto</div>
          <div className={`font-semibold ${netto >= 0 ? 'text-[var(--c-accent)]' : 'text-[var(--c-red)]'}`}>{fmt(netto)}</div>
          <div className="text-xs text-[var(--c-muted)]">kr</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['oversikt','utgifter'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors
              ${tab===t ? 'bg-[var(--c-accent)] text-white border-[var(--c-accent)]'
                        : 'bg-[var(--c-surface)] text-[var(--c-muted)] border-[var(--c-border)]'}`}>
            {t === 'oversikt' ? 'Bookingar' : 'Utgifter'}
          </button>
        ))}
      </div>

      {/* Bookingar */}
      {tab === 'oversikt' && (
        <>
          {bookings.length === 0
            ? <div className="card text-sm text-[var(--c-muted)]">Ingen bookingar denne månaden</div>
            : <div className="card">
                {bookings.map((b, i) => {
                  const n = nights(b.check_in, b.check_out)
                  const total = n * b.price_per_night + b.cleaning_fee
                  return (
                    <div key={b.id} className={`py-3 ${i < bookings.length-1 ? 'border-b border-[var(--c-border)]' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">{b.guest_name || 'Airbnb-gjest'}</div>
                          <div className="text-xs text-[var(--c-muted)] mt-0.5">
                            {new Date(b.check_in).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
                            {' – '}
                            {new Date(b.check_out).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
                            {' · '}{n} netter
                          </div>
                          <div className="text-xs text-[var(--c-muted)]">
                            {fmt(b.price_per_night)} kr/natt + {fmt(b.cleaning_fee)} kr vask
                          </div>
                        </div>
                        <div className="font-semibold text-[var(--c-accent)]">{fmt(total)} kr</div>
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 mt-1 border-t border-[var(--c-border)] flex justify-between">
                  <span className="text-sm text-[var(--c-muted)]">Totalt</span>
                  <span className="font-semibold text-sm">{fmt(totalInntekt)} kr</span>
                </div>
              </div>
          }
        </>
      )}

      {/* Utgifter */}
      {tab === 'utgifter' && (
        <>
          {expenses.length === 0
            ? <div className="card text-sm text-[var(--c-muted)] mb-3">Ingen utgifter denne månaden</div>
            : <div className="card mb-3">
                {expenses.map((e, i) => (
                  <div key={e.id} className={`flex justify-between items-center py-2.5 ${i < expenses.length-1 ? 'border-b border-[var(--c-border)]' : ''}`}>
                    <div>
                      <div className="font-medium text-sm">{EXPENSE_CATS[e.category] ?? e.category}</div>
                      {e.description && <div className="text-xs text-[var(--c-muted)]">{e.description}</div>}
                      <div className="text-xs text-[var(--c-muted)]">{new Date(e.date).toLocaleDateString('nb-NO')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--c-red)] text-sm">{fmt(e.amount)} kr</span>
                      <button onClick={() => handleDelete(e.id)} disabled={deleting===e.id}
                        className="text-[var(--c-muted)] text-lg leading-none">×</button>
                    </div>
                  </div>
                ))}
              </div>
          }
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Legg til utgift</button>
        </>
      )}

      {/* Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAdd(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-4">Ny utgift</h2>
            <label className="block mb-3">
              <span className="field-label">Kategori</span>
              <select className="field-input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                {Object.entries(EXPENSE_CATS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block mb-3">
              <span className="field-label">Beløp (kr)</span>
              <input type="number" className="field-input" value={form.amount}
                onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="0" />
            </label>
            <label className="block mb-3">
              <span className="field-label">Dato</span>
              <input type="date" className="field-input" value={form.date}
                onChange={e=>setForm(p=>({...p,date:e.target.value}))} />
            </label>
            <label className="block mb-4">
              <span className="field-label">Beskriving (valfritt)</span>
              <input type="text" className="field-input" value={form.description}
                onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Eks: Straumrekning mai" />
            </label>
            <button className="btn btn-primary mb-2" onClick={handleAdd} disabled={saving}>
              {saving ? 'Lagrar...' : 'Lagre utgift'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  )
}
