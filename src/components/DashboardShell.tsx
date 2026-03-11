'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import {
  LayoutDashboard, BookOpen, Users, ClipboardList,
  LogOut, Menu, GraduationCap, Star
} from 'lucide-react'
import clsx from 'clsx'

interface Props { profile: Profile; children: React.ReactNode }

export default function DashboardShell({ profile, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = getNavItems(profile.role)

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <Link href={href}
      className={clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
        pathname === href || pathname.startsWith(href + '/')
          ? 'bg-accent text-[#0a0f0c]'
          : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-surface2'
      )}
      onClick={() => setMobileOpen(false)}>
      <Icon size={18} />
      {label}
    </Link>
  )

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="font-mono text-lg font-bold text-accent">WordClass</div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => <NavLink key={item.href} {...item} />)}
      </nav>
      <div className="p-3 border-t border-[var(--border)]">
        <div className="px-3 py-2 mb-1">
          <div className="text-sm font-medium text-[var(--text)]">{profile.name}</div>
          <div className="text-xs text-[var(--muted)]">{getRoleLabel(profile.role)}</div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--muted)] hover:text-[var(--accent2)] hover:bg-surface2 w-full transition-all">
          <LogOut size={18} />로그아웃
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-surface border-r border-[var(--border)]">
        <Sidebar />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-surface border-r border-[var(--border)]">
            <Sidebar />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-surface border-b border-[var(--border)]">
          <button onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
          <div className="font-mono font-bold text-accent">WordClass</div>
          <div className="text-xs text-[var(--muted)]">{profile.name}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function getNavItems(role: string) {
  const base = [{ href: '/dashboard', icon: LayoutDashboard, label: '홈' }]
  if (role === 'superadmin') return [
    ...base,
    { href: '/dashboard/admin/users', icon: Users, label: '사용자 관리' },
    { href: '/dashboard/admin/wordsets', icon: BookOpen, label: '단어 세트 관리' },
    { href: '/dashboard/admin/classes', icon: GraduationCap, label: '클래스 관리' },
    { href: '/dashboard/admin/results', icon: ClipboardList, label: '전체 기록' },
  ]
  if (role === 'teacher') return [
    ...base,
    { href: '/dashboard/teacher/classes', icon: GraduationCap, label: '내 클래스' },
    { href: '/dashboard/teacher/wordsets', icon: BookOpen, label: '단어 세트' },
    { href: '/dashboard/teacher/assignments', icon: ClipboardList, label: '과제 관리' },
    { href: '/dashboard/teacher/results', icon: Star, label: '학습 기록' },
  ]
  return [
    ...base,
    { href: '/dashboard/student/classes', icon: GraduationCap, label: '내 클래스' },
    { href: '/dashboard/student/assignments', icon: ClipboardList, label: '과제' },
    { href: '/dashboard/student/wordsets', icon: BookOpen, label: '단어장' },
    { href: '/dashboard/student/results', icon: Star, label: '내 기록' },
  ]
}

function getRoleLabel(role: string) {
  return role === 'superadmin' ? '슈퍼관리자' : role === 'teacher' ? '교사' : '학생'
}
