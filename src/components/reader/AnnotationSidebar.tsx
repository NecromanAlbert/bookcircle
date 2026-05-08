import { useState, useMemo } from 'react'
import { deleteAnnotation, updateAnnotation } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import type { Annotation } from '../../types/database'

interface Props {
  annotations: Annotation[]
  onClose: () => void
}

export function AnnotationSidebar({ annotations, onClose }: Props) {
  const { user } = useAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNote, setEditNote] = useState('')
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set())

  const authors = useMemo(() => {
    const map = new Map<string, string>()
    for (const ann of annotations) {
      if (!map.has(ann.user_id)) {
        map.set(
          ann.user_id,
          ann.user_id === user?.id
            ? '我'
            : ann.profiles?.display_name ?? '好友',
        )
      }
    }
    return map
  }, [annotations, user?.id])

  const hasFriendAnnotations = annotations.some((a) => a.user_id !== user?.id)

  const filtered = annotations.filter((a) => !hiddenUsers.has(a.user_id))

  const toggleUser = (userId: string) => {
    setHiddenUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnotation(id)
      toast.success('已删除')
    } catch {
      toast.error('删除失败')
    }
  }

  const handleEditSave = async (id: string) => {
    try {
      await updateAnnotation(id, { note: editNote || null })
      toast.success('已更新')
      setEditingId(null)
    } catch {
      toast.error('更新失败')
    }
  }

  return (
    <div className="w-full sm:w-80 border-l border-white/10 bg-[var(--bg-secondary)] flex flex-col shrink-0 h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold">标注 ({annotations.length})</h3>
        <button
          onClick={onClose}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer text-lg"
        >
          ×
        </button>
      </div>

      {hasFriendAnnotations && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-white/10">
          {Array.from(authors.entries()).map(([userId, name]) => (
            <button
              key={userId}
              onClick={() => toggleUser(userId)}
              className={`px-2 py-0.5 text-xs rounded-full cursor-pointer border transition-colors ${
                hiddenUsers.has(userId)
                  ? 'border-white/10 text-[var(--text-secondary)] bg-transparent'
                  : 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] text-sm py-8">
            {annotations.length === 0
              ? '还没有标注，选中文字开始划线'
              : '所有标注已隐藏'}
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((ann) => {
              const isMine = ann.user_id === user?.id
              return (
                <div key={ann.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: ann.color }}
                    />
                    <div className="flex-1 min-w-0">
                      {!isMine && (
                        <p className="text-xs text-[var(--accent)] mb-0.5">
                          {ann.profiles?.display_name ?? '好友'}
                        </p>
                      )}
                      <p className="text-sm text-[var(--text-primary)] line-clamp-3">
                        "{ann.selected_text}"
                      </p>
                      {editingId === ann.id ? (
                        <div className="mt-2">
                          <textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1 rounded bg-[var(--bg-card)] border border-white/10 text-xs text-[var(--text-primary)] outline-none resize-none"
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleEditSave(ann.id)}
                              className="text-xs text-[var(--accent)] bg-transparent border-none cursor-pointer"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs text-[var(--text-secondary)] bg-transparent border-none cursor-pointer"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {ann.note && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                              {ann.note}
                            </p>
                          )}
                          {isMine && (
                            <div className="flex gap-3 mt-1">
                              <button
                                onClick={() => {
                                  setEditingId(ann.id)
                                  setEditNote(ann.note ?? '')
                                }}
                                className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] bg-transparent border-none cursor-pointer"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDelete(ann.id)}
                                className="text-xs text-[var(--text-secondary)] hover:text-red-400 bg-transparent border-none cursor-pointer"
                              >
                                删除
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
