'use client'
// src/app/turnover/page.tsx
import { useState, useEffect } from 'react'
import { getTurnoverTasks, createTurnover, getTurnoverWithTasks, toggleTurnoverTask, completeTurnover, createDamageReport, uploadDamageImage } from '@/lib/supabase'
import type { TurnoverTask, TurnoverTaskLog, Turnover } from '@/types/database'

type LocalTask = TurnoverTask & { done: boolean; logId?: string }

export default function TurnoverPage() {
  const [tasks, setTasks]           = useState<LocalTask[]>([])
  const [turnover, setTurnover]     = useState<Turnover | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showDamage, setShowDamage] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [numGuests, setNumGuests] = useState('')
  const [pendingTurnover, setPendingTurnover] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [damage, setDamage] = useState({
    room: 'bad' as const, description: '', priority: 'medium' as const
  })

  // Load or create today's turnover
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const stored = localStorage.getItem('turnover_id_' + today)

    if (stored) {
      getTurnoverWithTasks(stored).then(({ turnover: t, tasks: logs }) => {
        setTurnover(t)
        applyLogs(logs)
        setLoading(false)
      })
    } else {
      // Load template tasks for offline-first use
      getTurnoverTasks().then(tmpl => {
        setTasks(tmpl.map(t => ({ ...t, done: false })))
        setLoading(false)
      })
    }
  }, [])

  function applyLogs(logs: TurnoverTaskLog[]) {
    setTasks(logs.map(l => ({
      ...(l.task as TurnoverTask),
      done: l.completed,
      logId: l.id
    })))
  }

  async function startTurnover() {
    setShowGuestModal(true)
  }

  async function confirmStartTurnover() {
    setPendingTurnover(true)
    const today = new Date().toISOString().split('T')[0]
    const t = await createTurnover(null, today)
    localStorage.setItem('turnover_id_' + today, t.id)

    // Oppdater bookinga med antal gjester viss det finst ei aktiv booking
    if (numGuests && parseInt(numGuests) > 0) {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const today2 = new Date().toISOString().split('T')[0]
        await supabase
          .from('bookings')
          .update({ num_guests: parseInt(numGuests) })
          .eq('user_id', session.user.id)
          .lte('check_in', today2)
          .gte('check_out', today2)
          .neq('status', 'cancelled')
      }
    }

    const { tasks: logs } = await getTurnoverWithTasks(t.id)
    setTurnover(t)
    applyLogs(logs)
    setShowGuestModal(false)
    setNumGuests('')
    setPendingTurnover(false)
  }

  async function toggleTask(index: number) {
    const task = tasks[index]
    const newDone = !task.done
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, done: newDone } : t))
    if (task.logId) {
      await toggleTurnoverTask(task.logId, newDone).catch(() => {})
    }
  }

  async function handleComplete() {
    if (!turnover) return
    await completeTurnover(turnover.id)
    alert('Turnover fullført! 🎉')
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

  const done    = tasks.filter(t => t.done).length
  const total   = tasks.length
  const pct     = total > 0 ? Math.round(done / total * 100) : 0
  const remMin  = tasks.filter(t => !t.done).reduce((a, t) => a + t.est_minutes, 0)
  const hours   = Math.floor(remMin / 60)
  const mins    = remMin % 60

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

      {/* Progress bar */}
      <div className="h-1.5 bg-[var(--c-border)] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--c-accent)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Time estimate */}
      <div className="card mb-4">
        <div className="text-xs text-[var(--c-muted)] mb-1">Estimert arbeidstid att</div>
        <div className="display text-2xl">
          {remMin === 0 ? 'Ferdig! 🎉' : `${hours > 0 ? hours + 't ' : ''}${mins}min`}
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
            className={`flex items-center gap-3 py-2.5 cursor-pointer
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
            <span className={`flex-1 text-sm ${task.done ? 'line-through text-[var(--c-muted)]' : ''}`}>
              {task.name}
            </span>
            <span className="text-xs text-[var(--c-muted)] whitespace-nowrap">{task.est_minutes} min</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {pct === 100 && turnover && (
          <button className="btn btn-primary" onClick={handleComplete}>
            ✓ Merk turnover som fullført
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => setTasks(prev => prev.map(t => ({ ...t, done: false })))}>
          ↺ Nullstill sjekkliste
        </button>
        <button className="btn" style={{ background: 'var(--c-red-lt)', color: 'var(--c-red)', border: `1px solid var(--c-red)` }}
          onClick={() => setShowDamage(true)}>
          ⚠ Meld skade
        </button>
      </div>

      {/* Gjeste-modal */}
      {showGuestModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowGuestModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-2">Start turnover</h2>
            <p className="text-sm text-[var(--c-muted)] mb-4">
              Kor mange gjester skal bu her?
            </p>
            <label className="block mb-5">
              <span className="field-label">Antal gjester</span>
              <input
                type="number"
                className="field-input"
                value={numGuests}
                onChange={e => setNumGuests(e.target.value)}
                placeholder="T.d. 2"
                min={1}
                max={20}
                autoFocus
              />
            </label>
            <button
              className="btn btn-primary mb-2"
              onClick={confirmStartTurnover}
              disabled={pendingTurnover || !numGuests}
            >
              {pendingTurnover ? 'Startar...' : 'Start turnover'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowGuestModal(false)}>Avbryt</button>
          </div>
        </div>
      )}

      {/* Damage modal */}
      {showDamage && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDamage(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-4">Skaderapport</h2>

            <label className="block mb-3">
              <span className="field-label">Rom / Område</span>
              <select className="field-input" value={damage.room} onChange={e => setDamage(p => ({ ...p, room: e.target.value as any }))}>
                {(['soverom','bad','kjøkken','stove','gang','utvendig','anna'] as const).map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
                ))}
              </select>
            </label>

            <label className="block mb-3">
              <span className="field-label">Prioritet</span>
              <select className="field-input" value={damage.priority} onChange={e => setDamage(p => ({ ...p, priority: e.target.value as any }))}>
                <option value="high">🔴 Høg – løysast omgåande</option>
                <option value="medium">🟡 Middels – innan ei veke</option>
                <option value="low">🟢 Låg – kan vente</option>
              </select>
            </label>

            <label className="block mb-3">
              <span className="field-label">Beskriving</span>
              <textarea className="field-input h-20 resize-none" value={damage.description}
                onChange={e => setDamage(p => ({ ...p, description: e.target.value }))}
                placeholder="Kva har skjedd? Ver spesifikk – eks: Sprekk i flisa ved dusjen, ca 10cm." />
            </label>

            <label className="block mb-4">
              <span className="field-label">Bilete (valfritt)</span>
              <input type="file" accept="image/*" capture="environment" className="field-input"
                onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
            </label>

            <button className="btn mb-2" style={{ background: 'var(--c-red)', color: '#fff' }}
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
