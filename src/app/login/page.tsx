'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Konto oppretta! Du kan no logge inn.')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
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
