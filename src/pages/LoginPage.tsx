import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    if (isRegister && !displayName.trim()) return

    setSubmitting(true)

    if (isRegister) {
      const { error } = await signUp(email.trim(), password, displayName.trim())
      setSubmitting(false)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('注册成功')
      }
    } else {
      const { error } = await signIn(email.trim(), password)
      setSubmitting(false)
      if (error) {
        toast.error(error.message)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent)] mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M8 7h6" />
              <path d="M8 11h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">BookCircle</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">和朋友一起读书</p>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-[var(--shadow-lg)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isRegister && (
              <input
                type="text"
                placeholder="昵称"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
              />
            )}
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
            />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 mt-1 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium cursor-pointer border-none disabled:opacity-50 transition-colors"
            >
              {submitting ? '请稍候...' : isRegister ? '注册' : '登录'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-5">
          {isRegister ? '已有账号？' : '没有账号？'}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-[var(--accent)] font-medium bg-transparent border-none cursor-pointer ml-1 hover:underline"
          >
            {isRegister ? '去登录' : '注册'}
          </button>
        </p>
      </div>
    </div>
  )
}
