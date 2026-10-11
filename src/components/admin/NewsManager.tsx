"use client";

import { useState } from "react";
import { deletePost, savePost, type FileSlot, type PostFields } from "@/lib/admin-api";
import { formatDate, pick } from "@/lib/i18n";
import { photoUrl } from "@/lib/supabase";
import type { Post, Side } from "@/lib/types";
import { BiField, useAdminLang } from "./AdminLang";
import { FileSlotPicker } from "./FileSlotPicker";

type Props = { side: Side; posts: Post[]; onChange: (message: string) => Promise<void>; onError: (msg: string) => void };

const inputClass = "mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-lg outline-none focus:border-stone-800";

/** Exhibitions & news shown under the gallery. */
export function NewsManager({ side, posts, onChange, onError }: Props) {
  const { lang, a } = useAdminLang();
  const [editing, setEditing] = useState<Post | "new" | null>(null);

  if (editing) {
    return (
      <PostEditor
        side={side}
        post={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await onChange(a.postSaved);
        }}
        onError={onError}
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <p className="text-lg text-stone-600">{a.newsIntro}</p>
      <button
        onClick={() => setEditing("new")}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border-4 border-dashed border-stone-300 bg-white py-6 text-xl font-semibold text-stone-700 hover:border-stone-500"
      >
        <span className="text-3xl">＋</span> {a.addPost}
      </button>
      {posts.length === 0 && <p className="text-center text-stone-500">{a.noPosts}</p>}
      <ul className="space-y-3">
        {posts.map((post) => {
          const title = pick(lang, post.title, post.title_he);
          const image = photoUrl(post.image_path);
          return (
            <li key={post.id} className="flex items-center gap-4 rounded-2xl bg-white p-3">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-20 shrink-0 rounded-lg bg-stone-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">
                  {title}
                  {!post.published && <span className="ms-2 rounded-full bg-stone-800 px-2 py-0.5 text-xs text-white">{a.hidden}</span>}
                </p>
                <p className="text-sm text-stone-500">{[post.event_date && formatDate(lang, post.event_date), post.location].filter(Boolean).join(" · ")}</p>
              </div>
              <button onClick={() => setEditing(post)} className="rounded-xl bg-stone-900 px-4 py-2 text-white">{a.edit}</button>
              <button
                onClick={async () => {
                  if (!confirm(a.confirmDeletePost(title))) return;
                  try {
                    await deletePost(post);
                    await onChange(a.deleted(title));
                  } catch (e) {
                    onError((e as Error).message);
                  }
                }}
                className="rounded-xl px-3 py-2 text-red-700 hover:bg-red-50"
              >
                {a.delete}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PostEditor({ side, post, onCancel, onSaved, onError }: { side: Side; post: Post | null; onCancel: () => void; onSaved: () => Promise<void>; onError: (m: string) => void }) {
  const { a } = useAdminLang();
  const [fields, setFields] = useState<PostFields>({
    title: post?.title ?? "",
    title_he: post?.title_he ?? "",
    body: post?.body ?? "",
    body_he: post?.body_he ?? "",
    location: post?.location ?? "",
    event_date: post?.event_date ?? null,
    published: post?.published ?? true,
  });
  const [image, setImage] = useState<FileSlot>({ path: post?.image_path ?? null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof PostFields>(key: K) => (value: PostFields[K]) => setFields((f) => ({ ...f, [key]: value }));

  return (
    <form
      noValidate
      className="max-w-3xl space-y-5 rounded-3xl bg-white p-5 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!fields.title.trim() && !fields.title_he.trim()) return setError(a.needTitle);
        setSaving(true);
        try {
          await savePost(side, post, { ...fields, title: fields.title.trim(), title_he: fields.title_he.trim() }, image);
          await onSaved();
        } catch (err) {
          onError((err as Error).message);
          setSaving(false);
        }
      }}
    >
      <p className="text-sm text-stone-500">{a.bothLangsHint}</p>
      <BiField label={`${a.postTitle} *`} he={fields.title_he} en={fields.title} onHe={set("title_he")} onEn={set("title")} className={inputClass} />
      <BiField label={a.postBody} multiline rows={4} he={fields.body_he} en={fields.body} onHe={set("body_he")} onEn={set("body")} className={inputClass} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-medium">{a.location}</span>
          <input value={fields.location} onChange={(e) => set("location")(e.target.value)} placeholder={a.locationHint} className={inputClass} />
        </label>
        <label className="block">
          <span className="font-medium">{a.date}</span>
          <input type="date" value={fields.event_date ?? ""} onChange={(e) => set("event_date")(e.target.value || null)} className={inputClass} />
          <span className="text-sm text-stone-500">{a.dateHint}</span>
        </label>
      </div>
      <FileSlotPicker label={a.photo} accept="image/jpeg,image/png,image/webp,image/avif" kind="image" maxMb={50} value={image} onChange={setImage} onError={setError} />
      <label className="flex items-center gap-3 rounded-xl bg-stone-50 p-4">
        <input type="checkbox" checked={fields.published} onChange={(e) => set("published")(e.target.checked)} className="h-6 w-6" />
        <span className="text-lg">{a.showOnSite}</span>
      </label>
      {error && <p role="alert" className="rounded-xl bg-red-100 p-4 text-red-900">{error}</p>}
      <div className="flex gap-3">
        <button disabled={saving} className="flex-1 rounded-xl bg-green-700 py-4 text-xl font-bold text-white hover:bg-green-800 disabled:opacity-60">
          {saving ? a.saving : a.save}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-xl border-2 border-stone-300 px-6 text-lg">
          {a.cancel}
        </button>
      </div>
    </form>
  );
}
