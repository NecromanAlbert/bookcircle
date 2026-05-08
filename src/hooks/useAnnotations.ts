import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Annotation } from '../types/database'

export function useAnnotations(bookId: string | undefined) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!bookId) return
    const { data } = await supabase
      .from('annotations')
      .select('*, profiles(display_name)')
      .eq('book_id', bookId)
      .order('created_at', { ascending: true })

    setAnnotations(data ?? [])
    setLoading(false)
  }, [bookId])

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    if (!bookId) return

    const channel = supabase
      .channel(`annotations:${bookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'annotations',
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAnnotations((prev) => [...prev, payload.new as Annotation])
          } else if (payload.eventType === 'UPDATE') {
            setAnnotations((prev) =>
              prev.map((a) => (a.id === (payload.new as Annotation).id ? (payload.new as Annotation) : a)),
            )
          } else if (payload.eventType === 'DELETE') {
            setAnnotations((prev) =>
              prev.filter((a) => a.id !== (payload.old as { id: string }).id),
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookId])

  return { annotations, loading, refetch: fetch }
}
