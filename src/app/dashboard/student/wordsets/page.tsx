import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentWordsetsClient from './StudentWordsetsClient'

export default async function StudentWordsetsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const { data: myWordsets } = await supabase
    .from('word_sets')
    .select('*, words:words(count)')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  const { data: adminWordsets } = await supabase
    .from('word_sets')
    .select('*, words:words(count), creator:profiles!created_by(role)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  return <StudentWordsetsClient
    myWordsets={myWordsets || []}
    adminWordsets={(adminWordsets || []).filter((w: any) => w.creator?.role === 'superadmin')}
    userId={userId}
  />
}
