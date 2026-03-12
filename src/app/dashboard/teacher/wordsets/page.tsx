import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeacherWordsetsClient from './TeacherWordsetsClient'

export default async function TeacherWordsetsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const teacherId = session.user.id

  const { data: wordsets } = await supabase
    .from('word_sets')
    .select('*, words:words(count)')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false })

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', teacherId)

  return <TeacherWordsetsClient
    initialWordsets={wordsets || []}
    classes={classes || []}
    teacherId={teacherId}
  />
}
