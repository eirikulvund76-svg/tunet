'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Sider som alltid er opne
const PUBLIC_PATHS = ['/', '/login', '/abonnement']

// Sider som krev abonnement
const PROTECTED_PATHS = ['/dashboard', '/calendar', '/turnover', '/inventory', '/economy', '/settings']

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()

      // Ikkje innlogga og prøver å nå beskytta side
      if (!session && !PUBLIC_PATHS.includes(pathname)) {
        router.replace('/login')
        return
      }

      // Innlogga og prøver å nå beskytta side — sjekk abonnement
      if (session && PROTECTED_PATHS.some(p => pathname.startsWith(p))) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_status, trial_end')
          .eq('id', session.user.id)
          .single()

        const status = profile?.subscription_status
        const hasAccess = status === 'active' || status === 'trialing' || status === 'trial'

        if (!hasAccess) {
          router.replace('/abonnement')
          return
        }
      }

      setChecking(false)
    }

    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !PUBLIC_PATHS.includes(pathname)) {
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname])

  if (checking && !PUBLIC_PATHS.includes(pathname)) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--c-bg)'
    }}>
      <div className="display text-2xl text-[var(--c-muted)]">Verten</div>
    </div>
  )

  return <>{children}</>
}
