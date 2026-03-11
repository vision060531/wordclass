'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type LoginMode = 'student' | 'teacher' | 'admin'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toEmail = (mode: LoginMode, id: string) => {
    if (mode === 'admin') return `admin@wordclass.local`
    if (mode === 'teacher') return `${id}@wordclass.local`
    return `${id}@wordclass.local`
  }

  const handleLogin = async () => {
    setError('')
    if (mode !== 'admin' && !identifier) { setError('아이디를 입력해주세요.'); return }
    if (!password) { setError('비밀번호를 입력해주세요.'); return }
    setLoading(true)
    const supabase = await createClient()
    const email = toEmail(mode, identifier)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const tabs: { key: LoginMode; label: string }[] = [
    { key: 'student', label: '🎓 학생' },
    { key: 'teacher', label: '👩‍🏫 교사' },
    { key: 'admin', label: '⚙️ 관리자' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-mono text-2xl font-bold text-accent mb-1">WordClass</div>
          <div className="text-sm text-[var(--muted)]">영어 단어 학습 플랫폼</div>
        </div>
        <div className="card">
          <div className="flex gap-1 mb-6">
            {tabs.map(t => (
              <button key={t.key} type="button"
                className={`btn flex-1 btn-sm ${mode === t.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setMode(t.key); setIdentifier(''); setError('') }}>
                {t.label}
              </button>
            ))}
          </div>

          {mode !== 'admin' && (
            <div className="mb-4">
              <label className="block text-xs text-[var(--muted)] mb-1.5">
                {mode === 'student' ? '학번' : '교사 번호'}
              </label>
              <input className="input"
                type="text"
                placeholder={mode === 'student' ? '예: 20241234' : '예: T001'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
          )}
          {mode === 'admin' && (
            <div className="mb-4 text-center text-sm text-[var(--muted)] py-2">
              관리자 계정으로 로그인합니다
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs text-[var(--muted)] mb-1.5">비밀번호</label>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <div className="text-xs text-[var(--accent2)] mb-4">{error}</div>}
          <button className="btn btn-primary w-full" onClick={handleLogin} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
          {mode === 'student' && (
            <div className="text-center mt-4 text-xs text-[var(--muted)]">
              계정이 없으신가요?{' '}
              <Link href="/register" className="text-accent hover:underline">회원가입</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
