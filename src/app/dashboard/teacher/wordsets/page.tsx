import { createClient } from '@/lib/supabase/server'
import TeacherWordsetsClient from './TeacherWordsetsClient'

export default async function TeacherWordsetsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const teacherId = session?.user?.id ?? ''

  const { data: wordsets } = teacherId ? await supabase
    .from('word_sets')
    .select('*, words:words(count)')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false }) : { data: [] }

  const { data: classes } = teacherId ? await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', teacherId) : { data: [] }

  return <TeacherWordsetsClient
    initialWordsets={wordsets || []}
    classes={classes || []}
    teacherId={teacherId}
  />
}
