'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { CheckCircle, XCircle, Trash2 } from 'lucide-react'

export default function AdminUsersClient({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [filter, setFilter] = useState<'all' | 'pending' | 'teacher' | 'student'>('all')
  const supabase = createClient()

  const approve = async (id: string, approved: boolean) => {
    await supabase.from('profiles').update({ approved }).eq('id', id)
    setUsers(u => u.map(x => x.id === id ? { ...x, approved } : x))
  }

  const remove = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('profiles').delete().eq('id', id)
    setUsers(u => u.filter(x => x.id !== id))
  }

  const filtered = users.filter(u => {
    if (filter === 'pending') return !u.approved && u.role !== 'superadmin'
    if (filter === 'teacher') return u.role === 'teacher'
    if (filter === 'student') return u.role === 'student'
    return u.role !== 'superadmin'
  })

  const pendingCount = users.filter(u => !u.approved && u.role === 'teacher').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">사용자 관리</h1>
        <p className="text-sm text-[var(--muted)]">전체 사용자를 관리하고 교사 계정을 승인하세요</p>
      </div>

      {pendingCount > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-sm text-yellow-400">
          ⚠️ 승인 대기 중인 교사 계정이 {pendingCount}개 있습니다.
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'teacher', 'student'] as const).map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? '전체' : f === 'pending' ? `승인 대기 (${pendingCount})` : f === 'teacher' ? '교사' : '학생'}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 text-xs uppercase tracking-wider text-[var(--muted)]">이름</th>
              <th className="text-left p-4 text-xs uppercase tracking-wider text-[var(--muted)]">이메일</th>
              <th className="text-left p-4 text-xs uppercase tracking-wider text-[var(--muted)]">역할</th>
              <th className="text-left p-4 text-xs uppercase tracking-wider text-[var(--muted)]">상태</th>
              <th className="text-left p-4 text-xs uppercase tracking-wider text-[var(--muted)]">가입일</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02]">
                <td className="p-4 font-medium">{u.name}</td>
                <td className="p-4 text-[var(--muted)]">{u.email}</td>
                <td className="p-4">
                  <span className={`badge ${u.role === 'teacher' ? 'badge-teacher' : 'badge-muted'}`}>
                    {u.role === 'teacher' ? '교사' : '학생'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`badge ${u.approved ? 'badge-success' : 'badge-danger'}`}>
                    {u.approved ? '활성' : '대기'}
                  </span>
                </td>
                <td className="p-4 text-[var(--muted)] text-xs">
                  {new Date(u.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 justify-end">
                    {!u.approved && (
                      <button className="btn btn-success btn-sm" onClick={() => approve(u.id, true)}>
                        <CheckCircle size={14} /> 승인
                      </button>
                    )}
                    {u.approved && u.role === 'teacher' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => approve(u.id, false)}>
                        <XCircle size={14} /> 정지
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => remove(u.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-[var(--muted)]">해당하는 사용자가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
