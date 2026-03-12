import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeacherAssignmentsClient from './TeacherAssignmentsClient'

export default async function TeacherAssignmentsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const teacherId = session.user.id

  const { data: classes } = await supabase.from('classes').select('id, name').eq('teacher_id', teacherId)
  const { data: wordsets } = await supabase.from('word_sets').select('id, title, words:words(count)').eq('created_by', teacherId)
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, word_set:word_sets(title), class:classes(name)')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false })

  return <TeacherAssignmentsClient
    initialAssignments={assignments || []}
    classes={classes || []}
    wordsets={wordsets || []}
    teacherId={teacherId}
  />
}
