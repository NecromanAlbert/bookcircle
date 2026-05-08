-- Phase 2-3 Migration

-- 1. annotations.circle_id nullable (personal annotations)
alter table public.annotations alter column circle_id drop not null;

-- 2. books.is_shared flag
alter table public.books add column if not exists is_shared boolean default false;

-- 3. friendships table
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

create index if not exists idx_friendships_user on public.friendships(user_id);
create index if not exists idx_friendships_friend on public.friendships(friend_id);
create index if not exists idx_books_shared on public.books(is_shared) where is_shared = true;

alter table public.friendships enable row level security;

-- friendships RLS: see your own friendships
create policy "friendships_select" on public.friendships
  for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "friendships_insert" on public.friendships
  for insert with check (auth.uid() = user_id);
create policy "friendships_update" on public.friendships
  for update using (auth.uid() = friend_id);
create policy "friendships_delete" on public.friendships
  for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- 4. Update annotations RLS: allow personal annotations (circle_id is null)
drop policy if exists "annotations_read" on public.annotations;
drop policy if exists "annotations_insert" on public.annotations;

create policy "annotations_read" on public.annotations for select using (
  auth.uid() = user_id
  or circle_id in (select circle_id from public.circle_members where user_id = auth.uid())
  or (
    circle_id is null
    and book_id in (select id from public.books where is_shared = true and owner_id in (
      select friend_id from public.friendships where user_id = auth.uid() and status = 'accepted'
      union
      select user_id from public.friendships where friend_id = auth.uid() and status = 'accepted'
    ))
  )
);

create policy "annotations_insert" on public.annotations
  for insert with check (auth.uid() = user_id);

-- 5. books: friends can read shared books
create policy "books_friend_read" on public.books for select using (
  is_shared = true and owner_id in (
    select friend_id from public.friendships where user_id = auth.uid() and status = 'accepted'
    union
    select user_id from public.friendships where friend_id = auth.uid() and status = 'accepted'
  )
);

-- 6. Enable realtime for friendships
alter publication supabase_realtime add table public.friendships;
