import { useParams } from 'react-router-dom'

export function JoinPage() {
  const { code } = useParams<{ code: string }>()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] rounded-lg p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-semibold mb-4">加入阅读圈</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          邀请码：{code}
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          Phase 3 实现
        </p>
      </div>
    </div>
  )
}
