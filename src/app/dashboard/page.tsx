import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')

  if (profile.role === 'superadmin') redirect('/dashboard/admin/users')
  if (profile.role === 'teacher') redirect('/dashboard/teacher/classes')
  redirect('/dashboard/student/classes')
}
