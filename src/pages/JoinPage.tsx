import { useParams } from 'react-router-dom'

export function JoinPage() {
  const { code } = useParams<{ code: string }>()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-secondary)]">
      <div className="bg-[var(--bg-card)] rounded-2xl p-8 max-w-sm w-full text-center shadow-[var(--shadow-lg)] border border-[var(--border)]">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">加入阅读圈</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          邀请码：{code}
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          敬请期待
        </p>
      </div>
    </div>
  )
}
