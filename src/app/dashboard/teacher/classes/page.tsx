import { createClient } from '@/lib/supabase/server'
import TeacherClassesClient from './TeacherClassesClient'

export default async function TeacherClassesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const teacherId = session?.user?.id ?? ''

  const { data: classes } = teacherId ? await supabase
    .from('classes')
    .select(`*, members:class_members(count)`)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false }) : { data: [] }

  const { data: students } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'student')
    .eq('approved', true)

  return <TeacherClassesClient
    initialClasses={classes || []}
    allStudents={students || []}
    teacherId={teacherId}
  />
}
