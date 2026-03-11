'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/login'); return }
        
        const { data: p, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error || !p) { 
          console.log('profile error:', error)
          router.replace('/login')
          return 
        }
        if (!p.approved) { router.replace('/pending'); return }
        setProfile(p)
        setLoading(false)
      } catch(e) {
        console.log('catch error:', e)
        router.replace('/login')
      }
    }
    check()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-accent font-mono text-sm">로딩 중...</div>
    </div>
  )

  return <DashboardShell profile={profile}>{children}</DashboardShell>
}
