'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Users } from 'lucide-react'

interface ClassItem {
  id: string; name: string; description: string | null; created_at: string
  teacher: { name: string } | null
  members: { count: number }[]
}

export default function AdminClassesClient({ initialClasses }: { initialClasses: ClassItem[] }) {
  const [classes, setClasses] = useState(initialClasses)
  const supabase = createClient()

  const deleteClass = async (id: string) => {
    if (!confirm('클래스를 삭제하시겠습니까? 관련 과제와 학생 배정도 모두 삭제됩니다.')) return
    await supabase.from('classes').delete().eq('id', id)
    setClasses(c => c.filter(x => x.id !== id))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">클래스 관리</h1>
        <p className="text-sm text-[var(--muted)]">전체 클래스 현황을 확인하고 관리하세요</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="font-mono text-2xl font-bold text-accent">{classes.length}</div>
          <div className="text-xs text-[var(--muted)] mt-1">전체 클래스</div>
        </div>
        <div className="card text-center">
          <div className="font-mono text-2xl font-bold text-[var(--accent3)]">
            {classes.reduce((s, c) => s + (c.members?.[0]?.count ?? 0), 0)}
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">전체 수강 인원</div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['클래스명', '담당 교사', '학생 수', '생성일', ''].map(h => (
                <th key={h} className="text-left p-4 text-xs uppercase tracking-wider text-[var(--muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map(cls => (
              <tr key={cls.id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02]">
                <td className="p-4 font-medium">
                  <div>{cls.name}</div>
                  {cls.description && <div className="text-xs text-[var(--muted)] mt-0.5">{cls.description}</div>}
                </td>
                <td className="p-4 text-[var(--muted)]">{cls.teacher?.name ?? '-'}</td>
                <td className="p-4">
                  <span className="flex items-center gap-1 text-[var(--muted)]">
                    <Users size={13} />{cls.members?.[0]?.count ?? 0}명
                  </span>
                </td>
                <td className="p-4 text-[var(--muted)] text-xs">{new Date(cls.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="p-4">
                  <button className="btn btn-danger btn-sm" onClick={() => deleteClass(cls.id)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-[var(--muted)]">클래스가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
