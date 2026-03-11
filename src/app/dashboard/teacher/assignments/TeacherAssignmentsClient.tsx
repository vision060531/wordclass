'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Calendar, Target } from 'lucide-react'
import { format, isPast, parseISO } from 'date-fns'

interface Assignment {
  id: string; title: string; description: string | null
  due_date: string | null; min_score: number | null; max_attempts: number | null
  word_set: { title: string } | null; class: { name: string } | null
  created_at: string
}

export default function TeacherAssignmentsClient({
  initialAssignments, classes, wordsets, teacherId
}: {
  initialAssignments: Assignment[]
  classes: { id: string; name: string }[]
  wordsets: { id: string; title: string; words: any[] }[]
  teacherId: string
}) {
  const [assignments, setAssignments] = useState(initialAssignments)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', classId: '', wordSetId: '',
    dueDate: '', minScore: '', maxAttempts: ''
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const createAssignment = async () => {
    if (!form.title || !form.classId || !form.wordSetId) return
    setLoading(true)
    const { data } = await supabase.from('assignments').insert({
      title: form.title,
      description: form.description || null,
      class_id: form.classId,
      word_set_id: form.wordSetId,
      due_date: form.dueDate || null,
      min_score: form.minScore ? parseInt(form.minScore) : null,
      max_attempts: form.maxAttempts ? parseInt(form.maxAttempts) : null,
      created_by: teacherId,
    }).select('*, word_set:word_sets(title), class:classes(name)').single()

    if (data) setAssignments(a => [data, ...a])
    setShowCreate(false)
    setForm({ title: '', description: '', classId: '', wordSetId: '', dueDate: '', minScore: '', maxAttempts: '' })
    setLoading(false)
  }

  const deleteAssignment = async (id: string) => {
    if (!confirm('과제를 삭제하시겠습니까?')) return
    await supabase.from('assignments').delete().eq('id', id)
    setAssignments(a => a.filter(x => x.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">과제 관리</h1>
          <p className="text-sm text-[var(--muted)]">클래스에 단어 학습 과제를 출제하세요</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> 과제 출제</button>
      </div>

      {showCreate && (
        <div className="card mb-6">
          <h2 className="font-bold mb-4">새 과제</h2>
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <input className="input md:col-span-2" placeholder="과제 제목" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <input className="input md:col-span-2" placeholder="설명 (선택)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <select className="input" value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
              <option value="">클래스 선택</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input" value={form.wordSetId} onChange={e => setForm(f => ({ ...f, wordSetId: e.target.value }))}>
              <option value="">단어 세트 선택</option>
              {wordsets.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
            </select>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">마감일 (선택)</label>
              <input className="input" type="datetime-local" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">최소 통과 점수 % (선택)</label>
              <input className="input" type="number" placeholder="예: 70" min="0" max="100" value={form.minScore}
                onChange={e => setForm(f => ({ ...f, minScore: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">최대 응시 횟수 (선택, 빈칸=무제한)</label>
              <input className="input" type="number" placeholder="예: 3" min="1" value={form.maxAttempts}
                onChange={e => setForm(f => ({ ...f, maxAttempts: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={createAssignment} disabled={loading || !form.title || !form.classId || !form.wordSetId}>
              {loading ? '출제 중...' : '과제 출제'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {assignments.map(a => {
          const overdue = a.due_date && isPast(parseISO(a.due_date))
          return (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold">{a.title}</h3>
                    {overdue && <span className="badge badge-danger">마감</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--muted)] flex-wrap">
                    <span>📚 {a.word_set?.title}</span>
                    <span>🏫 {a.class?.name}</span>
                    {a.due_date && (
                      <span className={`flex items-center gap-1 ${overdue ? 'text-[var(--accent2)]' : ''}`}>
                        <Calendar size={12} /> {format(parseISO(a.due_date), 'MM/dd HH:mm')}
                      </span>
                    )}
                    {a.min_score && <span className="flex items-center gap-1"><Target size={12} /> 통과 {a.min_score}점</span>}
                    {a.max_attempts && <span>최대 {a.max_attempts}회</span>}
                  </div>
                </div>
                <button className="btn btn-danger btn-sm ml-4" onClick={() => deleteAssignment(a.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          )
        })}
        {assignments.length === 0 && <div className="text-center py-12 text-[var(--muted)]">아직 출제한 과제가 없습니다.</div>}
      </div>
    </div>
  )
}
