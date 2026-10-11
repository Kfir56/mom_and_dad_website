-- Hebrew content, before/after photos, sound clips, videos, exhibitions & news,
-- visitor messages, and drag-to-reorder. Everything here is additive, so the
-- site keeps working while this is applied.

-- ---------------------------------------------------------------- Hebrew text
-- The existing text columns hold English; *_he columns hold Hebrew. The site shows
-- the visitor's language and falls back to the other one when a field is empty.

alter table public.sides
  add column if not exists display_name_he text not null default '',
  add column if not exists tagline_he      text not null default '',
  add column if not exists bio_he          text not null default '';

alter table public.categories
  add column if not exists name_he text not null default '';

alter table public.items
  add column if not exists title_he       text not null default '',
  add column if not exists description_he text not null default '',
  add column if not exists materials_he   text,
  add column if not exists process_he     text,
  -- media
  add column if not exists before_path    text,   -- "before" photo for the before/after slider
  add column if not exists audio_path     text,   -- sound clip (e.g. the restored radio playing)
  add column if not exists video_url      text;   -- optional YouTube / Vimeo link

-- Extra media can now be photos or short uploaded videos.
alter table public.item_photos
  add column if not exists kind text not null default 'image' check (kind in ('image', 'video'));

update public.sides set display_name_he = 'ענבר', tagline_he = 'צבע, אש, מים ועץ',
  bio_he = 'ציור, צריבה בעץ, אמנות מים, עבודות עץ, פיסול וכל סוג של מכחול שביניהם.'
  where side = 'inbar' and display_name_he = '';
update public.sides set display_name_he = 'אלי', tagline_he = 'מקלטי רדיו וינטג׳ שחוזרים לחיים',
  bio_he = 'משחזר מקלטי רדיו עם מנורות וטרנזיסטורים משנות ה־50 וה־60, קבל אחרי קבל.'
  where side = 'eli' and display_name_he = '';

update public.categories c set name_he = v.he
from (values
  ('inbar', 'Painting', 'ציור'), ('inbar', 'Wood burning', 'צריבה בעץ'), ('inbar', 'Water art', 'אמנות מים'),
  ('inbar', 'Woodworking', 'עבודות עץ'), ('inbar', 'Sculpting', 'פיסול'), ('inbar', 'Brushwork', 'עבודת מכחול'),
  ('eli', 'Tube radios', 'רדיו מנורות'), ('eli', 'Transistor radios', 'רדיו טרנזיסטורים'),
  ('eli', 'Radiograms', 'רדיוגרמות'), ('eli', 'Parts & repairs', 'חלקים ותיקונים')
) as v(side, en, he)
where c.side::text = v.side and c.name = v.en and c.name_he = '';

-- ---------------------------------------------------------------- exhibitions & news

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  side        public.side not null,
  title       text not null default '',
  title_he    text not null default '',
  body        text not null default '',
  body_he     text not null default '',
  location    text not null default '',
  event_date  date,                       -- exhibition / event date, or null for plain news
  image_path  text,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  check (title <> '' or title_he <> '')
);
create index if not exists posts_side_idx on public.posts (side, published, event_date desc nulls last);

alter table public.posts enable row level security;
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;

create policy "published posts are public" on public.posts for select
  using (published or side = (select public.my_side()));
create policy "admins manage own posts" on public.posts for all to authenticated
  using (side = (select public.my_side())) with check (side = (select public.my_side()));

-- ---------------------------------------------------------------- visitor messages

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  side        public.side not null,
  item_id     uuid references public.items (id) on delete set null,
  name        text not null check (char_length(name) between 1 and 100),
  email       text not null check (char_length(email) between 3 and 200 and email like '%@%'),
  body        text not null check (char_length(body) between 1 and 4000),
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists messages_side_idx on public.messages (side, created_at desc);
create index if not exists messages_item_idx on public.messages (item_id);

alter table public.messages enable row level security;
-- Visitors may only send (never read) messages, and can't pre-mark them as read.
grant insert (side, item_id, name, email, body) on public.messages to anon, authenticated;
grant select, update, delete on public.messages to authenticated;

create policy "anyone can send a message" on public.messages for insert to anon, authenticated
  with check (is_read = false);
create policy "admins read own messages" on public.messages for select to authenticated
  using (side = (select public.my_side()));
create policy "admins update own messages" on public.messages for update to authenticated
  using (side = (select public.my_side())) with check (side = (select public.my_side()));
create policy "admins delete own messages" on public.messages for delete to authenticated
  using (side = (select public.my_side()));

-- Simple flood protection: at most 20 messages per side per hour.
create schema if not exists private;
create or replace function private.limit_message_rate() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.messages m
      where m.side = new.side and m.created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Too many messages right now, please try again later.';
  end if;
  return new;
end $$;
revoke all on function private.limit_message_rate() from public, anon, authenticated;

create or replace trigger messages_rate_limit before insert on public.messages
  for each row execute function private.limit_message_rate();

-- ---------------------------------------------------------------- reorder

-- Saves a new order for the caller's own items in one call. Runs as the caller, so RLS applies.
create or replace function public.reorder_items(ids uuid[]) returns void
language sql security invoker set search_path = '' as $$
  update public.items i set sort_order = o.pos
  from unnest(ids) with ordinality as o(id, pos)
  where i.id = o.id;
$$;
revoke execute on function public.reorder_items(uuid[]) from public, anon;
grant execute on function public.reorder_items(uuid[]) to authenticated;

-- ---------------------------------------------------------------- storage: video and audio

update storage.buckets
set file_size_limit = 52428800,   -- 50 MB, the Supabase free-plan maximum
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/avif',
      'video/mp4', 'video/quicktime', 'video/webm',
      'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'
    ]
where id = 'portfolio';
