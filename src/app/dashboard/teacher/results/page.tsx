import { createClient } from '@/lib/supabase/server'
import TeacherResultsClient from './TeacherResultsClient'

export default async function TeacherResultsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get classes the teacher manages
  const { data: classes } = await supabase.from('classes').select('id, name').eq('teacher_id', user!.id)
  const classIds = (classes || []).map(c => c.id)

  let results: any[] = []
  let logs: any[] = []

  if (classIds.length > 0) {
    const { data: r } = await supabase
      .from('test_results')
      .select('*, user:profiles!user_id(name), assignment:assignments(title, class_id)')
      .in('assignment_id', (
        await supabase.from('assignments').select('id').in('class_id', classIds).then(r => (r.data || []).map(a => a.id))
      ))
      .order('created_at', { ascending: false })
    results = r || []

    const { data: l } = await supabase
      .from('study_logs')
      .select('*, user:profiles!user_id(name), word_set:word_sets(title)')
      .in('assignment_id', (
        await supabase.from('assignments').select('id').in('class_id', classIds).then(r => (r.data || []).map(a => a.id))
      ))
      .order('started_at', { ascending: false })
      .limit(200)
    logs = l || []
  }

  return <TeacherResultsClient results={results} logs={logs} classes={classes || []} />
}
