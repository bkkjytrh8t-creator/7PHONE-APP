alter table public.brands add column if not exists homepage_url text;
alter table public.brands add column if not exists is_visible boolean not null default true;
