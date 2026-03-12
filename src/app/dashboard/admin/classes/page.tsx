import { createClient } from '@/lib/supabase/server'
import AdminClassesClient from './AdminClassesClient'

export default async function AdminClassesPage() {
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('*, teacher:profiles!teacher_id(name), members:class_members(count)')
    .order('created_at', { ascending: false })

  return <AdminClassesClient initialClasses={classes || []} />
}
