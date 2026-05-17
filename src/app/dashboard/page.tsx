'use client'
import { useEffect, useState } from 'react'
import { supabase, getNextBooking, getLowStockItems, getMonthlySummary } from '@/lib/supabase'
import { useProfile } from '@/components/ui/ProfileProvider'
import type { Booking, InventoryItem, MonthlyEconomy } from '@/types/database'

const TODAY = new Date().toISOString().split('T')[0]

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('nb-NO', { day:'numeric', month:'long' })
}

function nights(b: Booking) {
  return Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000)
}

async function loadTasks(): Promise<Record<string, boolean>> {
  const { data } = await supabase.from('daily_tasks').select('task_key, done').eq('date', TODAY)
  const result: Record<string, boolean> = {}
  data?.forEach((r: { task_key: string; done: boolean }) => { result[r.task_key] = r.done })
  return result
}

async function toggleTask(key: string, done: boolean) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  await supabase.from('daily_tasks').upsert(
    { date: TODAY, task_key: key, done, user_id: session.user.id },
    { onConflict: 'date,task_key' }
  )
}

export default function Dashboard() {
  const profile = useProfile()
  const [nextBooking, setNextBooking] = useState<Booking | null>(null)
  const [lowStock, setLowStock]       = useState<InventoryItem[]>([])
  const [monthlyEco, setMonthlyEco]   = useState<MonthlyEconomy | null>(null)
  const [loading, setLoading]         = useState(true)
  const [checked, setChecked]         = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([
      getNextBooking(),
      getLowStockItems(),
      getMonthlySummary(1),
      loadTasks(),
    ]).then(([booking, stock, eco, tasks]) => {
      setNextBooking(booking as Booking | null)
      setLowStock(stock as InventoryItem[])
      setMonthlyEco((eco as MonthlyEconomy[])[0] ?? null)
      setChecked(tasks as Record<string, boolean>)
      setLoading(false)
    })
  }, [])

  async function toggle(key: string) {
    const newVal = !checked[key]
    setChecked(prev => ({ ...prev, [key]: newVal }))
    await toggleTask(key, newVal)
  }

  const month = new Date().toLocaleString('nb-NO', { month:'long', year:'numeric' })

  function Task({ taskKey, label, badge, badgeClass }: {
    taskKey: string, label: string, badge: string, badgeClass: string
  }) {
    const done = !!checked[taskKey]
    return (
      <div className="flex justify-between items-center py-2.5 border-b border-[var(--c-border)] cursor-pointer last:border-0"
        onClick={() => toggle(taskKey)}>
        <div className="flex items-center gap-2.5">
          <input type="checkbox" checked={done} onChange={() => toggle(taskKey)}
            onClick={e => e.stopPropagation()} className="w-4 h-4 accent-[var(--c-accent)]" />
          <span className={`text-sm ${done ? 'line-through text-[var(--c-muted)]' : ''}`}>{label}</span>
        </div>
        <span className={`badge ${done ? 'badge-green' : badgeClass}`}>{done ? 'Ferdig' : badge}</span>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-5 pt-2">
        <div>
          <h1 className="display text-3xl leading-tight">{profile.house_name || 'Gardshuset'}</h1>
          {profile.house_location && (
            <p className="text-xs text-[var(--c-muted)] mt-0.5">{profile.house_location}</p>
          )}
        </div>
        <span className="badge badge-green mt-1">● Ledig</span>
      </div>

      <p className="section-lbl">Neste booking</p>
      {loading ? (
        <div className="card animate-pulse h-20" />
      ) : nextBooking ? (
        <div className="card" style={{ borderLeft: '3px solid var(--c-accent)' }}>
          <div className="text-base font-medium mb-0.5">{nextBooking.guest_name}</div>
          <div className="text-sm text-[var(--c-muted)] mb-2.5">
            {formatDate(nextBooking.check_in)} – {formatDate(nextBooking.check_out)}
            {' · '}{nights(nextBooking)} netter · {nextBooking.num_guests} gjester
          </div>
          <div className="flex gap-2 items-center">
            <span className="badge badge-green">Bekrefta</span>
            <span className="text-xs text-[var(--c-muted)]">{daysUntil(nextBooking.check_in)} dagar igjen</span>
          </div>
        </div>
      ) : (
        <div className="card text-sm text-[var(--c-muted)]">Ingen komande bookingar</div>
      )}

      <p className="section-lbl">Dagens oppgåver</p>
      <div className="card">
        {lowStock.map(item => (
          <Task key={item.id} taskKey={'stock_' + item.id}
            label={'Fyll på ' + item.name.toLowerCase()} badge="Lager" badgeClass="badge-amber" />
        ))}
        {nextBooking && daysUntil(nextBooking.check_in) <= 2 && (
          <Task taskKey={'turnover_' + nextBooking.id}
            label={'Klargjere til ' + nextBooking.guest_name} badge="Turnover" badgeClass="badge-blue" />
        )}
        <Task taskKey="kodeboks" label="Bytt kodeboks-kode" badge="Gjerast" badgeClass="badge-amber" />
        {lowStock.length === 0 && !nextBooking && (
          <div className="py-2 text-sm text-[var(--c-muted)]">Ingen oppgåver i dag 🎉</div>
        )}
      </div>

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

      {profile.cleaner_name && (
        <>
          <p className="section-lbl">Reinhaldar</p>
          <div className="card">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">{profile.cleaner_name}</div>
                {profile.cleaner_phone && (
                  <div className="text-xs text-[var(--c-muted)]">{profile.cleaner_phone}</div>
                )}
              </div>
              {profile.cleaner_phone && (
                <a href={`tel:${profile.cleaner_phone}`}
                  className="badge badge-green">Ring</a>
              )}
            </div>
          </div>
        </>
      )}

      <p className="section-lbl">Økonomi — {month}</p>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="stat-card">
          <div className="text-xs text-[var(--c-muted)] mb-1">Inntekt</div>
          <div className="stat-val text-[var(--c-accent)]">
            {monthlyEco ? monthlyEco.total_income.toLocaleString('nb-NO') : '—'}
          </div>
          <div className="text-xs text-[var(--c-muted)]">kr</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[var(--c-muted)] mb-1">Netto</div>
          <div className="stat-val text-[var(--c-accent)]">
            {monthlyEco ? monthlyEco.net.toLocaleString('nb-NO') : '—'}
          </div>
          <div className="text-xs text-[var(--c-muted)]">kr</div>
        </div>
      </div>
    </div>
  )
}
