import { supabase } from './supabase'
import type { Book, Annotation, Friendship, Profile } from '../types/database'

export class ApiError extends Error {
  code?: string
  isAuth: boolean

  constructor(message: string, code?: string, isAuth = false) {
    super(message)
    this.code = code
    this.isAuth = isAuth
  }
}

function handleError(error: { message: string; code?: string }): never {
  if (error.code === 'PGRST301' || error.code === '401') {
    throw new ApiError('登录已过期，请重新登录', error.code, true)
  }
  if (error.code === '42P17') {
    throw new ApiError('数据库策略错误，请联系开发者', error.code)
  }
  throw new ApiError(error.message, error.code)
}

export async function getMyBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) handleError(error)
  return data ?? []
}

export async function getBook(id: string): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()

  if (error) handleError(error)
  if (!data) throw new ApiError('找不到这本书')
  return data
}

export async function getBookFileUrl(fileKey: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('books')
    .createSignedUrl(fileKey, 3600)

  if (error) handleError(error)
  if (!data?.signedUrl) throw new ApiError('无法获取文件链接')
  return data.signedUrl
}

export async function uploadBook(
  userId: string,
  file: File,
  fileType: 'epub' | 'pdf',
): Promise<Book> {
  const ext = fileType === 'epub' ? '.epub' : '.pdf'
  const fileKey = `${userId}/${crypto.randomUUID()}${ext}`

  const { error: uploadError } = await supabase.storage
    .from('books')
    .upload(fileKey, file)

  if (uploadError) handleError(uploadError)

  const title = file.name.replace(/\.(epub|pdf)$/i, '')

  const { data, error: dbError } = await supabase.from('books').insert({
    owner_id: userId,
    title,
    file_key: fileKey,
    file_type: fileType,
    file_size_bytes: file.size,
    metadata: {},
  }).select().single()

  if (dbError) {
    await supabase.storage.from('books').remove([fileKey])
    handleError(dbError)
  }

  return data!
}

export async function deleteBook(id: string, fileKey: string): Promise<void> {
  await supabase.storage.from('books').remove([fileKey])
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) handleError(error)
}

export async function toggleBookShared(id: string, isShared: boolean): Promise<void> {
  const { error } = await supabase.from('books').update({ is_shared: isShared }).eq('id', id)
  if (error) handleError(error)
}

export type BookWithOwner = Book & { profiles: Profile }

export async function getFriendBooks(userId: string): Promise<BookWithOwner[]> {
  const { data: friendships, error: fe } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')

  if (fe) handleError(fe)
  if (!friendships?.length) return []

  const friendIds = friendships.map((f) =>
    f.user_id === userId ? f.friend_id : f.user_id,
  )

  const { data, error } = await supabase
    .from('books')
    .select('*, profiles!books_owner_id_fkey(*)')
    .in('owner_id', friendIds)
    .eq('is_shared', true)
    .order('created_at', { ascending: false })

  if (error) handleError(error)
  return (data ?? []) as BookWithOwner[]
}

// --- Annotations ---

export interface CreateAnnotationInput {
  book_id: string
  user_id: string
  anchor_type: 'cfi' | 'pdf_rect'
  selected_text: string
  cfi_range?: string | null
  pdf_page?: number | null
  pdf_rects?: Array<{ x: number; y: number; w: number; h: number }> | null
  note?: string | null
  color?: string
  chapter_href?: string | null
  circle_id?: string | null
}

export async function createAnnotation(input: CreateAnnotationInput): Promise<Annotation> {
  const { data, error } = await supabase
    .from('annotations')
    .insert(input)
    .select()
    .single()

  if (error) handleError(error)
  return data!
}

export async function updateAnnotation(
  id: string,
  updates: { note?: string | null; color?: string },
): Promise<void> {
  const { error } = await supabase
    .from('annotations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) handleError(error)
}

export async function deleteAnnotation(id: string): Promise<void> {
  const { error } = await supabase.from('annotations').delete().eq('id', id)
  if (error) handleError(error)
}

// --- Friendships ---

export type FriendshipWithProfile = Friendship & {
  profile: Profile
}

export async function searchUsers(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('display_name', `%${query}%`)
    .limit(10)

  if (error) handleError(error)
  return data ?? []
}

export async function sendFriendRequest(friendId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new ApiError('未登录', undefined, true)

  const { error } = await supabase.from('friendships').insert({
    user_id: user.id,
    friend_id: friendId,
    status: 'pending',
  })
  if (error) {
    if (error.code === '23505') throw new ApiError('已发送过好友请求')
    handleError(error)
  }
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId)

  if (error) handleError(error)
}

export async function deleteFriendship(id: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', id)
  if (error) handleError(error)
}

export async function getMyFriends(userId: string): Promise<FriendshipWithProfile[]> {
  const { data: sent, error: e1 } = await supabase
    .from('friendships')
    .select('*, profile:profiles!friendships_friend_id_fkey(*)')
    .eq('user_id', userId)
    .eq('status', 'accepted')

  const { data: received, error: e2 } = await supabase
    .from('friendships')
    .select('*, profile:profiles!friendships_user_id_fkey(*)')
    .eq('friend_id', userId)
    .eq('status', 'accepted')

  if (e1) handleError(e1)
  if (e2) handleError(e2)

  return [...(sent ?? []), ...(received ?? [])] as FriendshipWithProfile[]
}

export async function getPendingRequests(userId: string): Promise<FriendshipWithProfile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, profile:profiles!friendships_user_id_fkey(*)')
    .eq('friend_id', userId)
    .eq('status', 'pending')

  if (error) handleError(error)
  return (data ?? []) as FriendshipWithProfile[]
}

export async function getSentRequests(userId: string): Promise<FriendshipWithProfile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, profile:profiles!friendships_friend_id_fkey(*)')
    .eq('user_id', userId)
    .eq('status', 'pending')

  if (error) handleError(error)
  return (data ?? []) as FriendshipWithProfile[]
}
