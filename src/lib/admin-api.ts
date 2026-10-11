"use client";

import { getBrowserClient, STORAGE_BUCKET } from "./supabase";
import type { Category, Item, Side, SideProfile } from "./types";
import { refreshPublicSite } from "@/app/admin/actions";

// All writes go straight from the browser to Supabase. Row Level Security
// (see supabase/migrations) makes sure each parent can only touch their own side.

const db = () => getBrowserClient();

function check<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

export async function loadSide(side: Side) {
  const [profile, categories, items] = await Promise.all([
    db().from("sides").select("*").eq("side", side).single(),
    db().from("categories").select("*").eq("side", side).order("sort_order"),
    db()
      .from("items")
      .select("*, item_photos(*)")
      .eq("side", side)
      .order("sort_order")
      .order("created_at", { ascending: false }),
  ]);
  return {
    profile: check(profile) as SideProfile,
    categories: check(categories) as Category[],
    items: (check(items) as Item[]).map((i) => ({
      ...i,
      item_photos: [...i.item_photos].sort((a, b) => a.sort_order - b.sort_order),
    })),
  };
}

/** Tell the public site to pick up the latest changes. */
export async function publishChanges() {
  const { data } = await db().auth.getSession();
  if (data.session) await refreshPublicSite(data.session.access_token);
}

export async function uploadPhoto(side: Side, folder: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${side}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db().storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);
  return path;
}

export async function removePhotos(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await db().storage.from(STORAGE_BUCKET).remove(paths);
  if (error) throw new Error(error.message);
}

export type ItemFields = Pick<
  Item,
  "title" | "description" | "category_id" | "year" | "materials" | "manufacturer" | "model" | "process" | "published"
>;

export type PhotoDraft =
  | { kind: "existing"; id: string; path: string; caption: string }
  | { kind: "new"; key: string; file: File; preview: string; caption: string };

/**
 * Create or update a piece and its photos. The first photo in `photos` becomes the cover.
 * Photos removed from the list are deleted from storage.
 */
export async function saveItem(
  side: Side,
  existing: Item | null,
  fields: ItemFields,
  photos: PhotoDraft[],
  onProgress?: (done: number, total: number) => void,
) {
  const item = existing
    ? (check(await db().from("items").update(fields).eq("id", existing.id).select().single()) as Item)
    : (check(await db().from("items").insert({ ...fields, side }).select().single()) as Item);

  // Upload any new files.
  const newOnes = photos.filter((p) => p.kind === "new");
  let done = 0;
  onProgress?.(0, newOnes.length);
  const paths: string[] = [];
  for (const p of photos) {
    if (p.kind === "existing") paths.push(p.path);
    else {
      paths.push(await uploadPhoto(side, item.id, p.file));
      onProgress?.(++done, newOnes.length);
    }
  }

  // Work out which stored files are no longer used.
  const previous = existing ? [existing.cover_path, ...existing.item_photos.map((p) => p.path)].filter(Boolean) : [];
  const removed = (previous as string[]).filter((p) => !paths.includes(p));

  // Rewrite the photo list: first = cover, the rest = extra photos.
  check(await db().from("items").update({ cover_path: paths[0] ?? null }).eq("id", item.id));
  check(await db().from("item_photos").delete().eq("item_id", item.id));
  const extras = photos.slice(1).map((p, i) => ({ item_id: item.id, path: paths[i + 1], caption: p.caption, sort_order: i }));
  if (extras.length) check(await db().from("item_photos").insert(extras));

  await removePhotos(removed);
  await publishChanges();
}

export async function deleteItem(item: Item) {
  check(await db().from("items").delete().eq("id", item.id));
  await removePhotos([item.cover_path, ...item.item_photos.map((p) => p.path)].filter(Boolean) as string[]);
  await publishChanges();
}

export async function addCategory(side: Side, name: string, sort_order: number) {
  const cat = check(await db().from("categories").insert({ side, name, sort_order }).select().single()) as Category;
  await publishChanges();
  return cat;
}

export async function renameCategory(id: string, name: string) {
  check(await db().from("categories").update({ name }).eq("id", id));
  await publishChanges();
}

export async function deleteCategory(id: string) {
  check(await db().from("categories").delete().eq("id", id));
  await publishChanges();
}

export async function saveProfile(side: Side, fields: Pick<SideProfile, "display_name" | "tagline" | "bio">, heroFile?: File | null, oldHero?: string | null) {
  let hero_image = oldHero ?? null;
  if (heroFile) {
    hero_image = await uploadPhoto(side, "hero", heroFile);
    if (oldHero) await removePhotos([oldHero]);
  }
  check(await db().from("sides").update({ ...fields, hero_image }).eq("side", side));
  await publishChanges();
}
