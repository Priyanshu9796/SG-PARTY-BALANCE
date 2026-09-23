'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, BarChart3, Settings, LogOut, BookOpen, Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Parties', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const NO_SIDEBAR_PATHS = ['/login']

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

// ── Nav links (shared between sidebar and drawer) ──────────
function NavLinks({
  pathname,
  onNavClick,
}: {
  pathname: string
  onNavClick?: () => void
}) {
  return (
    <nav className="flex-1 py-4 space-y-1" aria-label="Main navigation">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            className={active ? 'nav-item-active' : 'nav-item'}
          >
            <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

// ── Brand logo block ────────────────────────────────────────
function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
        <BookOpen className="w-[18px] h-[18px] text-white" aria-hidden />
      </div>
      <div>
        <p className="text-white font-bold text-sm leading-tight">SG ENTERPRISES</p>
        <p className="text-slate-500 text-xs">ACCOUNTING SOFTWARE</p>
      </div>
    </div>
  )
}

// ── Main AppShell ───────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const showShell = !NO_SIDEBAR_PATHS.includes(pathname)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Login page — no shell at all
  if (!showShell) return <>{children}</>

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ════════════════════════════════════════════════
          DESKTOP SIDEBAR  (lg and above only)
          Uses "hidden flex" — Tailwind "hidden" = display:none
          overrides correctly now that .sidebar has no display:flex
      ════════════════════════════════════════════════ */}
      <aside className="sidebar hidden lg:flex flex-col" aria-label="Sidebar">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800">
          <Brand />
        </div>

        <NavLinks pathname={pathname} />

        {/* Logout */}
        <div className="px-2 py-4 border-t border-slate-800">
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="nav-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-900/30"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" aria-hidden />
            Logout
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════
          MOBILE TOP HEADER BAR  (hidden on lg+)
      ════════════════════════════════════════════════ */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 h-14">
        <button
          id="mobile-menu-btn"
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors touch-manipulation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" aria-hidden />
          </div>
          <span className="text-white font-bold text-sm">Party Balance</span>
        </div>

        {/* Spacer to visually centre the brand */}
        <div className="w-9" aria-hidden />
      </header>

      {/* ════════════════════════════════════════════════
          MOBILE DRAWER OVERLAY (click to close)
      ════════════════════════════════════════════════ */}
      {drawerOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ════════════════════════════════════════════════
          MOBILE DRAWER PANEL
      ════════════════════════════════════════════════ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={[
          'fixed top-0 left-0 h-full w-64 bg-slate-900 z-50 flex flex-col lg:hidden',
          'transition-transform duration-300 ease-in-out will-change-transform',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Drawer header with X close button */}
        <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
          <Brand />
          <button
            id="close-drawer-btn"
            aria-label="Close navigation menu"
            onClick={() => setDrawerOpen(false)}
            className="ml-3 shrink-0 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-colors touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <NavLinks pathname={pathname} onNavClick={() => setDrawerOpen(false)} />

        {/* Logout inside drawer */}
        <div className="px-2 py-4 border-t border-slate-800">
          <button
            id="drawer-logout-btn"
            onClick={() => { setDrawerOpen(false); handleLogout() }}
            className="nav-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-900/30"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" aria-hidden />
            Logout
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE BOTTOM NAV BAR  (hidden on lg+)
      ════════════════════════════════════════════════ */}
      <nav
        aria-label="Bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex"
      >
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-semibold transition-colors duration-150 touch-manipulation',
                active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              <Icon className="w-5 h-5" aria-hidden />
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors touch-manipulation"
        >
          <LogOut className="w-5 h-5" aria-hidden />
          Logout
        </button>
      </nav>

      {/* ════════════════════════════════════════════════
          MAIN CONTENT AREA
          • Mobile: full-width, top padding for header bar, bottom padding for tab bar
          • Desktop: left margin for sidebar
      ════════════════════════════════════════════════ */}
      <main className="lg:ml-60 pt-14 lg:pt-0 pb-24 lg:pb-0 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

    </div>
  )
}
