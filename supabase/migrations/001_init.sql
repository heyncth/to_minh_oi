-- 001_init — from docs/07-DATABASE.md (locked v1)
-- Run in Supabase SQL editor after enabling vector extension.

create extension if not exists vector;

-- Tables ----------------------------------------------------------

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Hành chính'
    check (category in ('Hành chính', 'Y tế', 'Môi trường', 'An ninh', 'Sự kiện')),
  is_urgent boolean not null default false,
  is_published boolean not null default false,
  summary_main text not null,
  summary_time_location text,
  summary_action_required text,
  original_text text,
  original_image_url text,
  audio_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists announcements_published_created_idx
  on announcements (is_published, created_at desc);

create index if not exists announcements_category_idx
  on announcements (category)
  where is_published = true;

create table if not exists admin_procedures (
  id uuid primary key default gen_random_uuid(),
  procedure_name text not null,
  content text not null,
  embedding vector(768),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_procedures_embedding_idx
  on admin_procedures
  using hnsw (embedding vector_cosine_ops)
  where is_active = true and embedding is not null;

-- RPC -------------------------------------------------------------

create or replace function match_procedures (
  query_embedding vector(768),
  match_threshold float default 0.35,
  match_count int default 4
)
returns table (
  id uuid,
  procedure_name text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    p.id,
    p.procedure_name,
    p.content,
    1 - (p.embedding <=> query_embedding) as similarity
  from admin_procedures p
  where p.is_active = true
    and p.embedding is not null
    and 1 - (p.embedding <=> query_embedding) > match_threshold
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

-- RLS -------------------------------------------------------------

alter table announcements enable row level security;
alter table admin_procedures enable row level security;

create policy "public_read_published_announcements"
  on announcements for select
  using (is_published = true);

create policy "admin_all_announcements"
  on announcements for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "public_read_procedures"
  on admin_procedures for select
  using (is_active = true);

create policy "admin_all_procedures"
  on admin_procedures for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- updated_at trigger ---------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists announcements_updated_at on announcements;
create trigger announcements_updated_at
  before update on announcements
  for each row execute function set_updated_at();
