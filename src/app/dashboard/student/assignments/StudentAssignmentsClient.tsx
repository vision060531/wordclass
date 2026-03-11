'use client'
import { useState } from 'react'
import { isPast, parseISO, format } from 'date-fns'
import { Calendar, Target, BookOpen, Play } from 'lucide-react'
import StudyView from '@/components/StudyView'

interface Assignment {
  id: string; title: string; description: string | null
  due_date: string | null; min_score: number | null; max_attempts: number | null
  word_set: { id: string; title: string; words: any[] } | null
  class: { name: string } | null
}
interface MyResult { assignment_id: string; score: number; passed: boolean; created_at: string }

export default function StudentAssignmentsClient({
  assignments, myResults, userId
}: { assignments: Assignment[]; myResults: MyResult[]; userId: string }) {
  const [activeStudy, setActiveStudy] = useState<{ assignment: Assignment; mode: 'flashcard' | 'quiz' } | null>(null)

  const getMyAttempts = (aId: string) => myResults.filter(r => r.assignment_id === aId)
  const getBestScore = (aId: string) => {
    const attempts = getMyAttempts(aId)
    return attempts.length ? Math.max(...attempts.map(r => r.score)) : null
  }

  const canTakeTest = (a: Assignment) => {
    if (a.due_date && isPast(parseISO(a.due_date))) return false
    if (a.max_attempts) {
      const attempts = getMyAttempts(a.id)
      if (attempts.length >= a.max_attempts) return false
    }
    return true
  }

  if (activeStudy) return (
    <StudyView
      wordSetId={activeStudy.assignment.word_set!.id}
      assignmentId={activeStudy.assignment.id}
      title={activeStudy.assignment.title}
      mode={activeStudy.mode}
      minScore={activeStudy.assignment.min_score}
      userId={userId}
      onBack={() => setActiveStudy(null)}
    />
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">과제</h1>
        <p className="text-sm text-[var(--muted)]">선생님이 출제한 단어 학습 과제입니다</p>
      </div>

      <div className="space-y-4">
        {assignments.map(a => {
          const overdue = a.due_date && isPast(parseISO(a.due_date))
          const bestScore = getBestScore(a.id)
          const attempts = getMyAttempts(a.id)
          const canTest = canTakeTest(a)
          const wordCount = a.word_set?.words?.[0]?.count ?? 0

          return (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold">{a.title}</h3>
                    {overdue && <span className="badge badge-danger">마감됨</span>}
                    {bestScore !== null && bestScore >= (a.min_score ?? 0) && (
                      <span className="badge badge-success">✓ 통과</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--muted)] flex-wrap">
                    <span>🏫 {a.class?.name}</span>
                    <span className="flex items-center gap-1"><BookOpen size={12} /> {a.word_set?.title} ({wordCount}단어)</span>
                    {a.due_date && (
                      <span className={`flex items-center gap-1 ${overdue ? 'text-[var(--accent2)]' : ''}`}>
                        <Calendar size={12} /> {format(parseISO(a.due_date), 'MM/dd HH:mm')}
                      </span>
                    )}
                    {a.min_score && <span className="flex items-center gap-1"><Target size={12} /> 통과 {a.min_score}점</span>}
                  </div>
                </div>
                {bestScore !== null && (
                  <div className="text-right">
                    <div className={`font-mono font-bold text-xl ${bestScore >= 80 ? 'text-[var(--accent3)]' : bestScore >= 60 ? 'text-accent' : 'text-[var(--accent2)]'}`}>
                      {bestScore}점
                    </div>
                    <div className="text-xs text-[var(--muted)]">최고 점수 · {attempts.length}회 응시</div>
                  </div>
                )}
              </div>

              {a.description && <p className="text-sm text-[var(--muted)] mb-3">{a.description}</p>}

              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-secondary btn-sm"
                  onClick={() => setActiveStudy({ assignment: a, mode: 'flashcard' })}>
                  🃏 학습하기
                </button>
                <button
                  className={`btn btn-sm ${canTest ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
                  disabled={!canTest}
                  onClick={() => canTest && setActiveStudy({ assignment: a, mode: 'quiz' })}>
                  <Play size={14} />
                  {overdue ? '시험 마감' : !canTest && a.max_attempts ? `응시 완료 (${attempts.length}/${a.max_attempts})` : '시험 보기'}
                </button>
              </div>
            </div>
          )
        })}
        {assignments.length === 0 && (
          <div className="text-center py-12 text-[var(--muted)]">
            <div className="text-4xl mb-3">📭</div>
            아직 출제된 과제가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
