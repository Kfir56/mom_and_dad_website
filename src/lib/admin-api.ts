"use client";

import { getBrowserClient, STORAGE_BUCKET } from "./supabase";
import { shrinkImage } from "./shrink-image";
import type { Category, Item, MediaKind, Message, Post, Side, SidePortfolio, SideProfile } from "./types";
import { refreshPublicSite } from "@/app/admin/actions";

// All writes go straight from the browser to Supabase. Row Level Security
// (see supabase/migrations) makes sure each parent can only touch their own side.

const db = () => getBrowserClient();

function check<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

export type AdminData = SidePortfolio & { messages: Message[] };

export async function loadSide(side: Side): Promise<AdminData> {
  const [profile, categories, items, posts, messages] = await Promise.all([
    db().from("sides").select("*").eq("side", side).single(),
    db().from("categories").select("*").eq("side", side).order("sort_order"),
    db()
      .from("items")
      .select("*, item_photos(*)")
      .eq("side", side)
      .order("sort_order")
      .order("created_at", { ascending: false }),
    db()
      .from("posts")
      .select("*")
      .eq("side", side)
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    db().from("messages").select("*").eq("side", side).order("created_at", { ascending: false }).limit(500),
  ]);
  return {
    profile: check(profile) as SideProfile,
    categories: check(categories) as Category[],
    items: (check(items) as Item[]).map((i) => ({
      ...i,
      item_photos: [...i.item_photos].sort((a, b) => a.sort_order - b.sort_order),
    })),
    posts: check(posts) as Post[],
    messages: check(messages) as Message[],
  };
}

/** Tell the public site to pick up the latest changes. */
export async function publishChanges() {
  const { data } = await db().auth.getSession();
  if (data.session) await refreshPublicSite(data.session.access_token);
}

/** Upload one file to the parent's folder. Photos are shrunk first. */
export async function uploadFile(side: Side, folder: string, original: File): Promise<string> {
  const file = await shrinkImage(original);
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${side}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db().storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`${file.name}: ${error.message}`);
  return path;
}

export async function removeFiles(paths: (string | null | undefined)[]) {
  const real = paths.filter((p): p is string => Boolean(p));
  if (real.length === 0) return;
  const { error } = await db().storage.from(STORAGE_BUCKET).remove(real);
  if (error) throw new Error(error.message);
}

/** A single optional file: keep what's stored, replace it with a new file, or clear it. */
export type FileSlot = { path: string | null } | { file: File };

async function resolveSlot(side: Side, folder: string, slot: FileSlot) {
  return "file" in slot ? uploadFile(side, folder, slot.file) : slot.path;
}

export type ItemFields = Pick<
  Item,
  | "title"
  | "title_he"
  | "description"
  | "description_he"
  | "category_id"
  | "year"
  | "materials"
  | "materials_he"
  | "manufacturer"
  | "model"
  | "process"
  | "process_he"
  | "video_url"
  | "published"
>;

export type MediaDraft =
  | { source: "existing"; id: string; path: string; caption: string; kind: MediaKind }
  | { source: "new"; key: string; file: File; preview: string; caption: string; kind: MediaKind };

/**
 * Create or update a piece and its media. The first photo in `media` becomes the cover;
 * everything else (more photos, videos) is listed after it. Files no longer used are deleted.
 */
export async function saveItem(
  side: Side,
  existing: Item | null,
  fields: ItemFields,
  media: MediaDraft[],
  extras: { before: FileSlot; audio: FileSlot },
  onProgress?: (done: number, total: number) => void,
) {
  const item = existing
    ? (check(await db().from("items").update(fields).eq("id", existing.id).select().single()) as Item)
    : (check(await db().from("items").insert({ ...fields, side }).select().single()) as Item);

  const uploads = media.filter((m) => m.source === "new").length + ("file" in extras.before ? 1 : 0) + ("file" in extras.audio ? 1 : 0);
  let done = 0;
  onProgress?.(0, uploads);
  const tick = () => onProgress?.(++done, uploads);

  const stored: { path: string; caption: string; kind: MediaKind }[] = [];
  for (const m of media) {
    const path = m.source === "existing" ? m.path : await uploadFile(side, item.id, m.file);
    if (m.source === "new") tick();
    stored.push({ path, caption: m.caption, kind: m.kind });
  }
  const before_path = await resolveSlot(side, item.id, extras.before);
  if ("file" in extras.before) tick();
  const audio_path = await resolveSlot(side, item.id, extras.audio);
  if ("file" in extras.audio) tick();

  // Cover = first photo. The editor keeps a photo first when there is one.
  const coverIndex = stored.findIndex((m) => m.kind === "image");
  const cover_path = coverIndex >= 0 ? stored[coverIndex].path : null;
  const rest = stored.filter((_, i) => i !== coverIndex);

  check(await db().from("items").update({ cover_path, before_path, audio_path }).eq("id", item.id));
  check(await db().from("item_photos").delete().eq("item_id", item.id));
  if (rest.length) {
    check(
      await db()
        .from("item_photos")
        .insert(rest.map((m, i) => ({ item_id: item.id, path: m.path, caption: m.caption, kind: m.kind, sort_order: i }))),
    );
  }

  // Only delete old files once nothing points at them any more.
  if (existing) {
    const now = new Set([...stored.map((m) => m.path), before_path, audio_path]);
    await removeFiles(
      [existing.cover_path, existing.before_path, existing.audio_path, ...existing.item_photos.map((p) => p.path)].filter(
        (p) => p && !now.has(p),
      ),
    );
  }
  await publishChanges();
}

export async function deleteItem(item: Item) {
  check(await db().from("items").delete().eq("id", item.id));
  await removeFiles([item.cover_path, item.before_path, item.audio_path, ...item.item_photos.map((p) => p.path)]);
  await publishChanges();
}

/** Save the gallery order (first id is shown first). */
export async function reorderItems(ids: string[]) {
  check(await db().rpc("reorder_items", { ids }));
  await publishChanges();
}

// ---------------------------------------------------------------- categories

/** The English name can't be empty (it must be unique per side), so it falls back to the Hebrew one. */
const categoryRow = (name: string, name_he: string) => ({ name: name.trim() || name_he.trim(), name_he: name_he.trim() });

export async function addCategory(side: Side, name: string, name_he: string, sort_order: number) {
  const cat = check(
    await db().from("categories").insert({ side, sort_order, ...categoryRow(name, name_he) }).select().single(),
  ) as Category;
  await publishChanges();
  return cat;
}

export async function renameCategory(id: string, name: string, name_he: string) {
  check(await db().from("categories").update(categoryRow(name, name_he)).eq("id", id));
  await publishChanges();
}

export async function deleteCategory(id: string) {
  check(await db().from("categories").delete().eq("id", id));
  await publishChanges();
}

// ---------------------------------------------------------------- profile

export type ProfileFields = Pick<SideProfile, "display_name" | "display_name_he" | "tagline" | "tagline_he" | "bio" | "bio_he">;

/** Pass a new heroFile to replace the background photo, or removeHero to take it away. */
export async function saveProfile(
  side: Side,
  fields: ProfileFields,
  { heroFile, removeHero, oldHero }: { heroFile?: File | null; removeHero?: boolean; oldHero?: string | null } = {},
) {
  let hero_image = removeHero ? null : (oldHero ?? null);
  if (heroFile) hero_image = await uploadFile(side, "hero", heroFile);
  // display_name is required, so fall back to the Hebrew name.
  const row = { ...fields, display_name: fields.display_name.trim() || fields.display_name_he.trim(), hero_image };
  check(await db().from("sides").update(row).eq("side", side));
  if (oldHero && hero_image !== oldHero) await removeFiles([oldHero]);
  await publishChanges();
}

// ---------------------------------------------------------------- news

export type PostFields = Pick<Post, "title" | "title_he" | "body" | "body_he" | "location" | "event_date" | "published">;

export async function savePost(side: Side, existing: Post | null, fields: PostFields, image: FileSlot) {
  const post = existing
    ? (check(await db().from("posts").update(fields).eq("id", existing.id).select().single()) as Post)
    : (check(await db().from("posts").insert({ ...fields, side }).select().single()) as Post);
  const image_path = await resolveSlot(side, `news/${post.id}`, image);
  check(await db().from("posts").update({ image_path }).eq("id", post.id));
  if (existing?.image_path && existing.image_path !== image_path) await removeFiles([existing.image_path]);
  await publishChanges();
}

export async function deletePost(post: Post) {
  check(await db().from("posts").delete().eq("id", post.id));
  await removeFiles([post.image_path]);
  await publishChanges();
}

// ---------------------------------------------------------------- messages (private, so no publish needed)

export async function setMessageRead(id: string, is_read: boolean) {
  check(await db().from("messages").update({ is_read }).eq("id", id));
}

export async function deleteMessage(id: string) {
  check(await db().from("messages").delete().eq("id", id));
}
