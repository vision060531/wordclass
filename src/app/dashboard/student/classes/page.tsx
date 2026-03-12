import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentClassesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: memberships } = await supabase
    .from('class_members')
    .select('*, class:classes(id, name, description, teacher:profiles!teacher_id(name))')
    .eq('student_id', session.user.id)

  const classes = (memberships || []).map(m => m.class)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">내 클래스</h1>
        <p className="text-sm text-[var(--muted)]">소속된 클래스 목록입니다</p>
      </div>
      {classes.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <div className="text-4xl mb-3">🏫</div>
          아직 배정된 클래스가 없습니다.<br />
          <span className="text-sm">선생님께 문의해주세요.</span>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls: any) => (
            <div key={cls.id} className="card">
              <h3 className="font-bold mb-1">{cls.name}</h3>
              {cls.description && <p className="text-sm text-[var(--muted)] mb-2">{cls.description}</p>}
              <p className="text-xs text-[var(--muted)]">👩‍🏫 {cls.teacher?.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
