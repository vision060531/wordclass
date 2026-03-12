import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeacherAssignmentsClient from './TeacherAssignmentsClient'

export default async function TeacherAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: classes } = await supabase.from('classes').select('id, name').eq('teacher_id', user!.id)
  const { data: wordsets } = await supabase.from('word_sets').select('id, title, words:words(count)').eq('created_by', user!.id)
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, word_set:word_sets(title), class:classes(name)')
    .eq('created_by', user!.id)
    .order('created_at', { ascending: false })

  return <TeacherAssignmentsClient
    initialAssignments={assignments || []}
    classes={classes || []}
    wordsets={wordsets || []}
    teacherId={user!.id}
  />
}
