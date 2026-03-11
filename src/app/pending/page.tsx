import Link from 'next/link'

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card text-center max-w-sm w-full">
        <div className="text-4xl mb-4">⏳</div>
        <h1 className="text-xl font-bold mb-2">승인 대기 중</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          교사 계정은 관리자 승인 후 사용 가능합니다.<br />
          잠시 후 다시 시도해주세요.
        </p>
        <Link href="/login" className="btn btn-secondary w-full">로그인 페이지로</Link>
      </div>
    </div>
  )
}
