import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { createAnnotation, ApiError } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { AnnotationPopover } from './AnnotationPopover'
import toast from 'react-hot-toast'
import type { Annotation } from '../../types/database'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

interface Props {
  url: string
  bookId: string
  annotations: Annotation[]
}

export function PdfReader({ url, bookId, annotations }: Props) {
  const { user } = useAuth()
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.5)
  const [selection, setSelection] = useState<{
    text: string
    rects: Array<{ x: number; y: number; w: number; h: number }>
    position: { x: number; y: number }
  } | null>(null)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setTotalPages(numPages)
  }, [])

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return

    const text = sel.toString().trim()
    if (!text) return

    const range = sel.getRangeAt(0)
    const clientRects = range.getClientRects()
    if (clientRects.length === 0) return

    const pageEl = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement
    if (!pageEl) return
    const pageRect = pageEl.getBoundingClientRect()
    const vw = pageEl.width
    const vh = pageEl.height

    const rects: Array<{ x: number; y: number; w: number; h: number }> = []
    for (const cr of clientRects) {
      rects.push({
        x: (cr.left - pageRect.left) / vw,
        y: (cr.top - pageRect.top) / vh,
        w: cr.width / vw,
        h: cr.height / vh,
      })
    }

    const lastRect = clientRects[clientRects.length - 1]
    setSelection({
      text,
      rects,
      position: {
        x: Math.min(lastRect.left, window.innerWidth - 300),
        y: Math.min(lastRect.bottom + 8, window.innerHeight - 200),
      },
    })
  }, [])

  const handleSave = async (color: string, note: string) => {
    if (!selection || !user) return

    try {
      await createAnnotation({
        book_id: bookId,
        user_id: user.id,
        anchor_type: 'pdf_rect',
        pdf_page: currentPage,
        pdf_rects: selection.rects,
        selected_text: selection.text,
        color,
        note: note || null,
      })
      toast.success('已保存标注')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '保存失败')
    }

    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const handleCancel = () => {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const pageAnnotations = annotations.filter(
    (a) => a.anchor_type === 'pdf_rect' && a.pdf_page === currentPage && a.pdf_rects,
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-center gap-4 py-2 border-b border-white/10 shrink-0">
        <button
          onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); setSelection(null) }}
          disabled={currentPage <= 1}
          className="px-3 py-1 rounded bg-[var(--bg-card)] text-[var(--text-primary)] border-none cursor-pointer disabled:opacity-30"
        >
          ‹
        </button>
        <span className="text-sm text-[var(--text-secondary)]">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); setSelection(null) }}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 rounded bg-[var(--bg-card)] text-[var(--text-primary)] border-none cursor-pointer disabled:opacity-30"
        >
          ›
        </button>
        <select
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="bg-[var(--bg-card)] text-[var(--text-primary)] border-none rounded px-2 py-1 text-sm"
        >
          <option value={1}>100%</option>
          <option value={1.5}>150%</option>
          <option value={2}>200%</option>
        </select>
      </div>
      <div className="flex-1 overflow-auto flex justify-center p-4" onMouseUp={handleMouseUp}>
        <Document file={url} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="text-[var(--text-secondary)]">加载中...</div>}>
          <div className="relative">
            <Page pageNumber={currentPage} scale={scale} />
            {pageAnnotations.length > 0 && (
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {pageAnnotations.map((ann) =>
                  ann.pdf_rects!.map((rect, i) => (
                    <div
                      key={`${ann.id}-${i}`}
                      className="absolute rounded-sm"
                      style={{
                        left: `${rect.x * 100}%`,
                        top: `${rect.y * 100}%`,
                        width: `${rect.w * 100}%`,
                        height: `${rect.h * 100}%`,
                        backgroundColor: ann.color,
                        opacity: 0.3,
                        mixBlendMode: 'multiply',
                      }}
                    />
                  )),
                )}
              </div>
            )}
          </div>
        </Document>
      </div>
      {selection && (
        <AnnotationPopover
          selectedText={selection.text}
          position={selection.position}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
