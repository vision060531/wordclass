# WordClass 배포 가이드

## 전체 순서
1. Supabase 세팅 (DB)
2. GitHub에 코드 올리기
3. Vercel로 배포

---

## 1단계: Supabase 세팅

1. **supabase.com** 접속 → 구글 계정으로 가입
2. **New Project** 클릭 → 이름: `wordclass`, 비밀번호 기억해두기, 리전: `Northeast Asia (Seoul)` 선택
3. 프로젝트 생성되면 (1~2분 소요) 왼쪽 메뉴 **SQL Editor** 클릭
4. `supabase_schema.sql` 파일 내용 전체 복사 → SQL Editor에 붙여넣기 → **Run** 클릭
5. 왼쪽 메뉴 **Settings → API** 클릭
   - `Project URL` 복사 → 메모장에 저장
   - `anon public` 키 복사 → 메모장에 저장

### 슈퍼관리자 계정 만들기
1. Supabase 왼쪽 메뉴 **Authentication → Users** → **Add user**
2. 이메일/비밀번호 입력 후 생성
3. SQL Editor에서 아래 실행 (이메일 수정):
```sql
update profiles set role = 'superadmin', approved = true
where email = '본인이메일@example.com';
```

---

## 2단계: GitHub에 코드 올리기

1. **github.com** 가입 (없으면)
2. **New repository** → 이름: `wordclass`, Private 선택 → Create
3. 아래 두 가지 방법 중 선택:

### 방법 A: GitHub Desktop 사용 (쉬움)
1. desktop.github.com 에서 GitHub Desktop 설치
2. File → Add Local Repository → wordclass 폴더 선택
3. Publish repository → GitHub에 올리기

### 방법 B: 터미널 (Mac/Linux)
```bash
cd wordclass 폴더경로
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/본인아이디/wordclass.git
git push -u origin main
```

---

## 3단계: Vercel 배포

1. **vercel.com** → GitHub 계정으로 로그인
2. **New Project** → wordclass 저장소 선택 → Import
3. **Environment Variables** 섹션에 아래 두 개 추가:
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key
4. **Deploy** 클릭 → 1~2분 후 완료
5. `https://wordclass-xxxx.vercel.app` 주소 생성됨 ✅

---

## 완료!

이 주소를 학생/교사들에게 공유하면 됩니다.
나중에 코드 수정하면 GitHub에 올리기만 하면 Vercel이 자동으로 재배포합니다.
