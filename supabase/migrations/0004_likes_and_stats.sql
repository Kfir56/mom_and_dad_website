-- Likes and simple visitor stats. Additive only.
-- Visitors never touch these tables directly: they call the small functions below,
-- which run with elevated rights but only do one narrow thing each.

alter table public.items
  add column if not exists view_count  int not null default 0,
  add column if not exists like_count  int not null default 0,
  add column if not exists share_count int not null default 0;

alter table public.sides
  add column if not exists visits int not null default 0;

-- One row per (piece, anonymous visitor id kept in the visitor's browser).
create table if not exists public.item_likes (
  item_id    uuid not null references public.items (id) on delete cascade,
  visitor    uuid not null,
  created_at timestamptz not null default now(),
  primary key (item_id, visitor)
);
alter table public.item_likes enable row level security;   -- no policies: not readable or writable directly
revoke all on public.item_likes from anon, authenticated;

-- Like or unlike a published piece. Returns the new total.
create or replace function public.set_like(p_item uuid, p_visitor uuid, p_liked boolean) returns int
language plpgsql security definer set search_path = '' as $$
declare total int;
begin
  if not exists (select 1 from public.items i where i.id = p_item and i.published) then
    return 0;
  end if;
  if p_liked then
    insert into public.item_likes (item_id, visitor) values (p_item, p_visitor) on conflict do nothing;
  else
    delete from public.item_likes where item_id = p_item and visitor = p_visitor;
  end if;
  update public.items set like_count = (select count(*) from public.item_likes l where l.item_id = p_item)
    where id = p_item returning like_count into total;
  return coalesce(total, 0);
end $$;

-- Current like total for a piece and whether this visitor already liked it.
create or replace function public.like_state(p_item uuid, p_visitor uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'count', coalesce((select i.like_count from public.items i where i.id = p_item and i.published), 0),
    'liked', exists (select 1 from public.item_likes l where l.item_id = p_item and l.visitor = p_visitor)
  )
$$;

create or replace function public.record_view(p_item uuid) returns void
language sql security definer set search_path = '' as $$
  update public.items set view_count = view_count + 1 where id = p_item and published;
$$;

create or replace function public.record_share(p_item uuid) returns void
language sql security definer set search_path = '' as $$
  update public.items set share_count = share_count + 1 where id = p_item and published;
$$;

create or replace function public.record_side_visit(p_side public.side) returns void
language sql security definer set search_path = '' as $$
  update public.sides set visits = visits + 1 where side = p_side;
$$;

revoke execute on function public.set_like(uuid, uuid, boolean), public.like_state(uuid, uuid),
  public.record_view(uuid), public.record_share(uuid), public.record_side_visit(public.side) from public;
grant execute on function public.set_like(uuid, uuid, boolean), public.like_state(uuid, uuid),
  public.record_view(uuid), public.record_share(uuid), public.record_side_visit(public.side) to anon, authenticated;
