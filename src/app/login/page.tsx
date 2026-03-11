'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    if (!identifier || !password) { setError('아이디와 비밀번호를 입력해주세요.'); return }
    setLoading(true)
    const supabase = createClient()
    const email = `${identifier}@wordclass.local`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-mono text-2xl font-bold text-accent mb-1">WordClass</div>
          <div className="text-sm text-[var(--muted)]">영어 단어 학습 플랫폼</div>
        </div>
        <div className="card">
          <div className="mb-4">
            <label className="block text-xs text-[var(--muted)] mb-1.5">아이디</label>
            <input className="input" type="text"
              placeholder="학번 / 교번 / admin"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
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
          <div className="text-center mt-4 text-xs text-[var(--muted)]">
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-accent hover:underline">회원가입</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
