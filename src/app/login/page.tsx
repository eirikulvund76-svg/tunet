'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
  { name: 'Oppvaskmiddel',   category: 'cleaning',   unit: 'flaske', current_qty: 2,  min_qty: 1, max_qty: 5  },
  { name: 'Vaskemiddel',     category: 'cleaning',   unit: 'flaske', current_qty: 2,  min_qty: 1, max_qty: 5  },
  { name: 'Toalettreingjer', category: 'cleaning',   unit: 'flaske', current_qty: 2,  min_qty: 1, max_qty: 5  },
  { name: 'Allreingjer',     category: 'cleaning',   unit: 'flaske', current_qty: 2,  min_qty: 1, max_qty: 5  },
  { name: 'Toalettpapir',    category: 'consumable', unit: 'rull',   current_qty: 12, min_qty: 4, max_qty: 24 },
  { name: 'Tørkepapir',      category: 'consumable', unit: 'rull',   current_qty: 4,  min_qty: 2, max_qty: 8  },
  { name: 'Søppelsekkar',    category: 'consumable', unit: 'stk',    current_qty: 20, min_qty: 5, max_qty: 40 },
  { name: 'Oppvasktabs',     category: 'consumable', unit: 'stk',    current_qty: 20, min_qty: 5, max_qty: 40 },
  { name: 'Såpe (hender)',   category: 'consumable', unit: 'flaske', current_qty: 3,  min_qty: 1, max_qty: 6  },
  { name: 'Kaffe / te',      category: 'consumable', unit: 'pakke',  current_qty: 4,  min_qty: 1, max_qty: 8  },
  { name: 'Tennbrikkett',    category: 'consumable', unit: 'stk',    current_qty: 20, min_qty: 5, max_qty: 40 },
  { name: 'Handkle (liten)', category: 'textile',    unit: 'stk',    current_qty: 6,  min_qty: 2, max_qty: 12 },
  { name: 'Handkle (stor)',  category: 'textile',    unit: 'stk',    current_qty: 6,  min_qty: 2, max_qty: 12 },
  { name: 'Sengeskift',      category: 'textile',    unit: 'sett',   current_qty: 4,  min_qty: 2, max_qty: 8  },
  { name: 'Putevar',         category: 'textile',    unit: 'stk',    current_qty: 8,  min_qty: 4, max_qty: 16 },
  { name: 'Lyspærer',        category: 'equipment',  unit: 'stk',    current_qty: 4,  min_qty: 2, max_qty: 10 },
  { name: 'Batterier (AA)',  category: 'equipment',  unit: 'stk',    current_qty: 8,  min_qty: 4, max_qty: 16 },
]

function friendlyError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Feil e-post eller passord. Prøv igjen.'
  if (msg.includes('Email not confirmed')) return 'E-postadressa er ikkje bekrefta enno. Sjekk innboksen din.'
  if (msg.includes('User already registered')) return 'Det finst allereie ein konto med denne e-postadressa.'
  if (msg.includes('Password should be at least')) return 'Passordet må vere minst 6 teikn.'
  if (msg.includes('Unable to validate email')) return 'Ugyldig e-postadresse. Sjekk at du har skrive riktig.'
  if (msg.includes('rate limit')) return 'For mange forsøk. Vent litt og prøv igjen.'
  if (msg.includes('network') || msg.includes('fetch')) return 'Nettverksfeil. Sjekk internettforbindinga di.'
  return 'Noko gjekk gale. Prøv igjen.'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [resetMode, setResetMode]   = useState(false)
  const [resetSent, setResetSent]   = useState(false)

  async function handleSubmit() {
    if (!email || !password) {
      setError('Fyll inn e-post og passord.')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        const uid = data.user?.id
        if (!uid) throw new Error('Ingen brukar returnert frå registrering')

        try {
          await supabase.from('turnover_tasks').insert(
            DEFAULT_TASKS.map(t => ({ ...t, user_id: uid, is_active: true }))
          )
        } catch {}
        try {
          await supabase.from('inventory_items').insert(
            DEFAULT_INVENTORY.map(item => ({ ...item, user_id: uid, notes: null }))
          )
        } catch {}

        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, email }),
        })
        const checkoutData = await res.json()
        if (checkoutData.url) {
          window.location.href = checkoutData.url
        } else {
          throw new Error('Kunne ikkje starte betaling')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (e: any) {
      setError(friendlyError(e.message ?? ''))
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!email) {
      setError('Skriv inn e-postadressa di fyrst.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/tilbakestill-passord`,
      })
      if (error) throw error
      setResetSent(true)
    } catch (e: any) {
      setError(friendlyError(e.message ?? ''))
    } finally {
      setLoading(false)
    }
  }

  if (resetMode) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--c-bg)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px'
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h1 className="display text-4xl text-center mb-2">Verten</h1>
          <p className="text-center text-sm mb-8" style={{ color: 'var(--c-muted)' }}>
            Tilbakestill passord
          </p>
          <div className="card">
            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
                <p className="text-sm font-medium mb-2">E-post sendt!</p>
                <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
                  Sjekk innboksen din for ein lenke til å tilbakestille passordet.
                </p>
                <button className="btn btn-secondary mt-4" onClick={() => { setResetMode(false); setResetSent(false) }}>
                  Tilbake til innlogging
                </button>
              </div>
            ) : (
              <>
                <h2 className="display text-xl mb-2">Glemt passord?</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--c-muted)' }}>
                  Skriv inn e-postadressa di så sender vi deg ein lenke.
                </p>
                {error && (
                  <div className="mb-3 p-3 rounded-lg text-sm" style={{ background: 'var(--c-red-lt)', color: 'var(--c-red)' }}>
                    {error}
                  </div>
                )}
                <label className="block mb-4">
                  <span className="field-label">E-post</span>
                  <input type="email" className="field-input" value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="deg@epost.no"
                    onKeyDown={e => e.key === 'Enter' && handleReset()} />
                </label>
                <button className="btn btn-primary" onClick={handleReset} disabled={loading}>
                  {loading ? 'Sender...' : 'Send tilbakestillingslenke'}
                </button>
                <button className="btn btn-secondary mt-2" onClick={() => { setResetMode(false); setError('') }}>
                  Avbryt
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--c-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <h1 className="display text-4xl text-center mb-2">Verten</h1>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--c-muted)' }}>
          Driftsystem for Airbnb-vertar
        </p>
        <div className="card">
          <h2 className="display text-xl mb-4">
            {isSignUp ? 'Kom i gang' : 'Logg inn'}
          </h2>

          {isSignUp && (
            <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: 'var(--c-accent-lt)', color: 'var(--c-accent)' }}>
              <strong>30 dagar gratis</strong> — ingen binding, ingen kredittkort nødvendig.<br />
              Betalinga startar fyrst etter prøveperioden.
            </div>
          )}

          {error && (
            <div className="mb-3 p-3 rounded-lg text-sm" style={{ background: 'var(--c-red-lt)', color: 'var(--c-red)' }}>
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
              autoComplete="email"
            />
          </label>

          <label className="block mb-1">
            <span className="field-label">Passord</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="field-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minst 6 teikn"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--c-muted)', fontSize: '16px', padding: '4px'
                }}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          {!isSignUp && (
            <div style={{ textAlign: 'right', marginBottom: '16px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => { setResetMode(true); setError('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-accent)', fontSize: '13px' }}
              >
                Glemt passord?
              </button>
            </div>
          )}

          {isSignUp && <div style={{ marginBottom: '16px' }} />}

          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? (isSignUp ? 'Oppretter konto...' : 'Loggar inn...')
              : (isSignUp ? 'Start gratis' : 'Logg inn')}
          </button>

          <button
            className="btn btn-secondary mt-2"
            onClick={() => { setIsSignUp(p => !p); setError('') }}
          >
            {isSignUp ? 'Har allereie konto? Logg inn' : 'Ny brukar? Start gratis'}
          </button>
        </div>
      </div>
    </div>
  )
}
