-- Homepage Management storage. This migration is intentionally idempotent and
-- preserves every existing homepage row.
create table if not exists public.homepage_sections (
  id text primary key,
  section_type text not null default 'custom',
  title_en text not null default '',
  title_ar text not null default '',
  content jsonb not null default '{}'::jsonb,
  source text not null default '',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  publication_state text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.homepage_sections
  add column if not exists section_type text not null default 'custom',
  add column if not exists content jsonb not null default '{}'::jsonb,
  add column if not exists publication_state text not null default 'published',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Keep legacy encoded `source` rows readable while making the JSON column
-- available to the new Admin implementation.
update public.homepage_sections
set
  section_type = coalesce(nullif(section_type, ''), 'custom'),
  content = coalesce(content, '{}'::jsonb),
  publication_state = coalesce(nullif(publication_state, ''), 'published'),
  updated_at = coalesce(updated_at, now());

alter table public.homepage_sections
  drop constraint if exists homepage_sections_publication_state_check;
alter table public.homepage_sections
  add constraint homepage_sections_publication_state_check
  check (publication_state in ('draft', 'published'));

create index if not exists homepage_sections_public_order_idx
  on public.homepage_sections (publication_state, is_visible, sort_order);

create or replace function public.set_homepage_section_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists homepage_sections_set_updated_at on public.homepage_sections;
create trigger homepage_sections_set_updated_at
before update on public.homepage_sections
for each row execute function public.set_homepage_section_updated_at();

alter table public.homepage_sections enable row level security;

drop policy if exists "Public can read homepage sections" on public.homepage_sections;
drop policy if exists "Public can read published homepage sections" on public.homepage_sections;
create policy "Public can read published homepage sections"
on public.homepage_sections
for select
to anon, authenticated
using (publication_state = 'published' and is_visible = true);

drop policy if exists "Admins can manage homepage sections" on public.homepage_sections;
create policy "Admins can manage homepage sections"
on public.homepage_sections
for all
to authenticated
using (true)
with check (true);

grant select on public.homepage_sections to anon;
grant select, insert, update, delete on public.homepage_sections to authenticated;

-- Ask PostgREST to refresh immediately after the migration.
notify pgrst, 'reload schema';
