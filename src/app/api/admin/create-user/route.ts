import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { name, identifier, role, password } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const email = `${identifier}@wordclass.local`

  // 이미 존재하는 이메일인지 확인
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    return NextResponse.json({ error: '이미 사용 중인 학번/교번입니다.' }, { status: 400 })
  }

  // Auth 유저 생성
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    // Auth에 이미 있으면 해당 유저로 profiles만 생성
    if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
      const { data: existingAuth } = await supabase.auth.admin.listUsers()
      const found = (existingAuth?.users ?? []).find((u: any) => u.email === email)
      if (found) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: found.id, email, name, role, approved: true })
          .select()
          .single()
        if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })
        return NextResponse.json({ profile })
      }
    }
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: authData.user.id, email, name, role, approved: true })
    .select()
    .single()

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  return NextResponse.json({ profile })
}
