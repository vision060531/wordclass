import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminResultsClient from './AdminResultsClient'

export default async function AdminResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: results }, { data: logs }] = await Promise.all([
    supabase
      .from('test_results')
      .select('*, user:profiles!user_id(name), assignment:assignments(title)')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('study_logs')
      .select('*, user:profiles!user_id(name), word_set:word_sets(title)')
      .order('started_at', { ascending: false })
      .limit(300),
  ])

  return <AdminResultsClient results={results || []} logs={logs || []} />
}
