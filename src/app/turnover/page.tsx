'use client'
import { useState, useEffect } from 'react'
import { supabase, getTurnoverTasks, createTurnover, getTurnoverWithTasks, toggleTurnoverTask, completeTurnover, createDamageReport, uploadDamageImage } from '@/lib/supabase'
import type { TurnoverTask, TurnoverTaskLog, Turnover } from '@/types/database'

type LocalTask = TurnoverTask & {
  done: boolean
  logId?: string
  avgSeconds?: number
  completedAt?: number
}

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m/60)}t ${m%60}min`
}

export default function TurnoverPage() {
  const [tasks, setTasks]           = useState<LocalTask[]>([])
  const [turnover, setTurnover]     = useState<Turnover | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showDamage, setShowDamage] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<number | null>(null)
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [damage, setDamage] = useState({
    room: 'bad' as const, description: '', priority: 'medium' as const
  })

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const stored = localStorage.getItem('turnover_id_' + today)

    async function loadAvgTimes(): Promise<Record<string, number>> {
      const { data } = await supabase.from('task_time_averages').select('task_id, avg_seconds')
      const map: Record<string, number> = {}
      data?.forEach((r: { task_id: string; avg_seconds: number }) => {
        map[r.task_id] = r.avg_seconds
      })
      return map
    }

    if (stored) {
      Promise.all([
        getTurnoverWithTasks(stored),
        loadAvgTimes()
      ]).then(([{ turnover: t, tasks: logs }, avgs]) => {
        setTurnover(t)
        setTasks(logs.map(l => ({
          ...(l.task as TurnoverTask),
          done: l.completed,
          logId: l.id,
          avgSeconds: avgs[l.task?.id ?? '']
        })))
        setLoading(false)
      })
    } else {
      Promise.all([
        getTurnoverTasks(),
        loadAvgTimes()
      ]).then(([tmpl, avgs]) => {
        setTasks(tmpl.map(t => ({ ...t, done: false, avgSeconds: avgs[t.id] })))
        setLoading(false)
      })
    }
  }, [])

  function applyLogs(logs: TurnoverTaskLog[], avgs: Record<string, number>) {
    setTasks(logs.map(l => ({
      ...(l.task as TurnoverTask),
      done: l.completed,
      logId: l.id,
      avgSeconds: avgs[(l.task as TurnoverTask)?.id ?? '']
    })))
  }

  async function startTurnover() {
    const today = new Date().toISOString().split('T')[0]
    const t = await createTurnover(null, today)
    localStorage.setItem('turnover_id_' + today, t.id)
    const { tasks: logs } = await getTurnoverWithTasks(t.id)
    const { data: avgData } = await supabase.from('task_time_averages').select('task_id, avg_seconds')
    const avgs: Record<string, number> = {}
    avgData?.forEach((r: { task_id: string; avg_seconds: number }) => { avgs[r.task_id] = r.avg_seconds })
    setTurnover(t)
    applyLogs(logs, avgs)
    // Start tidsregistrering automatisk
    setLastCheckTime(Date.now())
  }

  async function toggleTask(index: number) {
    if (!turnover) return
    const task = tasks[index]
    const newDone = !task.done
    const now = Date.now()

    if (newDone) {
      // Bruk lastCheckTime, eller now minus 30s som fallback viss det er fyrste avhuking
      const fromTime = lastCheckTime ?? (now - 30000)
      const durationSeconds = Math.round((now - fromTime) / 1000)

      // Lagre alltid tida (fjerna 5-sekund-grensa som blokkerte lagring)
      if (durationSeconds > 0) {
        await supabase.from('task_time_history').insert({
          task_id: task.id,
          turnover_id: turnover.id,
          duration_seconds: durationSeconds
        }).then(({ error }) => {
          if (error) console.error('Feil ved lagring av tid:', error)
        })
      }

      setLastCheckTime(now)
    }

    setTasks(prev => prev.map((t, i) => i === index ? { ...t, done: newDone, completedAt: newDone ? now : undefined } : t))
    if (task.logId) {
      await toggleTurnoverTask(task.logId, newDone).catch(() => {})
    }
  }

  async function handleComplete() {
    if (!turnover) return
    await completeTurnover(turnover.id)
    const today = new Date().toISOString().split('T')[0]
    localStorage.removeItem('turnover_id_' + today)
    alert('Turnover fullført! 🎉')
    window.location.reload()
  }

  async function resetAllTimes() {
    const ok = window.confirm('Er du sikker? Dette slettar alle tidsdata og estimata startar på nytt.')
    if (!ok) return
    await supabase.from('task_time_history').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    // Nullstill localStorage så "Start turnover-sesjon"-knappen kjem tilbake
    const today = new Date().toISOString().split('T')[0]
    localStorage.removeItem('turnover_id_' + today)
    setTurnover(null)
    setLastCheckTime(null)
    setTasks(prev => prev.map(t => ({ ...t, done: false, avgSeconds: undefined, logId: undefined })))
    alert('Alle tider er nullstilte! Du kan no starta ein ny sesjon.')
  }

  async function handleDamageSubmit() {
    setSaving(true)
    try {
      let images: string[] = []
      if (imageFile) {
        const url = await uploadDamageImage(imageFile)
        images = [url]
      }
      await createDamageReport({
        booking_id: null, turnover_id: turnover?.id ?? null,
        room: damage.room, description: damage.description,
        priority: damage.priority, status: 'open',
        images, repair_cost: null, resolved_at: null, notes: null
      })
      setShowDamage(false)
      alert('Skade meldt!')
    } finally { setSaving(false) }
  }

  const done  = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct   = total > 0 ? Math.round(done / total * 100) : 0

  const remSeconds = tasks
    .filter(t => !t.done && t.avgSeconds)
    .reduce((a, t) => a + (t.avgSeconds ?? 0), 0)

  if (loading) return <div className="p-4"><div className="card animate-pulse h-40" /></div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-4 pt-2">
        <h1 className="display text-3xl">Turnover</h1>
        <div className="text-right">
          <div className="display text-2xl text-[var(--c-accent)]">{pct}%</div>
          <div className="text-xs text-[var(--c-muted)]">Ferdig</div>
        </div>
      </div>

      <div className="h-1.5 bg-[var(--c-border)] rounded-full mb-4 overflow-hidden">
        <div className="h-full rounded-full bg-[var(--c-accent)] transition-all duration-500"
          style={{ width: `${pct}%` }} />
      </div>

      <div className="card mb-4">
        <div className="text-xs text-[var(--c-muted)] mb-1">Estimert tid att</div>
        <div className="display text-2xl">
          {pct === 100
            ? 'Ferdig! 🎉'
            : remSeconds > 0
              ? fmtTime(remSeconds)
              : tasks.filter(t => !t.done).length > 0
                ? 'Ingen data enno — blir betre etter første sesjon'
                : 'Ferdig! 🎉'
          }
        </div>
        <div className="text-xs text-[var(--c-muted)] mt-1">{done} av {total} oppgåver fullført</div>
      </div>

      {!turnover && (
        <button className="btn btn-secondary mb-3" onClick={startTurnover}>
          ▶ Start turnover-sesjon
        </button>
      )}

      <p className="section-lbl">Sjekkliste</p>
      <div className="card">
        {tasks.map((task, i) => (
          <div key={task.id}
            className={`flex items-center gap-3 py-3 cursor-pointer
              ${i < tasks.length - 1 ? 'border-b border-[var(--c-border)]' : ''}`}
            onClick={() => toggleTask(i)}
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleTask(i)}
              onClick={e => e.stopPropagation()}
              className="w-5 h-5 accent-[var(--c-accent)] flex-shrink-0"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
              <span className={`text-sm ${task.done ? 'line-through text-[var(--c-muted)]' : ''}`}>
                {task.name}
              </span>
              {task.avgSeconds && (
                <span className="text-xs ml-3 flex-shrink-0" style={{ color: 'var(--c-muted)' }}>
                  vanlegvis {fmtTime(task.avgSeconds)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {pct === 100 && turnover && (
          <button className="btn btn-primary" onClick={handleComplete}>
            ✓ Merk turnover som fullført
          </button>
        )}
        <button className="btn btn-secondary"
          onClick={() => setTasks(prev => prev.map(t => ({ ...t, done: false })))}>
          ↺ Nullstill sjekkliste
        </button>
        <button className="btn btn-secondary" onClick={resetAllTimes}>
          🕐 Nullstill alle tider
        </button>
        <button className="btn"
          style={{ background: 'var(--c-red-lt)', color: 'var(--c-red)', border: `1px solid var(--c-red)` }}
          onClick={() => setShowDamage(true)}>
          ⚠ Meld skade
        </button>
      </div>

      {showDamage && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDamage(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-4">Skaderapport</h2>
            <label className="block mb-3">
              <span className="field-label">Rom / Område</span>
              <select className="field-input" value={damage.room}
                onChange={e => setDamage(p => ({ ...p, room: e.target.value as any }))}>
                {(['soverom','bad','kjøkken','stove','gang','utvendig','anna'] as const).map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
                ))}
              </select>
            </label>
            <label className="block mb-3">
              <span className="field-label">Prioritet</span>
              <select className="field-input" value={damage.priority}
                onChange={e => setDamage(p => ({ ...p, priority: e.target.value as any }))}>
                <option value="high">🔴 Høg – løysast omgåande</option>
                <option value="medium">🟡 Middels – innan ei veke</option>
                <option value="low">🟢 Låg – kan vente</option>
              </select>
            </label>
            <label className="block mb-3">
              <span className="field-label">Beskriving</span>
              <textarea className="field-input h-20 resize-none" value={damage.description}
                onChange={e => setDamage(p => ({ ...p, description: e.target.value }))}
                placeholder="Kva har skjedd?" />
            </label>
            <label className="block mb-4">
              <span className="field-label">Bilete (valfritt)</span>
              <input type="file" accept="image/*" capture="environment" className="field-input"
                onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
            </label>
            <button className="btn mb-2"
              style={{ background: 'var(--c-red)', color: '#fff' }}
              onClick={handleDamageSubmit} disabled={saving || !damage.description}>
              {saving ? 'Lagrar...' : 'Meld skade'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowDamage(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  )
}
