import { useState, useCallback, useEffect } from 'react'
import { ReactReader } from 'react-reader'
import { useReaderStore } from '../../stores/readerStore'
import { createAnnotation, deleteAnnotation, ApiError } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { AnnotationPopover } from './AnnotationPopover'
import toast from 'react-hot-toast'
import type { Contents, Rendition } from 'epubjs'
import type { Annotation } from '../../types/database'

interface Props {
  url: ArrayBuffer
  bookId: string
  annotations: Annotation[]
}

export function EpubReader({ url, bookId, annotations }: Props) {
  const { currentLocation, setLocation, fontSize } = useReaderStore()
  const { user } = useAuth()
  const [rendition, setRendition] = useState<Rendition | null>(null)
  const [selection, setSelection] = useState<{
    cfiRange: string
    text: string
    position: { x: number; y: number }
  } | null>(null)

  const locationChanged = useCallback(
    (epubcfi: string) => {
      setLocation(epubcfi)
    },
    [setLocation],
  )

  useEffect(() => {
    if (!rendition) return
    rendition.annotations?.removeAll?.()

    for (const ann of annotations) {
      if (ann.anchor_type !== 'cfi' || !ann.cfi_range) continue
      try {
        rendition.annotations.highlight(
          ann.cfi_range,
          { id: ann.id },
          () => {},
          'hl',
          { fill: ann.color, 'fill-opacity': '0.3', 'mix-blend-mode': 'multiply' },
        )
      } catch {
        // cfi might not match current chapter
      }
    }
  }, [rendition, annotations, currentLocation])

  const handleRendition = useCallback(
    (r: Rendition) => {
      setRendition(r)
      r.themes.fontSize(`${fontSize}%`)
      r.themes.register('dark', {
        body: {
          background: '#0f0f1a !important',
          color: '#e2e2f0 !important',
        },
        'a, a:link, a:visited': {
          color: '#6c63ff !important',
        },
      })
      r.themes.select('dark')

      r.on('selected', (cfiRange: string, contents: Contents) => {
        const sel = contents.window.getSelection()
        if (!sel || sel.isCollapsed) return

        const text = sel.toString().trim()
        if (!text) return

        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        const iframe = document.querySelector('iframe')
        const iframeRect = iframe?.getBoundingClientRect()
        const offsetX = iframeRect?.left ?? 0
        const offsetY = iframeRect?.top ?? 0

        setSelection({
          cfiRange,
          text,
          position: {
            x: Math.min(rect.left + offsetX, window.innerWidth - 300),
            y: Math.min(rect.bottom + offsetY + 8, window.innerHeight - 200),
          },
        })
      })
    },
    [fontSize],
  )

  const handleSave = async (color: string, note: string) => {
    if (!selection || !user) return

    try {
      await createAnnotation({
        book_id: bookId,
        user_id: user.id,
        anchor_type: 'cfi',
        cfi_range: selection.cfiRange,
        selected_text: selection.text,
        color,
        note: note || null,
      })
      toast.success('已保存标注')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '保存失败')
    }

    setSelection(null)
    rendition?.annotations.highlight(
      selection.cfiRange,
      {},
      () => {},
      'hl',
      { fill: color, 'fill-opacity': '0.3', 'mix-blend-mode': 'multiply' },
    )
  }

  const handleCancel = () => {
    setSelection(null)
    if (rendition) {
      const sel = rendition.manager?.container?.ownerDocument?.getSelection()
      sel?.removeAllRanges()
    }
  }

  return (
    <div className="absolute inset-0" style={{ background: '#0f0f1a', height: '100%' }}>
      <ReactReader
        url={url}
        location={currentLocation ?? undefined}
        locationChanged={locationChanged}
        getRendition={handleRendition}
        epubOptions={{ allowScriptedContent: false, flow: 'paginated' }}
        readerStyles={defaultReaderStyles}
        loadingView={<div style={{ color: '#9898b0', textAlign: 'center', padding: '2rem' }}>加载中...</div>}
        errorView={<div style={{ color: '#ff6b6b', textAlign: 'center', padding: '2rem' }}>加载失败，请返回重试</div>}
      />
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

const defaultReaderStyles = {
  container: {
    overflow: 'hidden',
    position: 'relative' as const,
    height: '100%',
  },
  readerArea: {
    position: 'relative' as const,
    zIndex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: '#0f0f1a',
    transition: 'all .3s ease',
  },
  titleArea: {
    position: 'absolute' as const,
    top: 20,
    left: 50,
    right: 50,
    textAlign: 'center' as const,
    color: '#9898b0',
    fontSize: '12px',
  },
  reader: {
    position: 'absolute' as const,
    top: 50,
    left: 50,
    bottom: 20,
    right: 50,
  },
  tocArea: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
    width: 256,
    overflowY: 'auto' as const,
    background: '#1a1a2e',
    padding: '10px 0',
  },
  tocAreaButton: {
    userSelect: 'none' as const,
    appearance: 'none' as const,
    background: 'none',
    border: 'none',
    display: 'block',
    fontFamily: 'sans-serif',
    width: '100%',
    fontSize: '.9em',
    textAlign: 'left' as const,
    padding: '.9em 1em',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e2f0',
    boxSizing: 'border-box' as const,
    outline: 'none',
    cursor: 'pointer',
  },
  tocButtonExpanded: {
    background: '#232340',
  },
  tocButton: {
    background: 'none',
    border: 'none',
    width: 32,
    height: 32,
    position: 'absolute' as const,
    top: 10,
    left: 10,
    borderRadius: 2,
    outline: 'none',
    cursor: 'pointer',
    color: '#9898b0',
  },
  arrow: {
    outline: 'none',
    border: 'none',
    background: 'none',
    position: 'absolute' as const,
    top: '50%',
    marginTop: -32,
    fontSize: 64,
    padding: '0 10px',
    color: '#6c63ff',
    fontFamily: 'arial, sans-serif',
    cursor: 'pointer',
    userSelect: 'none' as const,
    appearance: 'none' as const,
    fontWeight: 'normal' as const,
  },
  arrowHover: {
    color: '#7b73ff',
  },
  prev: {
    left: 1,
  },
  next: {
    right: 1,
  },
}
