import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 로그인한 유저의 profile을 service role로 가져오거나 없으면 생성
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 이미 있으면 그대로 반환
  const { data: existing } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (existing) return NextResponse.json({ profile: existing })

  // 없으면 auth 메타데이터로 생성
  const meta = user.user_metadata || {}
  const role = ['student', 'teacher'].includes(meta.role) ? meta.role : 'student'
  const name = meta.name || user.email?.split('@')[0] || '사용자'

  const { data: created, error } = await admin
    .from('profiles')
    .insert({ id: user.id, email: user.email, name, role, approved: role === 'student' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: created })
}
