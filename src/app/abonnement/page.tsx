'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AbonnementPage() {
  const router = useRouter()
  const params = useSearchParams()
  const avbrutt = params.get('avbrutt')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setEmail(session.user.email ?? '')
    })
  }, [])

  async function handleCheckout() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, email: session.user.email }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--c-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <h1 className="display text-3xl text-center mb-2">Verten</h1>
        <p className="text-center text-sm text-[var(--c-muted)] mb-8">
          Start abonnementet ditt for å halde fram
        </p>

        {avbrutt && (
          <div className="mb-4 p-3 rounded-xl text-sm text-center"
            style={{ background: 'var(--c-amber-lt)', color: 'var(--c-amber)' }}>
            Betalinga vart avbrutt. Prøv igjen når du er klar.
          </div>
        )}

        <div className="card text-center mb-4" style={{ border: '2px solid var(--c-accent)' }}>
          <div className="display text-4xl text-[var(--c-accent)] mb-1">
            <span style={{ fontSize: '20px', verticalAlign: 'super' }}>kr</span> 99
            <span className="text-base text-[var(--c-muted)] font-normal">/mnd</span>
          </div>
          <div className="text-sm text-[var(--c-muted)] mb-4">30 dagar gratis — ingen binding</div>
          <div className="text-left mb-5">
            {[
              'Airbnb kalender-sync',
              'Automatisk nattleg oppdatering',
              'Turnover-sjekkliste',
              'Lager og varslar',
              'Økonomioversikt',
              'Ubegrensa bookingar',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 py-1.5 border-b border-[var(--c-border)] text-sm">
                <span className="text-[var(--c-accent)]">✓</span> {f}
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleCheckout} disabled={loading}>
            {loading ? 'Sender deg til betaling...' : 'Start 30 dagar gratis'}
          </button>
          <p className="text-xs text-[var(--c-muted)] mt-3">
            Ingen kredittkort nødvendig i prøveperioden
          </p>
        </div>

        <p className="text-center text-xs text-[var(--c-muted)]">
          Innlogga som {email}
        </p>
      </div>
    </div>
  )
}
