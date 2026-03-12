'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, BookOpen, Trash2, Eye, Plus, Pencil, Check, X, Globe, Lock } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface Word { id: string; term: string; definition: string; example: string | null; order_index: number }
interface WordSet {
  id: string; title: string; description: string | null; is_public: boolean
  created_at: string; words: { count: number }[]
  creator: { name: string } | null
}

export default function AdminWordsetsClient({
  initialWordsets
}: { initialWordsets: WordSet[] }) {
  const [wordsets, setWordsets] = useState(initialWordsets)
  const [showCreate, setShowCreate] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', description: '' })
  const [viewWords, setViewWords] = useState<{ set: WordSet; words: Word[] } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ term: '', definition: '', example: '' })
  const [newWord, setNewWord] = useState({ term: '', definition: '', example: '' })
  const [showAddWord, setShowAddWord] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const parseRows = (rows: any[]) => {
    const parsed = rows.map(r => ({
      term: r['단어'] || r['term'] || r['word'] || '',
      definition: r['뜻'] || r['definition'] || r['meaning'] || '',
      example: r['예문'] || r['example'] || '',
    })).filter((r: any) => r.term && r.definition)
    setPreview(parsed)
  }

  const handleFile = (file: File) => {
    if (file.name.match(/\.(xlsx|xls)$/i)) {
      const reader = new FileReader()
      reader.onload = e => {
        const wb = XLSX.read(new Uint8Array(e.target?.result as ArrayBuffer), { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        parseRows(XLSX.utils.sheet_to_json(ws) as any[])
      }
      reader.readAsArrayBuffer(file)
    } else {
      Papa.parse(file, { header: true, skipEmptyLines: true, complete: r => parseRows(r.data as any[]) })
    }
  }

  const createWordset = async () => {
    if (!form.title) return
    setUploading(true)
    const res = await fetch('/api/admin/wordsets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title, description: form.description, preview }),
    })
    if (res.ok) {
      const { wordset: ws } = await res.json()
      setWordsets(s => [{ ...ws, words: [{ count: preview.length }], creator: null }, ...s])
    }
    setShowCreate(false); setPreview([]); setForm({ title: '', description: '' }); setUploading(false)
  }

  const togglePublic = async (id: string, current: boolean) => {
    await supabase.from('word_sets').update({ is_public: !current }).eq('id', id)
    setWordsets(s => s.map(ws => ws.id === id ? { ...ws, is_public: !current } : ws))
  }

  const deleteWordset = async (id: string) => {
    if (!confirm('단어 세트를 삭제하시겠습니까?')) return
    await supabase.from('word_sets').delete().eq('id', id)
    setWordsets(s => s.filter(x => x.id !== id))
    if (viewWords?.set.id === id) setViewWords(null)
  }

  const openWordset = async (ws: WordSet) => {
    const { data: words } = await supabase.from('words').select('*').eq('word_set_id', ws.id).order('order_index')
    setViewWords({ set: ws, words: words || [] })
    setShowAddWord(false); setEditingId(null)
  }

  const startEdit = (w: Word) => {
    setEditingId(w.id)
    setEditForm({ term: w.term, definition: w.definition, example: w.example || '' })
  }

  const saveEdit = async () => {
    if (!viewWords || !editingId) return
    await supabase.from('words').update({
      term: editForm.term, definition: editForm.definition, example: editForm.example || null,
    }).eq('id', editingId)
    setViewWords(v => v ? {
      ...v, words: v.words.map(w => w.id === editingId
        ? { ...w, term: editForm.term, definition: editForm.definition, example: editForm.example || null } : w)
    } : v)
    setEditingId(null)
  }

  const deleteWord = async (id: string) => {
    await supabase.from('words').delete().eq('id', id)
    setViewWords(v => v ? { ...v, words: v.words.filter(w => w.id !== id) } : v)
  }

  const addWord = async () => {
    if (!viewWords || !newWord.term || !newWord.definition) return
    const { data: w } = await supabase.from('words').insert({
      word_set_id: viewWords.set.id, term: newWord.term,
      definition: newWord.definition, example: newWord.example || null,
      order_index: viewWords.words.length,
    }).select().single()
    if (w) {
      setViewWords(v => v ? { ...v, words: [...v.words, w] } : v)
      setWordsets(s => s.map(ws => ws.id === viewWords.set.id
        ? { ...ws, words: [{ count: (ws.words?.[0]?.count ?? 0) + 1 }] } : ws))
    }
    setNewWord({ term: '', definition: '', example: '' })
    setShowAddWord(false)
  }

  if (viewWords) return (
    <div>
      <button className="btn btn-secondary btn-sm mb-6" onClick={() => setViewWords(null)}>← 목록으로</button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{viewWords.set.title}</h1>
            <span className={`badge ${viewWords.set.is_public ? 'badge-success' : 'badge-muted'}`}>
              {viewWords.set.is_public ? '공용' : '비공개'}
            </span>
          </div>
          <p className="text-sm text-[var(--muted)]">{viewWords.words.length}개 단어</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddWord(s => !s)}>
          <Plus size={14} /> 단어 추가
        </button>
      </div>

      {showAddWord && (
        <div className="card mb-4">
          <h3 className="text-sm font-bold mb-3">새 단어 추가</h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input className="input text-xs" placeholder="단어 (영어)" value={newWord.term}
              onChange={e => setNewWord(f => ({ ...f, term: e.target.value }))} />
            <input className="input text-xs" placeholder="뜻 (한국어)" value={newWord.definition}
              onChange={e => setNewWord(f => ({ ...f, definition: e.target.value }))} />
            <input className="input text-xs" placeholder="예문 (선택)" value={newWord.example}
              onChange={e => setNewWord(f => ({ ...f, example: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={addWord} disabled={!newWord.term || !newWord.definition}>추가</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddWord(false)}>취소</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {viewWords.words.map((w, i) => (
          editingId === w.id ? (
            <div key={w.id} className="flex items-center gap-2 p-2 bg-surface2 rounded-lg">
              <span className="text-[var(--muted)] w-6 text-xs shrink-0">{i + 1}</span>
              <input className="input text-xs min-w-0 flex-1" value={editForm.term}
                onChange={e => setEditForm(f => ({ ...f, term: e.target.value }))} />
              <input className="input text-xs min-w-0 flex-1" value={editForm.definition}
                onChange={e => setEditForm(f => ({ ...f, definition: e.target.value }))} />
              <input className="input text-xs min-w-0 flex-1" placeholder="예문" value={editForm.example}
                onChange={e => setEditForm(f => ({ ...f, example: e.target.value }))} />
              <button className="btn btn-success btn-sm p-1.5 shrink-0" onClick={saveEdit}><Check size={14} /></button>
              <button className="btn btn-secondary btn-sm p-1.5 shrink-0" onClick={() => setEditingId(null)}><X size={14} /></button>
            </div>
          ) : (
            <div key={w.id} className="flex items-center gap-3 p-3 bg-surface2 rounded-lg text-sm group">
              <span className="text-[var(--muted)] w-6 text-xs shrink-0">{i + 1}</span>
              <span className="font-mono text-accent min-w-[120px] shrink-0">{w.term}</span>
              <span className="text-[var(--text)] flex-1">{w.definition}</span>
              {w.example && <span className="text-[var(--muted)] text-xs italic hidden md:block flex-1">{w.example}</span>}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button className="btn btn-secondary btn-sm p-1.5" onClick={() => startEdit(w)}><Pencil size={12} /></button>
                <button className="btn btn-danger btn-sm p-1.5" onClick={() => deleteWord(w.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          )
        ))}
        {viewWords.words.length === 0 && (
          <div className="text-center py-12 text-[var(--muted)]">단어가 없습니다. 위 버튼으로 추가해보세요.</div>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">단어 세트 관리</h1>
          <p className="text-sm text-[var(--muted)]">공용 단어 세트를 생성하고 전체 세트를 관리하세요</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> 세트 만들기</button>
      </div>

      {showCreate && (
        <div className="card mb-6">
          <h2 className="font-bold mb-4">새 공용 단어 세트</h2>
          <div className="space-y-3 mb-4">
            <input className="input" placeholder="단어 세트 이름" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <input className="input" placeholder="설명 (선택)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div
              className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-center cursor-pointer hover:border-accent transition-colors"
              onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
              onDragOver={e => e.preventDefault()}>
              <Upload size={20} className="mx-auto mb-2 text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">CSV / Excel 파일 선택 (선택사항)</p>
              <p className="text-xs text-[var(--muted)] mt-1">.csv .xlsx .xls · 헤더: 단어,뜻,예문</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                onChange={e => e.target.files && handleFile(e.target.files[0])} />
            </div>
          </div>
          {preview.length > 0 && (
            <p className="text-sm text-[var(--accent3)] mb-4">✅ {preview.length}개 단어 인식됨</p>
          )}
          <div className="flex gap-2 items-center">
            <button className="btn btn-primary" onClick={createWordset} disabled={uploading || !form.title}>
              {uploading ? '생성 중...' : '공용 세트 생성'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setPreview([]) }}>취소</button>
            <span className="text-xs text-[var(--muted)]">파일 없이 만든 뒤 단어를 직접 추가할 수도 있습니다</span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wordsets.map(ws => (
          <div key={ws.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm mb-1">{ws.title}</h3>
                <span className={`badge text-xs ${ws.is_public ? 'badge-success' : 'badge-muted'}`}>
                  {ws.is_public ? '🌐 공용' : '🔒 비공개'}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  className="btn btn-secondary btn-sm p-1.5"
                  title={ws.is_public ? '비공개로 전환' : '공용으로 전환'}
                  onClick={() => togglePublic(ws.id, ws.is_public)}>
                  {ws.is_public ? <Lock size={13} /> : <Globe size={13} />}
                </button>
                <button className="btn btn-secondary btn-sm p-1.5" onClick={() => openWordset(ws)}><Eye size={14} /></button>
                <button className="btn btn-danger btn-sm p-1.5" onClick={() => deleteWordset(ws.id)}><Trash2 size={14} /></button>
              </div>
            </div>
            {ws.description && <p className="text-xs text-[var(--muted)] mb-2">{ws.description}</p>}
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1"><BookOpen size={13} /> {ws.words?.[0]?.count ?? 0}개 단어</span>
              {ws.creator && <span>{ws.creator.name}</span>}
            </div>
          </div>
        ))}
        {wordsets.length === 0 && (
          <div className="col-span-3 text-center py-12 text-[var(--muted)]">아직 단어 세트가 없습니다.</div>
        )}
      </div>
    </div>
  )
}
