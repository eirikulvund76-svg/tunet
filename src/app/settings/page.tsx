'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { syncIcalBookings } from '@/lib/ical'

type Profile = {
  house_name: string
  house_location: string
  bedrooms: number
  max_guests: number
  default_price: number
  default_cleaning: number
  cleaner_name: string
  cleaner_phone: string
  theme_color: string
  ical_url: string
}

const THEMES = [
  { id: 'green',  label: 'Skog',       color: '#2D5A27' },
  { id: 'blue',   label: 'Hav',        color: '#185FA5' },
  { id: 'amber',  label: 'Solnedgang', color: '#BA7517' },
  { id: 'red',    label: 'Høst',       color: '#A32D2D' },
  { id: 'purple', label: 'Lavendel',   color: '#6B3FA0' },
]

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    house_name: '', house_location: '', bedrooms: 2,
    max_guests: 4, default_price: 900, default_cleaning: 400,
    cleaner_name: '', cleaner_phone: '', theme_color: 'green', ical_url: ''
  })
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [email, setEmail]         = useState('')
  const [tasks, setTasks]         = useState<{id:string,name:string,est_minutes:number,is_active:boolean}[]>([])
  const [newTask, setNewTask]     = useState({ name: '', est_minutes: 15 })
  const [showAddTask, setShowAddTask] = useState(false)
  const [syncing, setSyncing]     = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setEmail(session.user.email ?? '')

      const { data: prof } = await supabase
        .from('user_profiles').select('*').eq('id', session.user.id).single()
      if (prof) setProfile({ ...profile, ...prof })

      const { data: t } = await supabase
        .from('turnover_tasks')
        .select('id, name, est_minutes, is_active')
        .eq('user_id', session.user.id)
        .order('sort_order')
      if (t) setTasks(t)

      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Ikkje innlogga')
      await supabase.from('user_profiles').upsert({ id: session.user.id, ...profile })
      applyTheme(profile.theme_color)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Lagring feila:', e)
    } finally {
      setSaving(false)
    }
  }

  async function handleSync() {
    if (!profile.ical_url) return
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncIcalBookings(profile.ical_url)
      setSyncResult(`✓ Synkronisert! ${result.created} nye bookingar, ${result.skipped} allereie lagra.`)
    } catch (e: any) {
      setSyncResult(`⚠ Feil: ${e.message}`)
    } finally {
      setSyncing(false)
    }
  }

  function applyTheme(colorId: string) {
    const theme = THEMES.find(t => t.id === colorId)
    if (theme) document.documentElement.style.setProperty('--c-accent', theme.color)
  }

  async function toggleTask(id: string, active: boolean) {
    await supabase.from('turnover_tasks').update({ is_active: !active }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_active: !active } : t))
  }

  async function deleteTask(id: string) {
    if (!confirm('Slett denne oppgåva?')) return
    await supabase.from('turnover_tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function addTask() {
    if (!newTask.name) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('turnover_tasks').insert({
      name: newTask.name, est_minutes: newTask.est_minutes,
      sort_order: tasks.length + 1, is_active: true, user_id: session.user.id
    }).select().single()
    if (data) setTasks(prev => [...prev, data])
    setNewTask({ name: '', est_minutes: 15 })
    setShowAddTask(false)
  }

  function p(k: string, v: string | number) { setProfile(prev => ({ ...prev, [k]: v })) }

  if (loading) return <div className="p-4"><div className="card animate-pulse h-60" /></div>

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-4 pt-2">
        <h1 className="display text-3xl">Innstillingar</h1>
        <button className="btn btn-primary py-2 px-4 text-sm w-auto" onClick={handleSave} disabled={saving}>
          {saving ? 'Lagrar...' : saved ? '✓ Lagra!' : 'Lagre'}
        </button>
      </div>

      {/* Gardshusinfo */}
      <p className="section-lbl">Gardshuset ditt</p>
      <div className="card mb-3">
        <label className="block mb-3">
          <span className="field-label">Namn på huset</span>
          <input type="text" className="field-input" value={profile.house_name}
            onChange={e => p('house_name', e.target.value)} placeholder="T.d. Tunet, Solbakken..." />
        </label>
        <label className="block mb-3">
          <span className="field-label">Stad / adresse</span>
          <input type="text" className="field-input" value={profile.house_location}
            onChange={e => p('house_location', e.target.value)} placeholder="T.d. Voss, Vestland" />
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="field-label">Antal soverom</span>
            <input type="number" className="field-input" min={1} max={10} value={profile.bedrooms}
              onChange={e => p('bedrooms', +e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Maks gjester</span>
            <input type="number" className="field-input" min={1} max={20} value={profile.max_guests}
              onChange={e => p('max_guests', +e.target.value)} />
          </label>
        </div>
      </div>

      {/* Airbnb iCal-sync */}
      <p className="section-lbl">Airbnb kalender-sync</p>
      <div className="card mb-3">
        <div className="text-xs text-[var(--c-muted)] mb-3">
          Finn iCal-lenka på Airbnb: Kalender → Tilgjengelighet → Eksporter kalender
        </div>
        <label className="block mb-3">
          <span className="field-label">iCal-lenke frå Airbnb</span>
          <input type="url" className="field-input" value={profile.ical_url}
            onChange={e => p('ical_url', e.target.value)}
            placeholder="https://www.airbnb.com/calendar/ical/..." />
        </label>
        <div className="flex gap-2">
          <button className="btn btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2" onClick={handleSync}
            disabled={syncing || !profile.ical_url}>
            {syncing ? (
              <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Synkroniserer...</>
            ) : '↓ Synkroniser no'}
          </button>
        </div>
        {syncResult && (
          <div className="mt-2 p-2.5 rounded-lg text-xs"
            style={{
              background: syncResult.startsWith('✓') ? 'var(--c-accent-lt)' : 'var(--c-amber-lt)',
              color: syncResult.startsWith('✓') ? 'var(--c-accent)' : 'var(--c-amber)'
            }}>
            {syncResult}
          </div>
        )}
      </div>

      {/* Standardprisar */}
      <p className="section-lbl">Standard booking-prisar</p>
      <div className="card mb-3">
        <div className="grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="field-label">Pris per natt (kr)</span>
            <input type="number" className="field-input" value={profile.default_price}
              onChange={e => p('default_price', +e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Vaskegebyr (kr)</span>
            <input type="number" className="field-input" value={profile.default_cleaning}
              onChange={e => p('default_cleaning', +e.target.value)} />
          </label>
        </div>
        <div className="text-xs text-[var(--c-muted)] mt-2">
          Fylt inn automatisk ved ny booking
        </div>
        <button className="btn btn-primary mt-3 py-2 text-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Lagrar...' : saved ? '✓ Lagra!' : 'Lagre prisar'}
        </button>
      </div>

      {/* Reinhaldar */}
      <p className="section-lbl">Reinhaldar / kontakt</p>
      <div className="card mb-3">
        <label className="block mb-3">
          <span className="field-label">Namn</span>
          <input type="text" className="field-input" value={profile.cleaner_name}
            onChange={e => p('cleaner_name', e.target.value)} placeholder="T.d. Kari Nordmann" />
        </label>
        <label className="block">
          <span className="field-label">Telefon</span>
          <input type="text" className="field-input" value={profile.cleaner_phone}
            onChange={e => p('cleaner_phone', e.target.value)} placeholder="+47 900 00 000" />
        </label>
      </div>

      {/* Tema */}
      <p className="section-lbl">Fargetema</p>
      <div className="card mb-3">
        <div className="flex gap-3 flex-wrap">
          {THEMES.map(theme => (
            <button key={theme.id}
              onClick={() => { p('theme_color', theme.id); applyTheme(theme.id) }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '6px', padding: '10px 14px', borderRadius: '10px',
                border: profile.theme_color === theme.id ? `2px solid ${theme.color}` : '2px solid var(--c-border)',
                background: profile.theme_color === theme.id ? `${theme.color}15` : 'transparent',
                cursor: 'pointer'
              }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: theme.color }} />
              <span style={{ fontSize: '11px', color: 'var(--c-muted)' }}>{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Turnover-oppgåver */}
      <p className="section-lbl">Turnover-oppgåver</p>
      <div className="card mb-3">
        {tasks.map((task, i) => (
          <div key={task.id}
            className={`flex items-center gap-3 py-2.5 ${i < tasks.length-1 ? 'border-b border-[var(--c-border)]' : ''}`}>
            <input type="checkbox" checked={task.is_active}
              onChange={() => toggleTask(task.id, task.is_active)}
              className="w-4 h-4 accent-[var(--c-accent)] flex-shrink-0" />
            <span className={`flex-1 text-sm ${!task.is_active ? 'line-through text-[var(--c-muted)]' : ''}`}>
              {task.name}
            </span>
            <span className="text-xs text-[var(--c-muted)]">{task.est_minutes} min</span>
            <button onClick={() => deleteTask(task.id)} className="text-[var(--c-muted)] text-lg leading-none">×</button>
          </div>
        ))}
        <button className="btn btn-secondary mt-3 text-sm py-2" onClick={() => setShowAddTask(true)}>
          + Legg til oppgåve
        </button>
      </div>

      {/* Konto */}
      <p className="section-lbl">Konto</p>
      <div className="card">
        <div className="flex justify-between text-sm py-1">
          <span className="text-[var(--c-muted)]">E-post</span>
          <span>{email}</span>
        </div>
      </div>

      {showAddTask && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAddTask(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-4">Ny turnover-oppgåve</h2>
            <label className="block mb-3">
              <span className="field-label">Namn på oppgåva</span>
              <input type="text" className="field-input" value={newTask.name}
                onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))}
                placeholder="T.d. Lufte soverom" />
            </label>
            <label className="block mb-4">
              <span className="field-label">Estimert tid (minutt)</span>
              <input type="number" className="field-input" min={1} value={newTask.est_minutes}
                onChange={e => setNewTask(p => ({ ...p, est_minutes: +e.target.value }))} />
            </label>
            <button className="btn btn-primary mb-2" onClick={addTask} disabled={!newTask.name}>Legg til</button>
            <button className="btn btn-secondary" onClick={() => setShowAddTask(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  )
}
