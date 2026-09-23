'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, BarChart3, Settings, LogOut, BookOpen } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Parties', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const NO_SIDEBAR_PATHS = ['/login']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const showSidebar = !NO_SIDEBAR_PATHS.includes(pathname)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">SG ENTERPRISES</p>
              <p className="text-slate-500 text-xs">ACCOUNTS SOFTWARE</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'nav-item-active' : 'nav-item'}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 py-4 border-t border-slate-800">
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="nav-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-900/30"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
