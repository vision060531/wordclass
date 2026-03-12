'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardHome() {
  const router = useRouter()

  useEffect(() => {
    const redirect = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: p } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (!p) { router.replace('/login'); return }
      if (p.role === 'superadmin') router.replace('/dashboard/admin/users')
      else if (p.role === 'teacher') router.replace('/dashboard/teacher/classes')
      else router.replace('/dashboard/student/classes')
    }
    redirect()
  }, [])

  return null
}
