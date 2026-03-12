import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'

export default async function StudentResultsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const { data: results } = await supabase
    .from('test_results')
    .select('*, assignment:assignments(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const { data: logs } = await supabase
    .from('study_logs')
    .select('*, word_set:word_sets(title)')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(50)

  const totalStudyTime = (logs || []).reduce((s, l) => s + (l.duration_seconds || 0), 0)
  const avgScore = (results || []).length ? Math.round((results || []).reduce((s, r) => s + r.score, 0) / results!.length) : 0
  const bestScore = (results || []).length ? Math.max(...results!.map(r => r.score)) : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">내 기록</h1>
        <p className="text-sm text-[var(--muted)]">학습 기록과 시험 결과를 확인하세요</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="font-mono text-2xl font-bold text-accent">{(results || []).length}</div>
          <div className="text-xs text-[var(--muted)] mt-1">총 응시</div>
        </div>
        <div className="card text-center">
          <div className="font-mono text-2xl font-bold text-[var(--accent3)]">{avgScore}</div>
          <div className="text-xs text-[var(--muted)] mt-1">평균 점수</div>
        </div>
        <div className="card text-center">
          <div className="font-mono text-2xl font-bold">{bestScore}</div>
          <div className="text-xs text-[var(--muted)] mt-1">최고 점수</div>
        </div>
        <div className="card text-center">
          <div className="font-mono text-2xl font-bold text-[var(--accent2)]">{Math.floor(totalStudyTime / 60)}</div>
          <div className="text-xs text-[var(--muted)] mt-1">총 학습 분</div>
        </div>
      </div>

      <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-3">시험 기록</h2>
      <div className="card p-0 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['과제', '점수', '결과', '날짜'].map(h => (
                <th key={h} className="text-left p-4 text-xs uppercase tracking-wider text-[var(--muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(results || []).map(r => (
              <tr key={r.id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02]">
                <td className="p-4">{r.assignment?.title ?? '자유 학습'}</td>
                <td className="p-4">
                  <span className={`font-mono font-bold ${r.score >= 80 ? 'text-[var(--accent3)]' : r.score >= 60 ? 'text-accent' : 'text-[var(--accent2)]'}`}>
                    {r.score}점
                  </span>
                  <span className="text-xs text-[var(--muted)] ml-1">({r.correct}/{r.total})</span>
                </td>
                <td className="p-4">
                  <span className={`badge ${r.passed ? 'badge-success' : 'badge-danger'}`}>{r.passed ? '통과' : '미통과'}</span>
                </td>
                <td className="p-4 text-[var(--muted)] text-xs">{format(parseISO(r.created_at), 'MM/dd HH:mm')}</td>
              </tr>
            ))}
            {!(results || []).length && <tr><td colSpan={4} className="p-8 text-center text-[var(--muted)]">아직 시험 기록이 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-3">학습 로그</h2>
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['단어 세트', '방식', '시작 시간', '학습 시간'].map(h => (
                <th key={h} className="text-left p-4 text-xs uppercase tracking-wider text-[var(--muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(logs || []).map(l => (
              <tr key={l.id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02]">
                <td className="p-4">{l.word_set?.title ?? '-'}</td>
                <td className="p-4"><span className="badge badge-accent">{l.mode}</span></td>
                <td className="p-4 text-[var(--muted)] text-xs">{format(parseISO(l.started_at), 'MM/dd HH:mm')}</td>
                <td className="p-4 text-xs">
                  {l.duration_seconds ? `${Math.floor(l.duration_seconds / 60)}분 ${l.duration_seconds % 60}초` : '-'}
                </td>
              </tr>
            ))}
            {!(logs || []).length && <tr><td colSpan={4} className="p-8 text-center text-[var(--muted)]">학습 기록이 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
