import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriendship,
  getMyFriends,
  getPendingRequests,
  getSentRequests,
  ApiError,
} from '../lib/api'
import type { FriendshipWithProfile } from '../lib/api'
import type { Profile } from '../types/database'
import { Spinner } from '../components/ui/Spinner'

type Tab = 'friends' | 'pending' | 'add'

export function FriendsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('friends')
  const [friends, setFriends] = useState<FriendshipWithProfile[]>([])
  const [pending, setPending] = useState<FriendshipWithProfile[]>([])
  const [sent, setSent] = useState<FriendshipWithProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    if (!user) return
    try {
      const [f, p, s] = await Promise.all([
        getMyFriends(user.id),
        getPendingRequests(user.id),
        getSentRequests(user.id),
      ])
      setFriends(f)
      setPending(p)
      setSent(s)
    } catch (err) {
      if (err instanceof ApiError && err.isAuth) {
        navigate('/login')
        return
      }
      toast.error(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [user])

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return
    setSearching(true)
    try {
      const results = await searchUsers(searchQuery.trim())
      setSearchResults(results.filter((p) => p.id !== user.id))
    } catch {
      toast.error('搜索失败')
    } finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async (friendId: string) => {
    try {
      await sendFriendRequest(friendId)
      toast.success('已发送好友请求')
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发送失败')
    }
  }

  const handleAccept = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId)
      toast.success('已接受')
      await reload()
    } catch {
      toast.error('操作失败')
    }
  }

  const handleDelete = async (id: string, label: string) => {
    try {
      await deleteFriendship(id)
      toast.success(label)
      await reload()
    } catch {
      toast.error('操作失败')
    }
  }

  const allFriendIds = new Set([
    ...friends.map((f) => f.profile.id),
    ...sent.map((s) => s.profile.id),
    ...pending.map((p) => p.profile.id),
  ])

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'friends', label: '好友' },
    { key: 'pending', label: '待处理', badge: pending.length || undefined },
    { key: 'add', label: '加好友' },
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b border-white/10">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 px-1 text-sm border-b-2 bg-transparent cursor-pointer transition-colors ${
              tab === t.key
                ? 'border-[var(--accent)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
            {t.badge ? (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-white text-xs">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-secondary)]">
              <p className="text-lg mb-2">还没有好友</p>
              <p className="text-sm">
                点击「加好友」搜索并添加好友
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between bg-[var(--bg-card)] rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium">
                      {f.profile.display_name[0]?.toUpperCase()}
                    </div>
                    <span className="text-[var(--text-primary)]">
                      {f.profile.display_name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(f.id, '已删除好友')}
                    className="text-xs text-[var(--text-secondary)] hover:text-red-400 bg-transparent border-none cursor-pointer"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'pending' && (
        <div>
          {pending.length === 0 && sent.length === 0 ? (
            <p className="text-center py-16 text-[var(--text-secondary)]">
              没有待处理的请求
            </p>
          ) : (
            <div className="space-y-4">
              {pending.length > 0 && (
                <div>
                  <h3 className="text-sm text-[var(--text-secondary)] mb-2">
                    收到的请求
                  </h3>
                  <div className="space-y-2">
                    {pending.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between bg-[var(--bg-card)] rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium">
                            {p.profile.display_name[0]?.toUpperCase()}
                          </div>
                          <span className="text-[var(--text-primary)]">
                            {p.profile.display_name}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(p.id)}
                            className="px-3 py-1 text-sm text-white bg-[var(--accent)] rounded cursor-pointer border-none hover:bg-[var(--accent-hover)]"
                          >
                            接受
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, '已拒绝')}
                            className="px-3 py-1 text-sm text-[var(--text-secondary)] bg-transparent border border-white/10 rounded cursor-pointer hover:text-[var(--text-primary)]"
                          >
                            拒绝
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {sent.length > 0 && (
                <div>
                  <h3 className="text-sm text-[var(--text-secondary)] mb-2">
                    已发送的请求
                  </h3>
                  <div className="space-y-2">
                    {sent.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between bg-[var(--bg-card)] rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] font-medium">
                            {s.profile.display_name[0]?.toUpperCase()}
                          </div>
                          <span className="text-[var(--text-primary)]">
                            {s.profile.display_name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(s.id, '已撤回')}
                          className="text-xs text-[var(--text-secondary)] hover:text-red-400 bg-transparent border-none cursor-pointer"
                        >
                          撤回
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'add' && (
        <div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索用户名..."
              className="flex-1 px-3 py-2 rounded bg-[var(--bg-card)] border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 text-sm text-white bg-[var(--accent)] rounded cursor-pointer border-none hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {searching ? '...' : '搜索'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-[var(--bg-card)] rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium">
                      {p.display_name[0]?.toUpperCase()}
                    </div>
                    <span className="text-[var(--text-primary)]">
                      {p.display_name}
                    </span>
                  </div>
                  {allFriendIds.has(p.id) ? (
                    <span className="text-xs text-[var(--text-secondary)]">
                      已添加
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(p.id)}
                      className="px-3 py-1 text-sm text-white bg-[var(--accent)] rounded cursor-pointer border-none hover:bg-[var(--accent-hover)]"
                    >
                      加好友
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
