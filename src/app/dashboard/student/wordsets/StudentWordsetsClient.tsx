'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, BookOpen, Star } from 'lucide-react'
import Papa from 'papaparse'
import StudyView from '@/components/StudyView'

interface WordSet { id: string; title: string; description: string | null; words: any[] }

export default function StudentWordsetsClient({
  myWordsets, adminWordsets, userId
}: { myWordsets: WordSet[]; adminWordsets: WordSet[]; userId: string }) {
  const [mysets, setMysets] = useState(myWordsets)
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [preview, setPreview] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [activeStudy, setActiveStudy] = useState<{ ws: WordSet } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[]
        const parsed = rows.map(r => ({
          term: r['단어'] || r['term'] || r['word'] || '',
          definition: r['뜻'] || r['definition'] || r['meaning'] || '',
          example: r['예문'] || r['example'] || '',
        })).filter(r => r.term && r.definition)
        setPreview(parsed)
      }
    })
  }

  const upload = async () => {
    if (!form.title || preview.length === 0) return
    setUploading(true)
    const { data: ws } = await supabase.from('word_sets').insert({
      title: form.title, description: form.description || null,
      created_by: userId, class_id: null, is_public: false,
    }).select().single()
    if (ws) {
      await supabase.from('words').insert(preview.map((w, i) => ({
        word_set_id: ws.id, term: w.term, definition: w.definition,
        example: w.example || null, order_index: i,
      })))
      setMysets(s => [{ ...ws, words: [{ count: preview.length }] }, ...s])
    }
    setShowUpload(false); setPreview([]); setForm({ title: '', description: '' }); setUploading(false)
  }

  if (activeStudy) return (
    <StudyView
      wordSetId={activeStudy.ws.id}
      assignmentId={null}
      title={activeStudy.ws.title}
      mode="flashcard"
      minScore={null}
      userId={userId}
      onBack={() => setActiveStudy(null)}
    />
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">단어장</h1>
          <p className="text-sm text-[var(--muted)]">개인 단어장과 공용 단어 세트</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}><Upload size={16} /> 업로드</button>
      </div>

      {showUpload && (
        <div className="card mb-6">
          <h2 className="font-bold mb-4">단어장 업로드</h2>
          <div className="space-y-3 mb-4">
            <input className="input" placeholder="단어장 이름" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-center cursor-pointer hover:border-accent transition-colors"
              onClick={() => fileRef.current?.click()}>
              <Upload size={20} className="mx-auto mb-2 text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">CSV 파일 선택 (단어,뜻,예문)</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files && handleFile(e.target.files[0])} />
            </div>
          </div>
          {preview.length > 0 && <p className="text-sm text-[var(--accent3)] mb-3">✅ {preview.length}개 단어 인식됨</p>}
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={upload} disabled={uploading || !form.title || preview.length === 0}>
              {uploading ? '업로드 중...' : '저장'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowUpload(false)}>취소</button>
          </div>
        </div>
      )}

      {adminWordsets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
            <Star size={14} /> 공용 단어 세트
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminWordsets.map(ws => (
              <div key={ws.id} className="card cursor-pointer hover:border-accent transition-colors" onClick={() => setActiveStudy({ ws })}>
                <h3 className="font-bold text-sm mb-2">{ws.title}</h3>
                <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                  <BookOpen size={13} /> {ws.words?.[0]?.count ?? 0}개 단어
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-3">내 단어장</h2>
        {mysets.length === 0 ? (
          <div className="text-center py-10 text-[var(--muted)]">아직 업로드한 단어장이 없습니다.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mysets.map(ws => (
              <div key={ws.id} className="card cursor-pointer hover:border-accent transition-colors" onClick={() => setActiveStudy({ ws })}>
                <h3 className="font-bold text-sm mb-2">{ws.title}</h3>
                <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                  <BookOpen size={13} /> {ws.words?.[0]?.count ?? 0}개 단어
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
