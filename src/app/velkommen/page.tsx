'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function VelkommenContent() {
  const router = useRouter()
  const params = useSearchParams()
  const betalt = params.get('betalt')
  const [houseName, setHouseName] = useState('')
  const [houseLocation, setHouseLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function setup() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)

      // Sett abonnement til trialing
      if (betalt) {
        await supabase.from('user_profiles').upsert({
          id: session.user.id,
          subscription_status: 'trialing',
        })
      }
    }
    setup()
  }, [betalt])

  async function handleSave() {
    if (!houseName) return
    setSaving(true)
    await supabase.from('user_profiles').upsert({
      id: userId,
      house_name: houseName,
      house_location: houseLocation,
      subscription_status: 'trialing',
    })
    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--c-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <h1 className="display text-3xl mb-2">Velkommen til Verten!</h1>
          <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
            Fyll inn litt info om huset ditt for å kome i gang
          </p>
        </div>
        <div className="card">
          <label className="block mb-3">
            <span className="field-label">Namn på huset</span>
            <input
              type="text"
              className="field-input"
              value={houseName}
              onChange={e => setHouseName(e.target.value)}
              placeholder="T.d. Tunet, Solbakken..."
              autoFocus
            />
          </label>
          <label className="block mb-4">
            <span className="field-label">Stad / adresse</span>
            <input
              type="text"
              className="field-input"
              value={houseLocation}
              onChange={e => setHouseLocation(e.target.value)}
              placeholder="T.d. Voss, Vestland"
            />
          </label>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !houseName}
          >
            {saving ? 'Lagrar...' : 'Kom i gang'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VelkommenPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="display text-2xl text-[var(--c-muted)]">Verten</div>
      </div>
    }>
      <VelkommenContent />
    </Suspense>
  )
}
