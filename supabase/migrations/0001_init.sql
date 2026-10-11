-- Mom & Dad Websites: initial schema
-- Run this once in the Supabase SQL editor (or with `supabase db push`).
--
-- Model:
--   sides       one row per parent ('inbar', 'eli'): name, tagline, bio, hero image
--   admins      links a Supabase Auth user to the side they are allowed to edit
--   categories  per-side tags ("Wood burning", "Sculpting", "Tube radios", ...)
--   items       one artwork or one restored radio
--   item_photos extra photos for an item (process shots, before/after)
--
-- Everyone (anonymous visitors) can READ published content.
-- Only a logged-in admin can WRITE, and only rows for their own side.

create type public.side as enum ('inbar', 'eli');

-- ---------------------------------------------------------------- tables

create table public.sides (
  side          public.side primary key,
  display_name  text not null,
  tagline       text not null default '',
  bio           text not null default '',
  hero_image    text,                         -- storage path, e.g. 'inbar/hero.jpg'
  updated_at    timestamptz not null default now()
);

create table public.admins (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  side     public.side not null
);

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  side        public.side not null,
  name        text not null,
  sort_order  int  not null default 0,
  unique (side, name)
);

create table public.items (
  id            uuid primary key default gen_random_uuid(),
  side          public.side not null,
  category_id   uuid references public.categories (id) on delete set null,
  title         text not null,
  description   text not null default '',
  year          int,                -- Inbar: year made.  Eli: model year of the radio.
  materials     text,               -- Inbar: "Oil on canvas", "Pyrography on olive wood"
  manufacturer  text,               -- Eli:   "Philips", "Grundig", "Telefunken"
  model         text,               -- Eli:   "BX998A"
  process       text,               -- Inbar: technique / process.  Eli: restoration work done.
  cover_path    text,               -- storage path of the main photo
  published     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index items_side_idx on public.items (side, published, sort_order, created_at desc);

create table public.item_photos (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items (id) on delete cascade,
  path        text not null,        -- storage path
  caption     text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index item_photos_item_idx on public.item_photos (item_id, sort_order);

-- keep updated_at fresh
create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger items_touch before update on public.items
  for each row execute function public.touch_updated_at();
create trigger sides_touch before update on public.sides
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- helpers

-- Which side is the current user allowed to edit? (null for visitors)
create function public.my_side() returns public.side
language sql stable security definer set search_path = public as $$
  select side from public.admins where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------- row level security

alter table public.sides       enable row level security;
alter table public.admins      enable row level security;
alter table public.categories  enable row level security;
alter table public.items       enable row level security;
alter table public.item_photos enable row level security;

-- sides
create policy "sides are public"      on public.sides for select using (true);
create policy "admins edit own side"  on public.sides for update
  using (side = public.my_side()) with check (side = public.my_side());

-- admins: a user may see their own admin row (used by the dashboard to know their side)
create policy "read own admin row" on public.admins for select using (user_id = auth.uid());

-- categories
create policy "categories are public"       on public.categories for select using (true);
create policy "admins manage own categories" on public.categories for all
  using (side = public.my_side()) with check (side = public.my_side());

-- items: visitors see published items, admins also see their own drafts
create policy "published items are public" on public.items for select
  using (published or side = public.my_side());
create policy "admins manage own items" on public.items for all
  using (side = public.my_side()) with check (side = public.my_side());

-- item photos follow their item
create policy "photos of visible items are public" on public.item_photos for select
  using (exists (select 1 from public.items i
                 where i.id = item_id and (i.published or i.side = public.my_side())));
create policy "admins manage own photos" on public.item_photos for all
  using (exists (select 1 from public.items i where i.id = item_id and i.side = public.my_side()))
  with check (exists (select 1 from public.items i where i.id = item_id and i.side = public.my_side()));

-- ---------------------------------------------------------------- storage

-- Public bucket: anyone can view photos by URL. Files live under '<side>/...'.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 26214400,   -- 25 MB per photo
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "admins upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = public.my_side()::text);
create policy "admins update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = public.my_side()::text);
create policy "admins delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = public.my_side()::text);

-- ---------------------------------------------------------------- starter content

insert into public.sides (side, display_name, tagline, bio) values
  ('inbar', 'Inbar', 'Paint, fire, water and wood',
   'Painting, wood burning, water art, woodworking, sculpting and every kind of brush in between.'),
  ('eli', 'Eli', 'Vintage radios, brought back to life',
   'Restoring tube and transistor radios from the 1950s and 1960s, one capacitor at a time.');

insert into public.categories (side, name, sort_order) values
  ('inbar', 'Painting', 1),
  ('inbar', 'Wood burning', 2),
  ('inbar', 'Water art', 3),
  ('inbar', 'Woodworking', 4),
  ('inbar', 'Sculpting', 5),
  ('inbar', 'Brushwork', 6),
  ('eli', 'Tube radios', 1),
  ('eli', 'Transistor radios', 2),
  ('eli', 'Radiograms', 3),
  ('eli', 'Parts & repairs', 4);
