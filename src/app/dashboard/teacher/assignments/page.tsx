import { createClient } from '@/lib/supabase/server'
import TeacherAssignmentsClient from './TeacherAssignmentsClient'

export default async function TeacherAssignmentsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const teacherId = session?.user?.id ?? ''

  const { data: classes } = teacherId ? await supabase.from('classes').select('id, name').eq('teacher_id', teacherId) : { data: [] }
  const { data: wordsets } = teacherId ? await supabase.from('word_sets').select('id, title, words:words(count)').eq('created_by', teacherId) : { data: [] }
  const { data: assignments } = teacherId ? await supabase
    .from('assignments')
    .select('*, word_set:word_sets(title), class:classes(name)')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false }) : { data: [] }

  return <TeacherAssignmentsClient
    initialAssignments={assignments || []}
    classes={classes || []}
    wordsets={wordsets || []}
    teacherId={teacherId}
  />
}
