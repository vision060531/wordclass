import { createClient } from '@/lib/supabase/server'
import TeacherWordsetsClient from './TeacherWordsetsClient'

export default async function TeacherWordsetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: wordsets } = await supabase
    .from('word_sets')
    .select('*, words:words(count)')
    .eq('created_by', user!.id)
    .order('created_at', { ascending: false })

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user!.id)

  return <TeacherWordsetsClient
    initialWordsets={wordsets || []}
    classes={classes || []}
    teacherId={user!.id}
  />
}
