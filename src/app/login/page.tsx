'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Standard oppgåver som alle nye brukarar får
const DEFAULT_TASKS = [
  { name: 'Bytte sengetøy', sort_order: 1 },
  { name: 'Vaske bad', sort_order: 2 },
  { name: 'Vaske kjøkken', sort_order: 3 },
  { name: 'Støvsuge alle rom', sort_order: 4 },
  { name: 'Vaske golv', sort_order: 5 },
  { name: 'Fylle forbruksvarer', sort_order: 6 },
  { name: 'Kontrollere TV og lys', sort_order: 7 },
  { name: 'Byte kodeboks-kode', sort_order: 8 },
  { name: 'Ta dokumentasjonsbilete', sort_order: 9 },
]

const DEFAULT_INVENTORY = [
  // Reingjering
  { name: 'Oppvaskmiddel',     category: 'cleaning',   unit: 'flaske', current_qty: 2,  min_qty: 1, max_qty: 5  },
  { name: 'Vaskemiddel',       category: 'cleaning',   unit: 'flaske', current_qty: 2,  min_qty: 1, max_qty: 5  },
  { name: 'Toalettreingjer',   category: 'cleaning',   unit: 'flaske', current_qty: 2,  min_qty: 1, max_qty: 5  },
  { name: 'Allreingjer',       category: 'cleaning',   unit: 'flaske', current_qty: 2,  min_qty: 1, max_qty: 5  },
  // Forbruksvarer
  { name: 'Toalettpapir',      category: 'consumable', unit: 'rull',   current_qty: 12, min_qty: 4, max_qty: 24 },
  { name: 'Tørkepapir',        category: 'consumable', unit: 'rull',   current_qty: 4,  min_qty: 2, max_qty: 8  },
  { name: 'Søppelsekkar',      category: 'consumable', unit: 'stk',    current_qty: 20, min_qty: 5, max_qty: 40 },
  { name: 'Oppvasktabs',       category: 'consumable', unit: 'stk',    current_qty: 20, min_qty: 5, max_qty: 40 },
  { name: 'Såpe (hender)',     category: 'consumable', unit: 'flaske', current_qty: 3,  min_qty: 1, max_qty: 6  },
  { name: 'Kaffe / te',        category: 'consumable', unit: 'pakke',  current_qty: 4,  min_qty: 1, max_qty: 8  },
  { name: 'Tennbrikkett',      category: 'consumable', unit: 'stk',    current_qty: 20, min_qty: 5, max_qty: 40 },
  // Tekstilar
  { name: 'Handkle (liten)',   category: 'textile',    unit: 'stk',    current_qty: 6,  min_qty: 2, max_qty: 12 },
  { name: 'Handkle (stor)',    category: 'textile',    unit: 'stk',    current_qty: 6,  min_qty: 2, max_qty: 12 },
  { name: 'Sengeskift',        category: 'textile',    unit: 'sett',   current_qty: 4,  min_qty: 2, max_qty: 8  },
  { name: 'Putevar',           category: 'textile',    unit: 'stk',    current_qty: 8,  min_qty: 4, max_qty: 16 },
  // Utstyr
  { name: 'Lyspærer',          category: 'equipment',  unit: 'stk',    current_qty: 4,  min_qty: 2, max_qty: 10 },
  { name: 'Batterier (AA)',    category: 'equipment',  unit: 'stk',    current_qty: 8,  min_qty: 4, max_qty: 16 },
]

async function setupNewUser(userId: string) {
  // 2. Sjekk om brukar allereie har oppgåver
  const { data: existingTasks } = await supabase
    .from('turnover_tasks')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (!existingTasks || existingTasks.length === 0) {
    await supabase.from('turnover_tasks').insert(
      DEFAULT_TASKS.map(t => ({
        ...t,
        user_id: userId,
        is_active: true,
      }))
    )
  }

  // 3. Sjekk om brukar allereie har lagervarer
  const { data: existingInventory } = await supabase
    .from('inventory_items')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (!existingInventory || existingInventory.length === 0) {
    await supabase.from('inventory_items').insert(
      DEFAULT_INVENTORY.map(item => ({
        ...item,
        user_id: userId,
        notes: null,
      }))
    )
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await setupNewUser(data.user.id)
        }
        alert('Konto oppretta! Du kan no logge inn.')
        setIsSignUp(false)
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.user) {
          await setupNewUser(data.user.id)
          // Sjekk om ny brukar (tomt husnamn) → send til innstillingar
          const { data: prof } = await supabase
            .from('user_profiles')
            .select('house_name')
            .eq('id', data.user.id)
            .single()
          if (!prof || !prof.house_name) {
            router.push('/settings')
          } else {
            router.push('/dashboard')
          }
        }
      }
    } catch (e: any) {
      setError(e.message === 'Invalid login credentials'
        ? 'Feil e-post eller passord'
        : e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--c-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <h1 className="display text-4xl text-center mb-2">Tunet</h1>
        <p className="text-center text-sm text-[var(--c-muted)] mb-8">
          Driftsystem for Airbnb-gardshus
        </p>

        <div className="card">
          <h2 className="display text-xl mb-4">
            {isSignUp ? 'Lag konto' : 'Logg inn'}
          </h2>

          {error && (
            <div className="mb-3 p-3 rounded-lg text-sm"
              style={{ background: 'var(--c-red-lt)', color: 'var(--c-red)' }}>
              {error}
            </div>
          )}

          <label className="block mb-3">
            <span className="field-label">E-post</span>
            <input
              type="email"
              className="field-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="deg@epost.no"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </label>

          <label className="block mb-4">
            <span className="field-label">Passord</span>
            <input
              type="password"
              className="field-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minst 6 teikn"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </label>

          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Ventar...' : isSignUp ? 'Lag konto' : 'Logg inn'}
          </button>

          <button
            className="btn btn-secondary mt-2"
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
          >
            {isSignUp ? 'Har allereie konto? Logg inn' : 'Ny brukar? Lag konto'}
          </button>
        </div>
      </div>
    </div>
  )
}
