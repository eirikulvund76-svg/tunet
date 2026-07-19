'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function AbonnementContent() {
  const router = useRouter()
  const params = useSearchParams()
  const avbrutt = params.get('avbrutt')
  const betalt = params.get('betalt')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Viss betalt=true, oppdater status og gå til dashboard
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setChecking(false); return }

      if (betalt) {
        // Gi litt tid til webhook å prosessere
        await new Promise(r => setTimeout(r, 2000))
        // Sett status til trialing midlertidig så brukaren kjem inn
        await supabase.from('user_profiles').update({
          subscription_status: 'trialing'
        }).eq('id', session.user.id)
        router.replace('/dashboard')
        return
      }

      setChecking(false)
    }
    checkSession()
  }, [betalt])

  async function handleCheckout() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, email: session.user.email }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
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
      minHeight: '100vh',
      background: 'var(--c-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="display text-4xl mb-2" style={{ color: 'var(--c-accent)' }}>Verten</h1>
          <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
            Eitt steg til for å kome i gang
          </p>
        </div>

        {avbrutt && (
          <div className="mb-4 p-3 rounded-xl text-sm text-center"
            style={{ background: 'var(--c-amber-lt)', color: 'var(--c-amber)' }}>
            Betalinga vart avbrutt. Prøv igjen når du er klar.
          </div>
        )}

        <div className="card" style={{ border: '2px solid var(--c-accent)', textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>
            <span className="display" style={{ fontSize: '48px', color: 'var(--c-accent)', lineHeight: 1 }}>
              <sup style={{ fontSize: '20px', verticalAlign: 'super' }}>kr</sup>99
            </span>
            <span className="text-base" style={{ color: 'var(--c-muted)' }}>/mnd</span>
          </div>

          <div className="text-sm mb-5" style={{ color: 'var(--c-accent)', fontWeight: 600 }}>
            30 dagar gratis — ingen kredittkort
          </div>

          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            {[
              { icon: '📅', text: 'Airbnb kalender-sync' },
              { icon: '🔄', text: 'Automatisk nattleg oppdatering' },
              { icon: '✅', text: 'Turnover-sjekkliste' },
              { icon: '📦', text: 'Lager og varslar' },
              { icon: '💰', text: 'Økonomioversikt' },
              { icon: '∞', text: 'Ubegrensa bookingar' },
            ].map(f => (
              <div key={f.text} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 0', borderBottom: '1px solid var(--c-border)',
                fontSize: '14px'
              }}>
                <span>{f.icon}</span> {f.text}
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCheckout}
            disabled={loading}
            style={{ width: '100%', fontSize: '16px', padding: '14px' }}
          >
            {loading ? 'Sender deg til betaling...' : 'Start 30 dagar gratis'}
          </button>

          <p className="text-xs mt-3" style={{ color: 'var(--c-muted)' }}>
            Ingen binding · Avbryt når som helst
          </p>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--c-muted)' }}>
          Har du allereie abonnement?{' '}
          <a href="/login" style={{ color: 'var(--c-accent)', textDecoration: 'none' }}>Logg inn</a>
        </p>
      </div>
    </div>
  )
}

export default function AbonnementPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="display text-2xl text-[var(--c-muted)]">Verten</div>
      </div>
    }>
      <AbonnementContent />
    </Suspense>
  )
}
