import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getMyBooks, getFriendBooks, toggleBookShared, ApiError } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { BookUpload } from '../components/book/BookUpload'
import { Spinner } from '../components/ui/Spinner'
import type { Book } from '../types/database'
import type { BookWithOwner } from '../lib/api'

type Tab = 'mine' | 'friends'

export function HomePage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('mine')
  const [books, setBooks] = useState<Book[]>([])
  const [friendBooks, setFriendBooks] = useState<BookWithOwner[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchBooks = async () => {
    if (!user) return
    try {
      const [mine, friends] = await Promise.all([
        getMyBooks(),
        getFriendBooks(user.id),
      ])
      setBooks(mine)
      setFriendBooks(friends)
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
    fetchBooks()
  }, [user])

  const handleToggleShared = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation()
    const newVal = !book.is_shared
    try {
      await toggleBookShared(book.id, newVal)
      setBooks((prev) =>
        prev.map((b) =>
          b.id === book.id ? { ...b, is_shared: newVal } : b,
        ),
      )
      toast.success(newVal ? '已公开给好友' : '已设为私密')
    } catch {
      toast.error('操作失败')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-[var(--bg-secondary)] p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('mine')}
          className={`px-4 py-2 text-sm rounded-lg border-none cursor-pointer transition-all ${
            tab === 'mine'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-medium shadow-[var(--shadow)]'
              : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          我的书架
        </button>
        <button
          onClick={() => setTab('friends')}
          className={`px-4 py-2 text-sm rounded-lg border-none cursor-pointer transition-all ${
            tab === 'friends'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-medium shadow-[var(--shadow)]'
              : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          好友的书{friendBooks.length > 0 && ` (${friendBooks.length})`}
        </button>
      </div>

      {tab === 'mine' && (
        <>
          <BookUpload onUploaded={fetchBooks} />
          {books.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-secondary)]">
              <p className="text-4xl mb-3 opacity-40">📚</p>
              <p className="text-lg mb-1">书架空空如也</p>
              <p className="text-sm">上传你的第一本书开始阅读吧</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
              {books.map((book) => (
                <div key={book.id} className="relative group">
                  <button
                    onClick={() => navigate(`/read/${book.id}`)}
                    className="w-full bg-[var(--bg-card)] rounded-xl p-3 text-left hover:shadow-[var(--shadow-lg)] cursor-pointer border border-[var(--border)] transition-all hover:border-[var(--accent)]"
                  >
                    <div className="aspect-[3/4] bg-[var(--bg-secondary)] rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl opacity-30">
                          {book.file_type === 'epub' ? '📖' : '📄'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate text-[var(--text-primary)]">
                      {book.title}
                    </p>
                    {book.author && (
                      <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                        {book.author}
                      </p>
                    )}
                  </button>
                  <button
                    onClick={(e) => handleToggleShared(e, book)}
                    className={`absolute top-2 right-2 px-2 py-0.5 text-xs rounded-full cursor-pointer border-none transition-all opacity-0 group-hover:opacity-100 ${
                      book.is_shared
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] shadow-[var(--shadow)]'
                    }`}
                    title={book.is_shared ? '点击设为私密' : '点击公开给好友'}
                  >
                    {book.is_shared ? '公开' : '私密'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'friends' && (
        <div>
          {friendBooks.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-secondary)]">
              <p className="text-4xl mb-3 opacity-40">👥</p>
              <p className="text-lg mb-1">好友还没有公开的书</p>
              <p className="text-sm">添加好友后，他们公开的书会出现在这里</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
              {friendBooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => navigate(`/read/${book.id}`)}
                  className="bg-[var(--bg-card)] rounded-xl p-3 text-left hover:shadow-[var(--shadow-lg)] cursor-pointer border border-[var(--border)] transition-all hover:border-[var(--accent)]"
                >
                  <div className="aspect-[3/4] bg-[var(--bg-secondary)] rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl opacity-30">
                        {book.file_type === 'epub' ? '📖' : '📄'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate text-[var(--text-primary)]">
                    {book.title}
                  </p>
                  <p className="text-xs text-[var(--accent)] truncate mt-0.5">
                    {book.profiles?.display_name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
