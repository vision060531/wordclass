'use client'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'

interface Result {
  id: string; score: number; correct: number; total: number; passed: boolean
  created_at: string; user: { name: string } | null; assignment: { title: string } | null
}
interface Log {
  id: string; mode: string; started_at: string; duration_seconds: number | null
  user: { name: string } | null; word_set: { title: string } | null
}

export default function TeacherResultsClient({
  results, logs, classes
}: { results: Result[]; logs: Log[]; classes: { id: string; name: string }[] }) {
  const [tab, setTab] = useState<'results' | 'logs'>('results')

  const exportCSV = () => {
    const headers = '학생,과제,점수,정답,전체,합격,날짜\n'
    const rows = results.map(r =>
      `${r.user?.name},${r.assignment?.title},${r.score},${r.correct},${r.total},${r.passed ? 'O' : 'X'},${format(parseISO(r.created_at), 'yyyy-MM-dd HH:mm')}`
    ).join('\n')
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'results.csv'; a.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">학습 기록</h1>
          <p className="text-sm text-[var(--muted)]">학생들의 시험 결과와 학습 시간을 확인하세요</p>
        </div>
        {tab === 'results' && results.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>CSV 다운로드</button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <button className={`btn btn-sm ${tab === 'results' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('results')}>
          시험 결과 ({results.length})
        </button>
        <button className={`btn btn-sm ${tab === 'logs' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('logs')}>
          학습 로그 ({logs.length})
        </button>
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
              {results.map(r => (
                <tr key={r.id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02]">
                  <td className="p-4 font-medium">{r.user?.name ?? '-'}</td>
                  <td className="p-4 text-[var(--muted)]">{r.assignment?.title ?? '-'}</td>
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
              {results.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[var(--muted)]">아직 시험 기록이 없습니다.</td></tr>}
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
              {logs.map(l => (
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
              {logs.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[var(--muted)]">학습 기록이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
