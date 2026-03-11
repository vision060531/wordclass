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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!p) { router.replace('/login'); return }
      if (!p.approved) { router.replace('/pending'); return }
      setProfile(p)
      setLoading(false)
    }
    check()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-accent font-mono">로딩 중...</div>
    </div>
  )

  return <DashboardShell profile={profile}>{children}</DashboardShell>
}
