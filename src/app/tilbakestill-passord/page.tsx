'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function TilbakestillContent() {
  const router = useRouter()
  const [password, setPassword]         = useState('')
  const [password2, setPassword2]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)
  const [checking, setChecking]         = useState(true)

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') setChecking(false)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setChecking(false)
    })
  }, [])

  async function handleReset() {
    if (!password || !password2) {
      setError('Fyll inn begge passordfelta.')
      return
    }
    if (password.length < 6) {
      setError('Passordet må vere minst 6 teikn.')
      return
    }
    if (password !== password2) {
      setError('Passorda er ikkje like. Prøv igjen.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch (e: any) {
      const msg = e.message ?? ''
      if (msg.includes('same password') || msg.includes('different from the old password')) {
        setError('Du kan ikkje byte til eit passord du har brukt før. Vel eit nytt passord.')
      } else if (msg.includes('weak')) {
        setError('Passordet er for enkelt. Prøv eit lengre eller meir variert passord.')
      } else {
        setError('Noko gjekk gale. Prøv å be om ei ny tilbakestillingslenke.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)' }}>
      <div className="display text-2xl text-[var(--c-muted)]">Verten</div>
    </div>
  )

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
          {success ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <p className="font-medium mb-2">Passordet er oppdatert!</p>
              <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
                Du vert sendt til dashbordet...
              </p>
            </div>
          ) : (
            <>
              <h2 className="display text-xl mb-4">Nytt passord</h2>
              {error && (
                <div className="mb-3 p-3 rounded-lg text-sm" style={{ background: 'var(--c-red-lt)', color: 'var(--c-red)' }}>
                  {error}
                </div>
              )}
              <label className="block mb-3">
                <span className="field-label">Nytt passord</span>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="field-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minst 6 teikn"
                    autoFocus
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--c-muted)', fontSize: '16px'
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </label>
              <label className="block mb-5">
                <span className="field-label">Gjenta passord</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="field-input"
                  value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  placeholder="Gjenta passordet"
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                />
              </label>
              <button className="btn btn-primary" onClick={handleReset} disabled={loading}>
                {loading ? 'Oppdaterer...' : 'Lagre nytt passord'}
              </button>
              <button className="btn btn-secondary mt-2" onClick={() => router.push('/login')}>
                Avbryt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TilbakestillPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="display text-2xl text-[var(--c-muted)]">Verten</div>
      </div>
    }>
      <TilbakestillContent />
    </Suspense>
  )
}
