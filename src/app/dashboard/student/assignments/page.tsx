import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentAssignmentsClient from './StudentAssignmentsClient'

export default async function StudentAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get classes the student belongs to
  const { data: memberships } = await supabase
    .from('class_members')
    .select('class_id')
    .eq('student_id', user!.id)
  const classIds = (memberships || []).map(m => m.class_id)

  let assignments: any[] = []
  if (classIds.length > 0) {
    const { data } = await supabase
      .from('assignments')
      .select('*, word_set:word_sets(id, title, words:words(count)), class:classes(name)')
      .in('class_id', classIds)
      .order('created_at', { ascending: false })
    assignments = data || []
  }

  // Get this student's test attempts per assignment
  const { data: myResults } = await supabase
    .from('test_results')
    .select('assignment_id, score, passed, created_at')
    .eq('user_id', user!.id)
    .not('assignment_id', 'is', null)

  return <StudentAssignmentsClient
    assignments={assignments}
    myResults={myResults || []}
    userId={user!.id}
  />
}
