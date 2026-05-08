export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      books: {
        Row: Book
        Insert: Omit<Book, 'id' | 'created_at'>
        Update: Partial<Omit<Book, 'id' | 'owner_id'>>
      }
      circles: {
        Row: Circle
        Insert: Omit<Circle, 'id' | 'created_at' | 'invite_code'>
        Update: Partial<Omit<Circle, 'id' | 'created_by'>>
      }
      circle_members: {
        Row: CircleMember
        Insert: Omit<CircleMember, 'joined_at'>
        Update: Partial<Pick<CircleMember, 'role'>>
      }
      friendships: {
        Row: Friendship
        Insert: Omit<Friendship, 'id' | 'created_at'>
        Update: Partial<Pick<Friendship, 'status'>>
      }
      annotations: {
        Row: Annotation
        Insert: Omit<Annotation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Annotation, 'id' | 'user_id' | 'circle_id' | 'book_id'>>
      }
      reading_progress: {
        Row: ReadingProgress
        Insert: ReadingProgress
        Update: Partial<Omit<ReadingProgress, 'user_id' | 'book_id' | 'circle_id'>>
      }
    }
  }
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export interface Book {
  id: string
  owner_id: string
  title: string
  author: string | null
  cover_url: string | null
  file_key: string
  file_type: 'epub' | 'pdf'
  file_size_bytes: number | null
  file_hash: string | null
  is_shared: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface Circle {
  id: string
  book_id: string
  name: string
  created_by: string
  invite_code: string
  max_members: number
  created_at: string
}

export interface CircleMember {
  circle_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted'
  created_at: string
}

export interface Annotation {
  id: string
  circle_id: string | null
  user_id: string
  book_id: string
  anchor_type: 'cfi' | 'pdf_rect'
  cfi_range: string | null
  pdf_page: number | null
  pdf_rects: Array<{ x: number; y: number; w: number; h: number }> | null
  selected_text: string
  note: string | null
  color: string
  chapter_href: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'display_name'>
}

export interface ReadingProgress {
  user_id: string
  book_id: string
  circle_id: string
  location: string
  percentage: number
  updated_at: string
}
