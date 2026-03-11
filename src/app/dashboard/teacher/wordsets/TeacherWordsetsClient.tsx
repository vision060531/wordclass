'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, BookOpen, Trash2, Eye } from 'lucide-react'
import Papa from 'papaparse'

interface WordSet { id: string; title: string; description: string | null; class_id: string | null; created_at: string; words: { count: number }[] }
interface ClassItem { id: string; name: string }
interface ParsedWord { term: string; definition: string; example: string }

export default function TeacherWordsetsClient({
  initialWordsets, classes, teacherId
}: { initialWordsets: WordSet[]; classes: ClassItem[]; teacherId: string }) {
  const [wordsets, setWordsets] = useState(initialWordsets)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<ParsedWord[]>([])
  const [form, setForm] = useState({ title: '', description: '', classId: '' })
  const [viewWords, setViewWords] = useState<{ set: WordSet; words: any[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[]
        const parsed: ParsedWord[] = rows.map(r => ({
          term: r['단어'] || r['term'] || r['word'] || '',
          definition: r['뜻'] || r['definition'] || r['meaning'] || '',
          example: r['예문'] || r['example'] || '',
        })).filter(r => r.term && r.definition)
        setPreview(parsed)
      }
    })
  }

  const uploadWordset = async () => {
    if (!form.title || preview.length === 0) return
    setUploading(true)
    const { data: ws } = await supabase.from('word_sets').insert({
      title: form.title,
      description: form.description || null,
      created_by: teacherId,
      class_id: form.classId || null,
      is_public: false,
    }).select().single()

    if (ws) {
      const words = preview.map((w, i) => ({
        word_set_id: ws.id,
        term: w.term,
        definition: w.definition,
        example: w.example || null,
        order_index: i,
      }))
      await supabase.from('words').insert(words)
      const newSet = { ...ws, words: [{ count: words.length }] }
      setWordsets(s => [newSet, ...s])
    }
    setShowUpload(false)
    setPreview([])
    setForm({ title: '', description: '', classId: '' })
    setUploading(false)
  }

  const deleteWordset = async (id: string) => {
    if (!confirm('단어 세트를 삭제하시겠습니까?')) return
    await supabase.from('word_sets').delete().eq('id', id)
    setWordsets(s => s.filter(x => x.id !== id))
  }

  const openWordset = async (ws: WordSet) => {
    const { data: words } = await supabase.from('words').select('*').eq('word_set_id', ws.id).order('order_index')
    setViewWords({ set: ws, words: words || [] })
  }

  if (viewWords) return (
    <div>
      <button className="btn btn-secondary btn-sm mb-6" onClick={() => setViewWords(null)}>← 목록으로</button>
      <h1 className="text-2xl font-bold mb-1">{viewWords.set.title}</h1>
      <p className="text-sm text-[var(--muted)] mb-6">{viewWords.words.length}개 단어</p>
      <div className="space-y-2">
        {viewWords.words.map((w, i) => (
          <div key={w.id} className="flex items-center gap-4 p-3 bg-surface2 rounded-lg text-sm">
            <span className="text-[var(--muted)] w-6 text-xs">{i + 1}</span>
            <span className="font-mono text-accent min-w-[140px]">{w.term}</span>
            <span className="text-[var(--text)] flex-1">{w.definition}</span>
            {w.example && <span className="text-[var(--muted)] text-xs italic hidden md:block">{w.example}</span>}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">단어 세트</h1>
          <p className="text-sm text-[var(--muted)]">CSV 파일로 단어를 업로드하세요</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}><Upload size={16} /> 업로드</button>
      </div>

      {/* CSV format guide */}
      <div className="mb-6 p-4 rounded-xl bg-surface2 border border-[var(--border)] text-sm">
        <div className="font-medium mb-2">📄 CSV 파일 형식</div>
        <div className="font-mono text-xs text-[var(--muted)] space-y-1">
          <div>단어,뜻,예문</div>
          <div>ambiguous,모호한,The instructions were ambiguous.</div>
          <div>diligent,근면한,She was a diligent student.</div>
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">헤더: 단어/뜻/예문 또는 term/definition/example</p>
      </div>

      {showUpload && (
        <div className="card mb-6">
          <h2 className="font-bold mb-4">새 단어 세트 업로드</h2>
          <div className="space-y-3 mb-4">
            <input className="input" placeholder="단어 세트 이름" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <input className="input" placeholder="설명 (선택)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <select className="input" value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
              <option value="">클래스 연결 안함 (개인 세트)</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div
              className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center cursor-pointer hover:border-accent transition-colors"
              onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
              onDragOver={e => e.preventDefault()}>
              <Upload size={24} className="mx-auto mb-2 text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">CSV 파일을 드래그하거나 클릭해서 선택</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => e.target.files && handleFile(e.target.files[0])} />
            </div>
          </div>

          {preview.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-[var(--accent3)] mb-2">✅ {preview.length}개 단어 인식됨</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {preview.slice(0, 5).map((w, i) => (
                  <div key={i} className="flex gap-3 text-xs p-2 bg-surface2 rounded">
                    <span className="font-mono text-accent">{w.term}</span>
                    <span className="text-[var(--muted)]">{w.definition}</span>
                  </div>
                ))}
                {preview.length > 5 && <p className="text-xs text-[var(--muted)] text-center">... 외 {preview.length - 5}개</p>}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={uploadWordset} disabled={uploading || !form.title || preview.length === 0}>
              {uploading ? '업로드 중...' : '업로드'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowUpload(false); setPreview([]) }}>취소</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wordsets.map(ws => (
          <div key={ws.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-sm">{ws.title}</h3>
              <div className="flex gap-1">
                <button className="btn btn-secondary btn-sm p-1.5" onClick={() => openWordset(ws)}><Eye size={14} /></button>
                <button className="btn btn-danger btn-sm p-1.5" onClick={() => deleteWordset(ws.id)}><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <BookOpen size={13} />
              <span>{ws.words?.[0]?.count ?? 0}개 단어</span>
            </div>
          </div>
        ))}
        {wordsets.length === 0 && <div className="col-span-3 text-center py-12 text-[var(--muted)]">아직 단어 세트가 없습니다.</div>}
      </div>
    </div>
  )
}
