'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Word } from '@/lib/types'

interface Props {
  wordSetId: string
  assignmentId: string | null
  title: string
  mode: 'flashcard' | 'quiz'
  minScore: number | null
  userId: string
  onBack: () => void
}

const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5)

export default function StudyView({ wordSetId, assignmentId, title, mode: initialMode, minScore, userId, onBack }: Props) {
  const [words, setWords] = useState<Word[]>([])
  const [mode, setMode] = useState<'flashcard' | 'quiz'>(initialMode)
  const [loading, setLoading] = useState(true)
  const [logId, setLogId] = useState<string | null>(null)
  const startTime = useRef(Date.now())
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('words').select('*').eq('word_set_id', wordSetId).order('order_index')
      setWords(data || [])
      setLoading(false)
      // Start study log
      const { data: log } = await supabase.from('study_logs').insert({
        user_id: userId,
        word_set_id: wordSetId,
        assignment_id: assignmentId,
        started_at: new Date().toISOString(),
        mode,
      }).select().single()
      if (log) setLogId(log.id)
    })()
    return () => { endLog() }
  }, [])

  const endLog = async () => {
    if (!logId) return
    const duration = Math.floor((Date.now() - startTime.current) / 1000)
    await supabase.from('study_logs').update({
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
    }).eq('id', logId)
  }

  const handleBack = async () => { await endLog(); onBack() }

  if (loading) return <div className="text-center py-20 text-[var(--muted)]">단어 불러오는 중...</div>
  if (words.length === 0) return (
    <div className="text-center py-20">
      <p className="text-[var(--muted)] mb-4">단어가 없습니다.</p>
      <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button className="btn btn-secondary btn-sm" onClick={handleBack}>← 뒤로</button>
        <div className="text-sm text-[var(--muted)]">{title}</div>
        <div className="flex gap-2">
          <button className={`btn btn-sm ${mode === 'flashcard' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('flashcard')}>플래시카드</button>
          <button className={`btn btn-sm ${mode === 'quiz' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('quiz')}>퀴즈</button>
        </div>
      </div>

      {mode === 'flashcard'
        ? <FlashcardMode words={words} userId={userId} wordSetId={wordSetId} />
        : <QuizMode words={words} userId={userId} assignmentId={assignmentId} wordSetId={wordSetId} minScore={minScore} />
      }
    </div>
  )
}

// ── FLASHCARD ──────────────────────────────────────────────
function FlashcardMode({ words, userId, wordSetId }: { words: Word[]; userId: string; wordSetId: string }) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [langMode, setLangMode] = useState<'en2ko' | 'ko2en'>('en2ko')
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  useEffect(() => {
    supabase.from('word_progress').select('word_id, known')
      .eq('user_id', userId).eq('word_set_id', wordSetId)
      .then(({ data }) => {
        if (data) setProgress(Object.fromEntries(data.map(d => [d.word_id, d.known])))
      })
  }, [])

  const word = words[idx]
  const front = langMode === 'en2ko' ? word.term : word.definition
  const back = langMode === 'en2ko' ? word.definition : word.term

  const markKnown = async (known: boolean) => {
    setProgress(p => ({ ...p, [word.id]: known }))
    await supabase.from('word_progress').upsert({
      user_id: userId, word_id: word.id, word_set_id: wordSetId, known,
      attempts: 1, last_seen: new Date().toISOString(),
    }, { onConflict: 'user_id,word_id' })
    if (idx < words.length - 1) { setFlipped(false); setTimeout(() => setIdx(i => i + 1), 100) }
  }

  const knownCount = Object.values(progress).filter(Boolean).length

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[var(--muted)]">{idx + 1} / {words.length}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => setLangMode(m => m === 'en2ko' ? 'ko2en' : 'en2ko')}>
          {langMode === 'en2ko' ? '영→한' : '한→영'} 전환
        </button>
        <span className="text-sm text-[var(--accent3)]">✓ {knownCount}/{words.length}</span>
      </div>

      <div className="w-full h-2 bg-surface2 rounded-full mb-6">
        <div className="h-2 bg-gradient-to-r from-accent to-[var(--accent3)] rounded-full transition-all"
          style={{ width: `${((idx + 1) / words.length) * 100}%` }} />
      </div>

      <div className="flashcard-wrap mb-6">
        <div className={`flashcard ${flipped ? 'flipped' : ''}`} style={{ height: 200 }}
          onClick={() => setFlipped(f => !f)}>
          <div className="fc-front border border-[var(--border)]" style={{ background: 'linear-gradient(135deg, #1e1e2e, #2a2040)' }}>
            <div className="font-mono text-3xl font-bold text-accent mb-2">{front}</div>
            {progress[word.id] !== undefined && (
              <span className={`badge ${progress[word.id] ? 'badge-success' : 'badge-danger'}`}>
                {progress[word.id] ? '✓ 알아요' : '복습 필요'}
              </span>
            )}
            <div className="text-xs text-[var(--muted)] mt-3">탭하여 뒤집기</div>
          </div>
          <div className="fc-back border border-[var(--border)]" style={{ background: 'linear-gradient(135deg, #1a2a1a, #1a2040)' }}>
            <div className="text-2xl font-bold text-[var(--accent3)] mb-2">{back}</div>
            {word.example && <div className="text-sm text-[var(--muted)] italic text-center mt-2">"{word.example}"</div>}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center mb-6">
        <button className="btn btn-secondary" onClick={() => { setFlipped(false); setIdx(i => Math.max(0, i - 1)) }} disabled={idx === 0}>← 이전</button>
        <button className="btn btn-danger" onClick={() => markKnown(false)}>❌ 모름</button>
        <button className="btn btn-success" onClick={() => markKnown(true)}>✅ 알아요</button>
        <button className="btn btn-secondary" onClick={() => { setFlipped(false); setIdx(i => Math.min(words.length - 1, i + 1)) }} disabled={idx === words.length - 1}>다음 →</button>
      </div>
    </div>
  )
}

// ── QUIZ ──────────────────────────────────────────────────
function QuizMode({ words, userId, assignmentId, wordSetId, minScore }: {
  words: Word[]; userId: string; assignmentId: string | null; wordSetId: string; minScore: number | null
}) {
  const [count, setCount] = useState(10)
  const [phase, setPhase] = useState<'setup' | 'test' | 'result'>('setup')
  const [questions, setQuestions] = useState<{ correct: Word; choices: Word[] }[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<Word | null>(null)
  const [answers, setAnswers] = useState<{ correct: boolean; word: Word }[]>([])
  const [langMode, setLangMode] = useState<'en2ko' | 'ko2en'>('en2ko')
  const [result, setResult] = useState<any>(null)
  const supabase = createClient()

  const start = () => {
    const q = shuffle(words).slice(0, Math.min(count, words.length)).map(w => ({
      correct: w,
      choices: shuffle([w, ...shuffle(words.filter(x => x.id !== w.id)).slice(0, 3)])
    }))
    setQuestions(q); setQIdx(0); setAnswers([]); setSelected(null); setPhase('test')
  }

  const choose = async (choice: Word) => {
    if (selected) return
    setSelected(choice)
    const isCorrect = choice.id === questions[qIdx].correct.id
    const newAnswers = [...answers, { correct: isCorrect, word: questions[qIdx].correct }]

    setTimeout(async () => {
      if (qIdx + 1 >= questions.length) {
        const correctCount = newAnswers.filter(a => a.correct).length
        const score = Math.round((correctCount / questions.length) * 100)
        const passed = minScore ? score >= minScore : true
        const r = {
          user_id: userId, assignment_id: assignmentId, word_set_id: wordSetId,
          score, correct: correctCount, total: questions.length, passed,
          answers: newAnswers.map((a, i) => ({
            word_id: questions[i].correct.id,
            term: questions[i].correct.term,
            correct_definition: questions[i].correct.definition,
            selected: choice.definition,
            is_correct: a.correct,
          }))
        }
        const { data } = await supabase.from('test_results').insert(r).select().single()
        setResult({ ...r, id: data?.id })
        setPhase('result')
      } else {
        setQIdx(i => i + 1); setSelected(null)
      }
    }, 800)
  }

  if (phase === 'setup') return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h2 className="font-bold mb-4">퀴즈 설정</h2>
        <div className="mb-4">
          <label className="text-xs text-[var(--muted)] mb-2 block">문제 방향</label>
          <div className="flex gap-2">
            <button className={`btn btn-sm flex-1 ${langMode === 'en2ko' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLangMode('en2ko')}>영어 → 한국어</button>
            <button className={`btn btn-sm flex-1 ${langMode === 'ko2en' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLangMode('ko2en')}>한국어 → 영어</button>
          </div>
        </div>
        <div className="mb-6">
          <label className="text-xs text-[var(--muted)] mb-2 block">문제 수</label>
          <div className="flex gap-2 flex-wrap">
            {[5, 10, 15, 20].filter(n => n <= words.length).map(n => (
              <button key={n} className={`btn btn-sm ${count === n ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCount(n)}>{n}문제</button>
            ))}
          </div>
        </div>
        {minScore && <p className="text-sm text-[var(--muted)] mb-4">통과 기준: {minScore}점 이상</p>}
        <button className="btn btn-primary w-full btn-lg" onClick={start}>시작</button>
      </div>
    </div>
  )

  if (phase === 'result') {
    const pct = result.score
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center mb-6" style={{ padding: '40px 24px' }}>
          <div className="text-5xl mb-3">{pct >= 80 ? '🎉' : pct >= 60 ? '😊' : '😅'}</div>
          <div className={`font-mono text-5xl font-bold mb-2 ${pct >= 80 ? 'text-[var(--accent3)]' : pct >= 60 ? 'text-accent' : 'text-[var(--accent2)]'}`}>{pct}점</div>
          <div className="text-[var(--muted)]">{result.correct}/{result.total} 정답</div>
          {minScore && (
            <div className={`mt-3 badge ${result.passed ? 'badge-success' : 'badge-danger'}`}>
              {result.passed ? '✓ 통과' : `통과 기준 ${minScore}점 미달`}
            </div>
          )}
        </div>
        <div className="flex gap-2 mb-6">
          <button className="btn btn-primary" onClick={() => { setPhase('setup'); setResult(null) }}>다시 풀기</button>
        </div>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg text-sm"
              style={{ background: answers[i]?.correct ? 'rgba(67,233,123,0.08)' : 'rgba(255,107,107,0.08)', borderLeft: `3px solid ${answers[i]?.correct ? 'var(--accent3)' : 'var(--accent2)'}` }}>
              <span>{answers[i]?.correct ? '✅' : '❌'}</span>
              <span className="font-mono text-accent min-w-[120px]">{q.correct.term}</span>
              <span>{q.correct.definition}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const q = questions[qIdx]
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[var(--muted)]">{qIdx + 1} / {questions.length}</span>
        <span className="badge badge-accent">{langMode === 'en2ko' ? '영→한' : '한→영'}</span>
      </div>
      <div className="w-full h-2 bg-surface2 rounded-full mb-6">
        <div className="h-2 bg-accent rounded-full transition-all" style={{ width: `${(qIdx / questions.length) * 100}%` }} />
      </div>
      <div className="card text-center mb-6" style={{ padding: '40px 24px' }}>
        <div className="text-xs text-[var(--muted)] mb-2">뜻을 고르세요</div>
        <div className="font-mono text-3xl font-bold text-accent">
          {langMode === 'en2ko' ? q.correct.term : q.correct.definition}
        </div>
      </div>
      <div className="space-y-3">
        {q.choices.map(c => {
          const label = langMode === 'en2ko' ? c.definition : c.term
          let cls = 'p-4 rounded-xl border-2 cursor-pointer transition-all text-sm '
          if (selected) {
            if (c.id === q.correct.id) cls += 'border-[var(--accent3)] bg-green-500/10 text-[var(--accent3)] cursor-default'
            else if (c.id === selected.id) cls += 'border-[var(--accent2)] bg-red-500/10 text-[var(--accent2)] cursor-default'
            else cls += 'border-[var(--border)] bg-surface2 opacity-50 cursor-default'
          } else {
            cls += 'border-[var(--border)] bg-surface2 hover:border-accent hover:bg-purple-500/10'
          }
          return <div key={c.id} className={cls} onClick={() => choose(c)}>{label}</div>
        })}
      </div>
    </div>
  )
}
