'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && pathname !== '/login') {
        router.replace('/login')
      }
      setChecking(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && pathname !== '/login') {
        router.replace('/login')
      }
      if (session && pathname === '/login') {
        router.replace('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname])

  if (checking) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--c-bg)'
    }}>
      <div className="display text-2xl text-[var(--c-muted)]">Tunet</div>
    </div>
  )

  return <>{children}</>
}
