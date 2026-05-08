import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { user, loading, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setSending(true)
    const { error } = await signInWithEmail(email.trim())
    setSending(false)

    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-2">BookCircle</h1>
        <p className="text-center text-[var(--text-secondary)] mb-8">
          和朋友一起读书
        </p>

        {sent ? (
          <div className="bg-[var(--bg-card)] rounded-lg p-6 text-center">
            <p className="text-lg mb-2">检查你的邮箱</p>
            <p className="text-[var(--text-secondary)] text-sm">
              登录链接已发送到 {email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium cursor-pointer border-none disabled:opacity-50"
            >
              {sending ? '发送中...' : '发送登录链接'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
