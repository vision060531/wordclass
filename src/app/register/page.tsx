'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Role } from '@/lib/types'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' as Role })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleRegister = async () => {
    setError('')
    if (!form.name || !form.email || !form.password) { setError('모든 항목을 입력해주세요.'); return }
    if (form.password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    setLoading(true)
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, role: form.role }
      }
    })
    if (error) { setError(error.message); setLoading(false) }
    else setDone(true)
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card text-center max-w-sm w-full">
        <div className="text-4xl mb-4">✅</div>
        <div className="font-bold text-lg mb-2">가입 완료!</div>
        {form.role === 'teacher'
          ? <p className="text-sm text-[var(--muted)] mb-6">교사 계정은 관리자 승인 후 사용 가능합니다.</p>
          : <p className="text-sm text-[var(--muted)] mb-6">이제 로그인해서 학습을 시작하세요!</p>
        }
        <Link href="/login" className="btn btn-primary w-full">로그인하러 가기</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-mono text-2xl font-bold text-accent mb-1">WordClass</div>
          <div className="text-sm text-[var(--muted)]">회원가입</div>
        </div>
        <div className="card">
          <div className="mb-4">
            <label className="block text-xs text-[var(--muted)] mb-1.5">이름</label>
            <input className="input" placeholder="홍길동" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="mb-4">
            <label className="block text-xs text-[var(--muted)] mb-1.5">이메일</label>
            <input className="input" type="email" placeholder="example@email.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="mb-4">
            <label className="block text-xs text-[var(--muted)] mb-1.5">비밀번호 (6자 이상)</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div className="mb-6">
            <label className="block text-xs text-[var(--muted)] mb-1.5">역할</label>
            <div className="flex gap-2">
              {(['student', 'teacher'] as Role[]).map(r => (
                <button key={r} type="button"
                  className={`btn flex-1 ${form.role === r ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setForm(f => ({ ...f, role: r }))}>
                  {r === 'student' ? '🎓 학생' : '👩‍🏫 교사'}
                </button>
              ))}
            </div>
            {form.role === 'teacher' && (
              <p className="text-xs text-[var(--muted)] mt-2">교사 계정은 관리자 승인 후 활성화됩니다.</p>
            )}
          </div>
          {error && <div className="text-xs text-[var(--accent2)] mb-4">{error}</div>}
          <button className="btn btn-primary w-full" onClick={handleRegister} disabled={loading}>
            {loading ? '처리 중...' : '가입하기'}
          </button>
          <div className="text-center mt-4 text-xs text-[var(--muted)]">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-accent hover:underline">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
