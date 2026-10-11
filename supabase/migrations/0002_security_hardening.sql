-- Fixes from a review against Supabase's security checklist and Postgres best practices.
-- Run after 0001. Policies are changed with ALTER POLICY (not drop + create) so nothing is
-- ever briefly unprotected and the Supabase MCP doesn't treat it as destructive.

-- 1. my_side() no longer needs SECURITY DEFINER: the "read own admin row" policy already lets a
--    signed-in user read their own admins row. Running as the caller keeps RLS in force,
--    and a pinned search_path stops it being hijacked.
create or replace function public.my_side() returns public.side
language sql stable security invoker set search_path = '' as $$
  select a.side from public.admins a where a.user_id = (select auth.uid())
$$;

alter function public.touch_updated_at() set search_path = '';

-- 2. Explicit Data API grants. Newer Supabase projects don't expose new tables automatically.
--    RLS (below) still decides which rows each role can see or change.
grant usage on schema public to anon, authenticated;
grant select on public.sides, public.categories, public.items, public.item_photos to anon, authenticated;
-- anon needs SELECT on admins because the public read policies call my_side(); RLS on admins
-- still returns zero rows to anyone who isn't signed in as that admin.
grant select on public.admins to anon, authenticated;
grant update on public.sides to authenticated;
grant insert, update, delete on public.categories, public.items, public.item_photos to authenticated;

-- 3. Policies: writes are for signed-in users only, and functions are wrapped in (select ...)
--    so Postgres evaluates them once per query instead of once per row.
alter policy "admins edit own side" on public.sides to authenticated
  using (side = (select public.my_side())) with check (side = (select public.my_side()));

alter policy "read own admin row" on public.admins to authenticated
  using (user_id = (select auth.uid()));

alter policy "admins manage own categories" on public.categories to authenticated
  using (side = (select public.my_side())) with check (side = (select public.my_side()));

alter policy "published items are public" on public.items
  using (published or side = (select public.my_side()));

alter policy "admins manage own items" on public.items to authenticated
  using (side = (select public.my_side())) with check (side = (select public.my_side()));

alter policy "photos of visible items are public" on public.item_photos
  using (exists (select 1 from public.items i
                 where i.id = item_id and (i.published or i.side = (select public.my_side()))));

alter policy "admins manage own photos" on public.item_photos to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.side = (select public.my_side())))
  with check (exists (select 1 from public.items i where i.id = item_id and i.side = (select public.my_side())));

-- 4. Index the foreign key used when a category is deleted.
create index if not exists items_category_idx on public.items (category_id);

-- 5. Storage: deleting and replacing files also needs a SELECT policy on the admin's own folder.
create policy "admins read own folder" on storage.objects for select to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select public.my_side())::text);
alter policy "admins upload to own folder" on storage.objects
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select public.my_side())::text);
alter policy "admins update own folder" on storage.objects
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select public.my_side())::text)
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select public.my_side())::text);
alter policy "admins delete own folder" on storage.objects
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select public.my_side())::text);
