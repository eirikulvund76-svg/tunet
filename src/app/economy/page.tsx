'use client'
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
  return Math.max(0, Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86400000))
}

type Booking = { id: string; guest_name: string; check_in: string; check_out: string; price_per_night: number; cleaning_fee: number; status: string }
type Expense = { id: string; category: string; amount: number; description: string | null; date: string }

export default function EconomyPage() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [tab, setTab]     = useState<'bookingar'|'utgifter'>('bookingar')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError]       = useState('')
  const [form, setForm] = useState({ category: 'electricity', amount: '', description: '', date: '' })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const uid = session.user.id

      const from = `${year}-${String(month).padStart(2,'0')}-01`
      const to   = `${year}-${String(month).padStart(2,'0')}-${new Date(year, month, 0).getDate()}`

      const [bRes, eRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, guest_name, check_in, check_out, price_per_night, cleaning_fee, status')
          .eq('user_id', uid)
          .neq('status', 'cancelled')
          .lte('check_in', to)
          .gte('check_out', from)
          .order('check_in'),
        supabase
          .from('economy_entries')
          .select('id, category, amount, description, date')
          .eq('user_id', uid)
          .eq('type', 'expense')
          .gte('date', from)
          .lte('date', to)
          .order('date'),
      ])

      setBookings(bRes.data ?? [])
      setExpenses(eRes.data ?? [])
    } catch {
      setError('Kunne ikkje laste økonomidata. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [year, month])

  function prevMonth() { if (month===1){setMonth(12);setYear(y=>y-1)}else setMonth(m=>m-1) }
  function nextMonth() { if (month===12){setMonth(1);setYear(y=>y+1)}else setMonth(m=>m+1) }

  const totalInntekt  = bookings.reduce((a, b) => a + nights(b.check_in, b.check_out) * b.price_per_night + b.cleaning_fee, 0)
  const totalUtgifter = expenses.reduce((a, e) => a + e.amount, 0)
  const netto         = totalInntekt - totalUtgifter

  async function handleAdd() {
    if (!form.amount || !form.date) {
      setError('Fyll inn beløp og dato.')
      return
    }
    setSaving(true)
    setError('')
    try {
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
      setShowAdd(false)
      setForm({ category: 'electricity', amount: '', description: '', date: '' })
      load()
    } catch {
      setError('Kunne ikkje lagre utgift. Prøv igjen.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await supabase.from('economy_entries').delete().eq('id', id)
      load()
    } catch {
      setError('Kunne ikkje slette. Prøv igjen.')
    } finally {
      setDeleting(null)
    }
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

      {error && (
        <div className="mb-3 p-3 rounded-xl text-sm" style={{ background: 'var(--c-red-lt)', color: 'var(--c-red)' }}>
          {error}
        </div>
      )}

      {/* Summakort */}
      {loading ? (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1,2,3].map(i => <div key={i} className="card animate-pulse h-16" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="card text-center py-3">
            <div className="text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Inntekt</div>
            <div className="font-semibold" style={{ color: 'var(--c-accent)' }}>{fmt(totalInntekt)}</div>
            <div className="text-xs" style={{ color: 'var(--c-muted)' }}>kr</div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Utgifter</div>
            <div className="font-semibold" style={{ color: 'var(--c-red)' }}>{fmt(totalUtgifter)}</div>
            <div className="text-xs" style={{ color: 'var(--c-muted)' }}>kr</div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Netto</div>
            <div className="font-semibold" style={{ color: netto >= 0 ? 'var(--c-accent)' : 'var(--c-red)' }}>{fmt(netto)}</div>
            <div className="text-xs" style={{ color: 'var(--c-muted)' }}>kr</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['bookingar','utgifter'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors
              ${tab===t ? 'bg-[var(--c-accent)] text-white border-[var(--c-accent)]'
                        : 'bg-[var(--c-surface)] text-[var(--c-muted)] border-[var(--c-border)]'}`}>
            {t === 'bookingar' ? 'Bookingar' : 'Utgifter'}
          </button>
        ))}
      </div>

      {/* Bookingar */}
      {tab === 'bookingar' && (
        loading ? (
          <div className="card animate-pulse h-40" />
        ) : bookings.length === 0 ? (
          <div className="card text-sm" style={{ color: 'var(--c-muted)' }}>
            Ingen bookingar denne månaden
          </div>
        ) : (
          <div className="card">
            {bookings.map((b, i) => {
              const n = nights(b.check_in, b.check_out)
              const total = n * b.price_per_night + b.cleaning_fee
              return (
                <div key={b.id} className={`flex justify-between items-center py-3 ${i < bookings.length-1 ? 'border-b border-[var(--c-border)]' : ''}`}>
                  <div>
                    <div className="font-medium text-sm">{b.guest_name || 'Airbnb-gjest'}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                      {new Date(b.check_in).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
                      {' – '}
                      {new Date(b.check_out).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
                      {' · '}{n} netter
                    </div>
                  </div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--c-accent)' }}>{fmt(total)} kr</div>
                </div>
              )
            })}
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-[var(--c-border)]">
              <span className="text-sm" style={{ color: 'var(--c-muted)' }}>Totalt denne månaden</span>
              <span className="font-semibold text-sm">{fmt(totalInntekt)} kr</span>
            </div>
          </div>
        )
      )}

      {/* Utgifter */}
      {tab === 'utgifter' && (
        <>
          {loading ? (
            <div className="card animate-pulse h-40 mb-3" />
          ) : expenses.length === 0 ? (
            <div className="card text-sm mb-3" style={{ color: 'var(--c-muted)' }}>
              Ingen utgifter denne månaden
            </div>
          ) : (
            <div className="card mb-3">
              {expenses.map((e, i) => (
                <div key={e.id} className={`flex justify-between items-center py-2.5 ${i < expenses.length-1 ? 'border-b border-[var(--c-border)]' : ''}`}>
                  <div>
                    <div className="font-medium text-sm">{EXPENSE_CATS[e.category] ?? e.category}</div>
                    {e.description && <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{e.description}</div>}
                    <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{new Date(e.date).toLocaleDateString('nb-NO')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: 'var(--c-red)' }}>{fmt(e.amount)} kr</span>
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={deleting === e.id}
                      className="text-[var(--c-muted)] text-lg leading-none"
                    >×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-primary" onClick={() => { setShowAdd(true); setError('') }}>
            + Legg til utgift
          </button>
        </>
      )}

      {/* Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAdd(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-4">Ny utgift</h2>

            {error && (
              <div className="mb-3 p-3 rounded-lg text-sm" style={{ background: 'var(--c-red-lt)', color: 'var(--c-red)' }}>
                {error}
              </div>
            )}

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
