import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { uploadBook, ApiError } from '../../lib/api'
import { MAX_FILE_SIZE, ACCEPTED_FORMATS } from '../../lib/constants'
import { Spinner } from '../ui/Spinner'

interface Props {
  onUploaded: () => void
}

export function BookUpload({ onUploaded }: Props) {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const getFileType = (file: File): 'epub' | 'pdf' | null => {
    if (file.name.endsWith('.epub') || file.type === 'application/epub+zip') return 'epub'
    if (file.name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf'
    return null
  }

  const handleFile = async (file: File) => {
    if (!user) return

    const fileType = getFileType(file)
    if (!fileType) {
      toast.error('仅支持 EPUB 和 PDF 格式')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('文件大小不能超过 50MB')
      return
    }

    setUploading(true)
    try {
      const book = await uploadBook(user.id, file, fileType)
      toast.success(`《${book.title}》已上传`)
      onUploaded()
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('上传失败，请重试')
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        dragOver
          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
          : 'border-white/10 hover:border-white/20'
      }`}
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_FORMATS.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      {uploading ? (
        <div className="flex items-center justify-center gap-2">
          <Spinner className="h-5 w-5" />
          <span className="text-[var(--text-secondary)]">上传中...</span>
        </div>
      ) : (
        <p className="text-[var(--text-secondary)]">
          拖拽或点击上传 EPUB / PDF
        </p>
      )}
    </div>
  )
}
