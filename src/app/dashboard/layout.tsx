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
      const supabase = createClient()
      console.log('1. checking user...')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('2. user:', user, 'error:', userError)
      if (!user) { 
        console.log('3. no user, redirecting to login')
        router.replace('/login')
        return 
      }
      console.log('4. fetching profile for:', user.id)
      const { data: p, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      console.log('5. profile:', p, 'error:', profileError)
      if (profileError || !p) { 
        router.replace('/login')
        return 
      }
      if (!p.approved) { router.replace('/pending'); return }
      setProfile(p)
      setLoading(false)
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
