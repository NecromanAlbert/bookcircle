import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getBook, getBookFileUrl, ApiError } from '../lib/api'
import { useAnnotations } from '../hooks/useAnnotations'
import { EpubReader } from '../components/reader/EpubReader'
import { PdfReader } from '../components/reader/PdfReader'
import { AnnotationSidebar } from '../components/reader/AnnotationSidebar'
import { FullPageSpinner } from '../components/ui/Spinner'
import type { Book } from '../types/database'

export function ReaderPage() {
  const { bookId } = useParams<{ bookId: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [epubData, setEpubData] = useState<ArrayBuffer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const { annotations } = useAnnotations(bookId)

  useEffect(() => {
    if (!bookId) return
    let cancelled = false

    const load = async () => {
      try {
        const bookData = await getBook(bookId)
        if (cancelled) return
        setBook(bookData)
        const url = await getBookFileUrl(bookData.file_key)
        if (cancelled) return
        setFileUrl(url)

        if (bookData.file_type === 'epub') {
          const res = await fetch(url)
          if (!res.ok) throw new Error('无法下载书籍文件')
          const buf = await res.arrayBuffer()
          if (cancelled) return
          setEpubData(buf)
        }
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.isAuth) {
          navigate('/login')
          return
        }
        setError(err instanceof Error ? err.message : '加载失败')
        toast.error(err instanceof Error ? err.message : '加载失败')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [bookId, navigate])


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[var(--bg-primary)]">
        <p className="text-[var(--text-secondary)]">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white cursor-pointer border-none hover:bg-[var(--accent-hover)] transition-colors"
        >
          返回书架
        </button>
      </div>
    )
  }

  if (!book || !fileUrl) return <FullPageSpinner />
  if (book.file_type === 'epub' && !epubData) return <FullPageSpinner />

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      <header className="flex items-center justify-between px-4 py-2 bg-[var(--bg-card)] border-b border-[var(--border)] shrink-0 shadow-[var(--shadow)]">
        <button
          onClick={() => navigate('/')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer text-sm"
        >
          ← 返回
        </button>
        <span className="text-sm font-medium truncate max-w-[50%] text-[var(--text-primary)]">
          {book.title}
        </span>
        <button
          onClick={() => setShowSidebar((s) => !s)}
          className={`text-sm bg-transparent border-none cursor-pointer transition-colors ${
            showSidebar
              ? 'text-[var(--accent)] font-medium'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          标注 ({annotations.length})
        </button>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-hidden relative ${showSidebar ? 'hidden sm:block' : ''}`}>
          {book.file_type === 'epub' ? (
            <EpubReader url={epubData!} bookId={book.id} annotations={annotations} />
          ) : (
            <PdfReader url={fileUrl} bookId={book.id} annotations={annotations} />
          )}
        </div>
        {showSidebar && (
          <AnnotationSidebar
            annotations={annotations}
            onClose={() => setShowSidebar(false)}
          />
        )}
      </div>
    </div>
  )
}
