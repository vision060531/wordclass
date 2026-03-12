import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { title, description, preview } = await request.json()
  const { data: ws, error } = await admin
    .from('word_sets')
    .insert({ title, description: description || null, created_by: user.id, class_id: null, is_public: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (preview && preview.length > 0) {
    await admin.from('words').insert(
      preview.map((w: any, i: number) => ({
        word_set_id: ws.id, term: w.term, definition: w.definition,
        example: w.example || null, order_index: i,
      }))
    )
  }

  return NextResponse.json({ wordset: ws })
}
