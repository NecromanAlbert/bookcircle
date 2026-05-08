-- BookCircle Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Create all tables (order matters for FK)
-- ============================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  author text,
  cover_url text,
  file_key text not null,
  file_type text not null check (file_type in ('epub', 'pdf')),
  file_size_bytes bigint,
  file_hash text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  name text not null,
  created_by uuid not null references public.profiles(id),
  invite_code text unique not null default encode(gen_random_bytes(6), 'hex'),
  max_members int default 20,
  created_at timestamptz default now()
);

create table public.circle_members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  primary key (circle_id, user_id)
);

create table public.annotations (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  anchor_type text not null check (anchor_type in ('cfi', 'pdf_rect')),
  cfi_range text,
  pdf_page int,
  pdf_rects jsonb,
  selected_text text not null,
  note text,
  color text default '#FFE066',
  chapter_href text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.reading_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  circle_id uuid not null references public.circles(id) on delete cascade,
  location text not null,
  percentage real default 0,
  updated_at timestamptz default now(),
  primary key (user_id, book_id, circle_id)
);

-- ============================================
-- STEP 2: Auto-create profile on signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- STEP 3: Enable RLS on all tables
-- ============================================

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.annotations enable row level security;
alter table public.reading_progress enable row level security;

-- ============================================
-- STEP 4: RLS Policies (all tables exist now)
-- ============================================

-- profiles
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);

-- books
create policy "books_owner_all" on public.books for all using (auth.uid() = owner_id);
create policy "books_circle_read" on public.books for select using (
  id in (
    select c.book_id from public.circles c
    join public.circle_members cm on cm.circle_id = c.id
    where cm.user_id = auth.uid()
  )
);

-- circles
create policy "circles_member_read" on public.circles for select using (
  id in (select circle_id from public.circle_members where user_id = auth.uid())
  or created_by = auth.uid()
);
create policy "circles_owner_manage" on public.circles for all using (auth.uid() = created_by);

-- circle_members
create policy "members_read" on public.circle_members for select using (
  circle_id in (select circle_id from public.circle_members where user_id = auth.uid())
);
create policy "members_insert" on public.circle_members for insert with check (auth.uid() = user_id);
create policy "members_owner_delete" on public.circle_members for delete using (
  circle_id in (select id from public.circles where created_by = auth.uid())
  or auth.uid() = user_id
);

-- annotations
create policy "annotations_read" on public.annotations for select using (
  circle_id in (select circle_id from public.circle_members where user_id = auth.uid())
);
create policy "annotations_insert" on public.annotations for insert with check (auth.uid() = user_id);
create policy "annotations_update" on public.annotations for update using (auth.uid() = user_id);
create policy "annotations_delete" on public.annotations for delete using (auth.uid() = user_id);

-- reading_progress
create policy "progress_own" on public.reading_progress for all using (auth.uid() = user_id);
create policy "progress_circle_read" on public.reading_progress for select using (
  circle_id in (select circle_id from public.circle_members where user_id = auth.uid())
);

-- ============================================
-- STEP 5: Indexes
-- ============================================

create index idx_annotations_circle on public.annotations(circle_id);
create index idx_annotations_book_chapter on public.annotations(book_id, chapter_href);
create index idx_circle_members_user on public.circle_members(user_id);
create index idx_circles_invite on public.circles(invite_code);
create index idx_books_owner on public.books(owner_id);

-- ============================================
-- STEP 6: Enable realtime for annotations
-- ============================================

alter publication supabase_realtime add table public.annotations;
