'use client'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'

interface Result {
  id: string; score: number; correct: number; total: number; passed: boolean; created_at: string
  user: { name: string } | null
  assignment: { title: string } | null
}
interface Log {
  id: string; mode: string; started_at: string; duration_seconds: number | null
  user: { name: string } | null
  word_set: { title: string } | null
}

export default function AdminResultsClient({ results, logs }: { results: Result[]; logs: Log[] }) {
  const [tab, setTab] = useState<'results' | 'logs'>('results')
  const [search, setSearch] = useState('')

  const filteredResults = results.filter(r =>
    !search || r.user?.name?.includes(search) || r.assignment?.title?.includes(search)
  )
  const filteredLogs = logs.filter(l =>
    !search || l.user?.name?.includes(search) || l.word_set?.title?.includes(search)
  )

  const exportCSV = () => {
    const headers = '학생,과제,점수,정답,전체,합격,날짜\n'
    const rows = filteredResults.map(r =>
      `${r.user?.name ?? '-'},${r.assignment?.title ?? '자유학습'},${r.score},${r.correct},${r.total},${r.passed ? 'O' : 'X'},${format(parseISO(r.created_at), 'yyyy-MM-dd HH:mm')}`
    ).join('\n')
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'all_results.csv'; a.click()
  }

  const avgScore = filteredResults.length
    ? Math.round(filteredResults.reduce((s, r) => s + r.score, 0) / filteredResults.length)
    : 0
  const passRate = filteredResults.length
    ? Math.round(filteredResults.filter(r => r.passed).length / filteredResults.length * 100)
    : 0
  const totalStudyMin = Math.floor(logs.reduce((s, l) => s + (l.duration_seconds || 0), 0) / 60)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">전체 기록</h1>
          <p className="text-sm text-[var(--muted)]">모든 학생의 시험 결과와 학습 로그를 확인하세요</p>
        </div>
        {tab === 'results' && filteredResults.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>CSV 다운로드</button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="font-mono text-2xl font-bold text-accent">{results.length}</div>
          <div className="text-xs text-[var(--muted)] mt-1">총 응시</div>
        </div>
        <div className="card text-center">
          <div className="font-mono text-2xl font-bold text-[var(--accent3)]">{avgScore}</div>
          <div className="text-xs text-[var(--muted)] mt-1">평균 점수</div>
        </div>
        <div className="card text-center">
          <div className="font-mono text-2xl font-bold">{passRate}%</div>
          <div className="text-xs text-[var(--muted)] mt-1">합격률</div>
        </div>
        <div className="card text-center">
          <div className="font-mono text-2xl font-bold text-[var(--accent2)]">{totalStudyMin}</div>
          <div className="text-xs text-[var(--muted)] mt-1">총 학습 분</div>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex gap-2">
          <button className={`btn btn-sm ${tab === 'results' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('results')}>
            시험 결과 ({results.length})
          </button>
          <button className={`btn btn-sm ${tab === 'logs' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('logs')}>
            학습 로그 ({logs.length})
          </button>
        </div>
        <input
          className="input flex-1 min-w-[160px]"
          placeholder="학생명 또는 과제/단어세트로 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {tab === 'results' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['학생', '과제', '점수', '결과', '날짜'].map(h => (
                  <th key={h} className="text-left p-4 text-xs uppercase tracking-wider text-[var(--muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredResults.map(r => (
                <tr key={r.id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02]">
                  <td className="p-4 font-medium">{r.user?.name ?? '-'}</td>
                  <td className="p-4 text-[var(--muted)]">{r.assignment?.title ?? '자유 학습'}</td>
                  <td className="p-4">
                    <span className={`font-bold font-mono ${r.score >= 80 ? 'text-[var(--accent3)]' : r.score >= 60 ? 'text-accent' : 'text-[var(--accent2)]'}`}>
                      {r.score}점
                    </span>
                    <span className="text-xs text-[var(--muted)] ml-1">({r.correct}/{r.total})</span>
                  </td>
                  <td className="p-4">
                    <span className={`badge ${r.passed ? 'badge-success' : 'badge-danger'}`}>{r.passed ? '합격' : '불합격'}</span>
                  </td>
                  <td className="p-4 text-[var(--muted)] text-xs">{format(parseISO(r.created_at), 'MM/dd HH:mm')}</td>
                </tr>
              ))}
              {filteredResults.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-[var(--muted)]">시험 기록이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'logs' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['학생', '단어 세트', '학습 방식', '시작 시간', '학습 시간'].map(h => (
                  <th key={h} className="text-left p-4 text-xs uppercase tracking-wider text-[var(--muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(l => (
                <tr key={l.id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02]">
                  <td className="p-4 font-medium">{l.user?.name ?? '-'}</td>
                  <td className="p-4 text-[var(--muted)]">{l.word_set?.title ?? '-'}</td>
                  <td className="p-4"><span className="badge badge-accent">{l.mode}</span></td>
                  <td className="p-4 text-[var(--muted)] text-xs">{format(parseISO(l.started_at), 'MM/dd HH:mm')}</td>
                  <td className="p-4 text-xs">
                    {l.duration_seconds ? `${Math.floor(l.duration_seconds / 60)}분 ${l.duration_seconds % 60}초` : '-'}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-[var(--muted)]">학습 기록이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
