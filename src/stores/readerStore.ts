import { create } from 'zustand'

interface ReaderState {
  currentLocation: string | null
  fontSize: number
  theme: 'dark' | 'light'
  showToc: boolean

  setLocation: (location: string | null) => void
  setFontSize: (size: number) => void
  setTheme: (theme: 'dark' | 'light') => void
  toggleToc: () => void
}

export const useReaderStore = create<ReaderState>((set) => ({
  currentLocation: null,
  fontSize: 100,
  theme: 'dark',
  showToc: false,

  setLocation: (location) => set({ currentLocation: location }),
  setFontSize: (fontSize) => set({ fontSize }),
  setTheme: (theme) => set({ theme }),
  toggleToc: () => set((s) => ({ showToc: !s.showToc })),
}))
