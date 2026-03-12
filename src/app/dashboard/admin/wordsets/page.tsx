import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminWordsetsClient from './AdminWordsetsClient'

export default async function AdminWordsetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wordsets } = await supabase
    .from('word_sets')
    .select('*, words:words(count), creator:profiles!created_by(name)')
    .order('created_at', { ascending: false })

  return <AdminWordsetsClient initialWordsets={wordsets || []} adminId={user.id} />
}
