import { createClient } from '@/lib/supabase/server'
import StudentWordsetsClient from './StudentWordsetsClient'

export default async function StudentWordsetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Personal wordsets (uploaded by student)
  const { data: myWordsets } = await supabase
    .from('word_sets')
    .select('*, words:words(count)')
    .eq('created_by', user!.id)
    .order('created_at', { ascending: false })

  // Admin public wordsets
  const { data: adminWordsets } = await supabase
    .from('word_sets')
    .select('*, words:words(count), creator:profiles!created_by(role)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  return <StudentWordsetsClient
    myWordsets={myWordsets || []}
    adminWordsets={(adminWordsets || []).filter((w: any) => w.creator?.role === 'superadmin')}
    userId={user!.id}
  />
}
