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

      let p: any = null

      // 1차: 직접 조회
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        p = data
      } else {
        // 2차: 없거나 RLS 막힌 경우 → 서버 API로 service role 사용해 생성/조회
        try {
          const res = await fetch('/api/auth/profile', { method: 'POST' })
          if (res.ok) {
            const json = await res.json()
            p = json.profile
          }
        } catch {}
      }

      if (!p) { router.replace('/login'); return }
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
