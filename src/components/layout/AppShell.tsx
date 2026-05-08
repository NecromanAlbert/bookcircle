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
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold text-[var(--accent)] no-underline">
            BookCircle
          </Link>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm no-underline transition-colors ${
                  location.pathname === item.match
                    ? 'text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)]">
            {user?.email}
          </span>
          <button
            onClick={signOut}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none"
          >
            退出
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
