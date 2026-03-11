import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WordClass',
  description: '영어 단어 학습 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
