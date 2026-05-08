import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function AppShell() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const navItems = [
    { to: '/', label: '书架', match: '/' },
    { to: '/friends', label: '好友', match: '/friends' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <header className="bg-[var(--bg-card)] border-b border-[var(--border)] shadow-[var(--shadow)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-[var(--text-primary)] hidden sm:inline">BookCircle</span>
            </Link>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-lg text-sm no-underline transition-colors ${
                    location.pathname === item.match
                      ? 'bg-[var(--accent)] text-white font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none"
            >
              退出
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
