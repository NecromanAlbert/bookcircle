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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-2">BookCircle</h1>
        <p className="text-center text-[var(--text-secondary)] mb-8">
          和朋友一起读书
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <input
              type="text"
              placeholder="昵称"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
            />
          )}
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium cursor-pointer border-none disabled:opacity-50"
          >
            {submitting ? '请稍候...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
          {isRegister ? '已有账号？' : '没有账号？'}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-[var(--accent)] bg-transparent border-none cursor-pointer ml-1"
          >
            {isRegister ? '去登录' : '注册'}
          </button>
        </p>
      </div>
    </div>
  )
}
