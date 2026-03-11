'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Users, ChevronRight, Trash2, UserPlus } from 'lucide-react'

interface ClassItem { id: string; name: string; description: string | null; created_at: string; members: { count: number }[] }
interface Student { id: string; name: string; email: string }

export default function TeacherClassesClient({
  initialClasses, allStudents, teacherId
}: { initialClasses: ClassItem[]; allStudents: Student[]; teacherId: string }) {
  const [classes, setClasses] = useState(initialClasses)
  const [showCreate, setShowCreate] = useState(false)
  const [newClass, setNewClass] = useState({ name: '', description: '' })
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [classStudents, setClassStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const createClass = async () => {
    if (!newClass.name) return
    setLoading(true)
    const { data } = await supabase.from('classes')
      .insert({ name: newClass.name, description: newClass.description || null, teacher_id: teacherId })
      .select('*, members:class_members(count)')
      .single()
    if (data) setClasses(c => [data, ...c])
    setNewClass({ name: '', description: '' })
    setShowCreate(false)
    setLoading(false)
  }

  const openClass = async (cls: ClassItem) => {
    setSelectedClass(cls)
    const { data } = await supabase
      .from('class_members')
      .select('student_id, profiles!student_id(id, name, email)')
      .eq('class_id', cls.id)
    if (data) setClassStudents(data.map((d: any) => d.profiles))
  }

  const addStudent = async (studentId: string) => {
    if (!selectedClass) return
    await supabase.from('class_members').insert({ class_id: selectedClass.id, student_id: studentId })
    const student = allStudents.find(s => s.id === studentId)
    if (student) setClassStudents(s => [...s, student])
  }

  const removeStudent = async (studentId: string) => {
    if (!selectedClass) return
    await supabase.from('class_members').delete().eq('class_id', selectedClass.id).eq('student_id', studentId)
    setClassStudents(s => s.filter(x => x.id !== studentId))
  }

  const deleteClass = async (id: string) => {
    if (!confirm('클래스를 삭제하시겠습니까?')) return
    await supabase.from('classes').delete().eq('id', id)
    setClasses(c => c.filter(x => x.id !== id))
    if (selectedClass?.id === id) setSelectedClass(null)
  }

  const unaddedStudents = allStudents.filter(s => !classStudents.find(cs => cs.id === s.id))

  if (selectedClass) return (
    <div>
      <button className="btn btn-secondary btn-sm mb-6" onClick={() => setSelectedClass(null)}>← 목록으로</button>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{selectedClass.name}</h1>
          {selectedClass.description && <p className="text-sm text-[var(--muted)]">{selectedClass.description}</p>}
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => deleteClass(selectedClass.id)}><Trash2 size={14} /></button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-3">현재 학생 ({classStudents.length}명)</h2>
          <div className="space-y-2">
            {classStudents.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-surface2 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-[var(--muted)]">{s.email}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeStudent(s.id)}>제거</button>
              </div>
            ))}
            {classStudents.length === 0 && <p className="text-sm text-[var(--muted)]">등록된 학생이 없습니다.</p>}
          </div>
        </div>
        <div>
          <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-3">학생 추가</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {unaddedStudents.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-surface2 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-[var(--muted)]">{s.email}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => addStudent(s.id)}>
                  <UserPlus size={14} /> 추가
                </button>
              </div>
            ))}
            {unaddedStudents.length === 0 && <p className="text-sm text-[var(--muted)]">추가할 학생이 없습니다.</p>}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">내 클래스</h1>
          <p className="text-sm text-[var(--muted)]">클래스를 만들고 학생을 관리하세요</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> 클래스 만들기</button>
      </div>

      {showCreate && (
        <div className="card mb-6">
          <h2 className="font-bold mb-4">새 클래스</h2>
          <div className="space-y-3 mb-4">
            <input className="input" placeholder="클래스 이름 (예: 중3 영어반)" value={newClass.name}
              onChange={e => setNewClass(f => ({ ...f, name: e.target.value }))} />
            <input className="input" placeholder="설명 (선택)" value={newClass.description}
              onChange={e => setNewClass(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={createClass} disabled={loading}>만들기</button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map(cls => (
          <div key={cls.id} className="card cursor-pointer hover:border-accent transition-colors"
            onClick={() => openClass(cls)}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold">{cls.name}</h3>
              <ChevronRight size={16} className="text-[var(--muted)]" />
            </div>
            {cls.description && <p className="text-sm text-[var(--muted)] mb-3">{cls.description}</p>}
            <div className="flex items-center gap-1 text-sm text-[var(--muted)]">
              <Users size={14} />
              <span>{cls.members?.[0]?.count ?? 0}명</span>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-3 text-center py-12 text-[var(--muted)]">
            아직 클래스가 없습니다. 첫 클래스를 만들어보세요!
          </div>
        )}
      </div>
    </div>
  )
}
