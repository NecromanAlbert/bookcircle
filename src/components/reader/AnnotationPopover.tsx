import { useState } from 'react'
import { HIGHLIGHT_COLORS } from '../../lib/constants'

interface Props {
  selectedText: string
  position: { x: number; y: number }
  onSave: (color: string, note: string) => void
  onCancel: () => void
}

export function AnnotationPopover({ selectedText, position, onSave, onCancel }: Props) {
  const [color, setColor] = useState<string>(HIGHLIGHT_COLORS[0])
  const [note, setNote] = useState('')

  return (
    <div
      className="fixed z-50 bg-[var(--bg-card)] rounded-lg shadow-xl border border-white/10 p-3 w-72"
      style={{ left: position.x, top: position.y }}
    >
      <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">
        "{selectedText}"
      </p>

      <div className="flex gap-2 mb-3">
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full border-2 cursor-pointer"
            style={{
              backgroundColor: c,
              borderColor: color === c ? '#fff' : 'transparent',
            }}
          />
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="写点想法...（可选）"
        rows={2}
        className="w-full px-2 py-1.5 rounded bg-[var(--bg-secondary)] border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none resize-none"
      />

      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm text-[var(--text-secondary)] bg-transparent border-none cursor-pointer hover:text-[var(--text-primary)]"
        >
          取消
        </button>
        <button
          onClick={() => onSave(color, note)}
          className="px-3 py-1 text-sm text-white bg-[var(--accent)] rounded cursor-pointer border-none hover:bg-[var(--accent-hover)]"
        >
          保存
        </button>
      </div>
    </div>
  )
}
