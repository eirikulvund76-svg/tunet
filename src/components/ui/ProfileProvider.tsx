'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
}

const defaultProfile: Profile = {
  house_name: 'Gardshuset mitt',
  house_location: '',
  bedrooms: 2,
  max_guests: 4,
  default_price: 900,
  default_cleaning: 400,
  cleaner_name: '',
  cleaner_phone: '',
  theme_color: 'green'
}

const THEME_COLORS: Record<string, string> = {
  green:  '#2D5A27',
  blue:   '#185FA5',
  amber:  '#BA7517',
  red:    '#A32D2D',
  purple: '#6B3FA0',
}

const ProfileContext = createContext<Profile>(defaultProfile)

export function useProfile() {
  return useContext(ProfileContext)
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(defaultProfile)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (data) {
        setProfile(data)
        // Apply theme
        const color = THEME_COLORS[data.theme_color]
        if (color) document.documentElement.style.setProperty('--c-accent', color)
      }
    }
    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) load()
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  )
}
