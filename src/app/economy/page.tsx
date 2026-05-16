'use client'
// src/app/economy/page.tsx
import { useState, useEffect } from 'react'
import { getEconomyEntries, getMonthlySummary, getBookingPnl, createEconomyEntry } from '@/lib/supabase'
import type { EconomyEntry, MonthlyEconomy, BookingPnl } from '@/types/database'

const INCOME_CATS  = ['booking_revenue','cleaning_fee','other_income']
const EXPENSE_CATS = ['electricity','insurance','maintenance','consumables','platform_fee','other']
const CAT_LABELS: Record<string,string> = {
  booking_revenue:'Bookinginntekt', cleaning_fee:'Vaskegebyr', other_income:'Anna inntekt',
  electricity:'Straum', insurance:'Forsikring', maintenance:'Vedlikehald',
  consumables:'Forbruksvarer', platform_fee:'Plattformgebyr', other:'Anna utgift'
}

function fmt(n: number) { return n.toLocaleString('nb-NO') }

export default function EconomyPage() {
  const now = new Date()
  const [year,  setYear]    = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth() + 1)
  const [tab,   setTab]     = useState<'income'|'expenses'|'bookings'|'trend'>('income')
  const [entries, setEntries]   = useState<EconomyEntry[]>([])
  const [monthly, setMonthly]   = useState<MonthlyEconomy[]>([])
  const [pnl,     setPnl]       = useState<BookingPnl[]>([])
  const [showAdd, setShowAdd]   = useState(false)
  const [saving,  setSaving]    = useState(false)
  const [form, setForm] = useState({ type:'income' as 'income'|'expense', category:'booking_revenue', amount:'', description:'', date:'' })

  const MONTHS = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des']

  async function load() {
    const [e, m, p] = await Promise.all([
      getEconomyEntries(year, month),
      getMonthlySummary(6),
      getBookingPnl()
    ])
    setEntries(e); setMonthly(m); setPnl(p)
  }

  useEffect(() => { load() }, [year, month])

  const income   = entries.filter(e => e.type === 'income').reduce((a,e) => a + e.amount, 0)
  const expenses = entries.filter(e => e.type === 'expense').reduce((a,e) => a + e.amount, 0)
  const net      = income - expenses

  function prevMonth() { if (month===1){setMonth(12);setYear(y=>y-1)}else setMonth(m=>m-1) }
  function nextMonth() { if (month===12){setMonth(1);setYear(y=>y+1)}else setMonth(m=>m+1) }

  async function handleAdd() {
    if (!form.amount || !form.date) return
    setSaving(true)
    await createEconomyEntry({
      booking_id: null,
      type: form.type,
      category: form.category,
      amount: +form.amount,
      description: form.description || null,
      date: form.date
    })
    setSaving(false); setShowAdd(false); load()
  }

  const incomeEntries  = entries.filter(e => e.type === 'income')
  const expenseEntries = entries.filter(e => e.type === 'expense')

  return (
    <div className="p-4">
      <div className="mb-4 pt-2">
        <div className="flex justify-center items-center gap-4 mb-3">
          <button onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--c-border)] text-[var(--c-muted)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
          </button>
          <h1 className="display text-2xl capitalize w-40 text-center">
            {['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'][month-1]} {year}
          </h1>
          <button onClick={nextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--c-border)] text-[var(--c-muted)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="w-full text-center text-sm text-[var(--c-accent)] font-medium py-1">
          + Legg til post
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2.5 mb-2">
        <div className="stat-card">
          <div className="text-xs text-[var(--c-muted)] mb-1">Inntekt</div>
          <div className="stat-val text-[var(--c-accent)]">{fmt(income)}</div>
          <div className="text-xs text-[var(--c-muted)]">kr</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[var(--c-muted)] mb-1">Utgifter</div>
          <div className="stat-val text-[var(--c-red)]">{fmt(expenses)}</div>
          <div className="text-xs text-[var(--c-muted)]">kr</div>
        </div>
      </div>
      <div className="stat-card mb-4">
        <div className="text-xs text-[var(--c-muted)] mb-1">Netto</div>
        <div className={`display text-4xl font-light ${net >= 0 ? 'text-[var(--c-accent)]' : 'text-[var(--c-red)]'}`}>
          {net >= 0 ? '' : '−'}{fmt(Math.abs(net))} kr
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {(['income','expenses','bookings','trend'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-colors
              ${tab===t ? 'bg-[var(--c-accent)] text-white border-[var(--c-accent)]'
                        : 'bg-[var(--c-surface)] text-[var(--c-muted)] border-[var(--c-border)]'}`}>
            {t==='income'?'Inntekter':t==='expenses'?'Utgifter':t==='bookings'?'Per booking':'Trend'}
          </button>
        ))}
      </div>

      {/* Income panel */}
      {tab === 'income' && (
        <>
          {incomeEntries.length === 0
            ? <div className="card text-sm text-[var(--c-muted)]">Ingen inntekter denne månaden</div>
            : <div className="card">
                {incomeEntries.map((e, i) => (
                  <div key={e.id} className={`py-2.5 ${i<incomeEntries.length-1?'border-b border-[var(--c-border)]':''}`}
                    style={{ borderLeft:'3px solid var(--c-accent)', paddingLeft:'10px' }}>
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">{CAT_LABELS[e.category] ?? e.category}</span>
                      <span className="font-medium text-[var(--c-accent)] text-sm">{fmt(e.amount)} kr</span>
                    </div>
                    {e.description && <div className="text-xs text-[var(--c-muted)] mt-0.5">{e.description}</div>}
                    <div className="text-xs text-[var(--c-muted)]">{new Date(e.date).toLocaleDateString('nb-NO')}</div>
                  </div>
                ))}
              </div>
          }
        </>
      )}

      {/* Expenses panel */}
      {tab === 'expenses' && (
        <>
          {expenseEntries.length === 0
            ? <div className="card text-sm text-[var(--c-muted)]">Ingen utgifter denne månaden</div>
            : <div className="card">
                {expenseEntries.map((e, i) => (
                  <div key={e.id} className={`py-2.5 ${i<expenseEntries.length-1?'border-b border-[var(--c-border)]':''}`}
                    style={{ borderLeft:'3px solid var(--c-red)', paddingLeft:'10px' }}>
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">{CAT_LABELS[e.category] ?? e.category}</span>
                      <span className="font-medium text-[var(--c-red)] text-sm">{fmt(e.amount)} kr</span>
                    </div>
                    {e.description && <div className="text-xs text-[var(--c-muted)] mt-0.5">{e.description}</div>}
                    <div className="text-xs text-[var(--c-muted)]">{new Date(e.date).toLocaleDateString('nb-NO')}</div>
                  </div>
                ))}
              </div>
          }
        </>
      )}

      {/* Per booking P&L */}
      {tab === 'bookings' && (
        pnl.length === 0
          ? <div className="card text-sm text-[var(--c-muted)]">Ingen booking-data enno</div>
          : <div className="card">
              {pnl.map((b, i) => (
                <div key={b.id} className={`flex justify-between items-center py-2.5 ${i<pnl.length-1?'border-b border-[var(--c-border)]':''}`}>
                  <div>
                    <div className="font-medium text-sm">{b.guest_name}</div>
                    <div className="text-xs text-[var(--c-muted)]">
                      {new Date(b.check_in).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
                      {' – '}
                      {new Date(b.check_out).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}
                    </div>
                    <div className="text-xs text-[var(--c-muted)]">
                      {fmt(b.income)} inn · {fmt(b.expenses)} ut
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`display text-xl ${b.net>=0?'text-[var(--c-accent)]':'text-[var(--c-red)]'}`}>
                      {fmt(b.net)} kr
                    </div>
                    <div className="text-xs text-[var(--c-muted)]">netto</div>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* Monthly trend */}
      {tab === 'trend' && (
        <div className="card">
          {monthly.map((m, i) => {
            const d = new Date(m.month)
            const maxNet = Math.max(...monthly.map(x => Math.abs(x.net)), 1)
            return (
              <div key={i} className={`py-2.5 ${i<monthly.length-1?'border-b border-[var(--c-border)]':''}`}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm capitalize">{d.toLocaleString('nb-NO',{month:'long',year:'numeric'})}</span>
                  <span className={`font-medium text-sm ${m.net>=0?'text-[var(--c-accent)]':'text-[var(--c-red)]'}`}>
                    {m.net>=0?'+':''}{fmt(m.net)} kr
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--c-border)] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.net>=0?'bg-[var(--c-accent)]':'bg-[var(--c-red)]'}`}
                    style={{ width: `${Math.round(Math.abs(m.net)/maxNet*100)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAdd(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-4">Legg til post</h2>

            <div className="flex gap-2 mb-3">
              {(['income','expense'] as const).map(t => (
                <button key={t} onClick={() => setForm(p=>({...p,type:t,category:t==='income'?'booking_revenue':'electricity'}))}
                  className={`flex-1 btn ${form.type===t?'btn-primary':'btn-secondary'} py-2.5 text-sm`}>
                  {t==='income'?'Inntekt':'Utgift'}
                </button>
              ))}
            </div>

            <label className="block mb-3">
              <span className="field-label">Kategori</span>
              <select className="field-input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                {(form.type==='income'?INCOME_CATS:EXPENSE_CATS).map(c=>(
                  <option key={c} value={c}>{CAT_LABELS[c]}</option>
                ))}
              </select>
            </label>
            <label className="block mb-3">
              <span className="field-label">Beløp (kr)</span>
              <input type="number" className="field-input" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="0" />
            </label>
            <label className="block mb-3">
              <span className="field-label">Dato</span>
              <input type="date" className="field-input" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} />
            </label>
            <label className="block mb-4">
              <span className="field-label">Beskriving (valfritt)</span>
              <input type="text" className="field-input" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Eks: Straumrekning mai" />
            </label>

            <button className="btn btn-primary mb-2" onClick={handleAdd} disabled={saving}>
              {saving?'Lagrar...':'Lagre post'}
            </button>
            <button className="btn btn-secondary" onClick={()=>setShowAdd(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  )
}
