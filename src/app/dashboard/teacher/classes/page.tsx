import { createClient } from '@/lib/supabase/server'
import TeacherClassesClient from './TeacherClassesClient'

export default async function TeacherClassesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: classes } = await supabase
    .from('classes')
    .select(`*, members:class_members(count)`)
    .eq('teacher_id', user!.id)
    .order('created_at', { ascending: false })

  // Get all students for adding to classes
  const { data: students } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'student')
    .eq('approved', true)

  return <TeacherClassesClient
    initialClasses={classes || []}
    allStudents={students || []}
    teacherId={user!.id}
  />
}
