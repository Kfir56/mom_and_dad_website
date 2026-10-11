"use client";

import { useEffect, useRef, useState } from "react";
import { addCategory, saveItem, type ItemFields, type PhotoDraft } from "@/lib/admin-api";
import { photoUrl } from "@/lib/supabase";
import type { Category, Item, Side } from "@/lib/types";
import { LABELS } from "./labels";

type Props = {
  side: Side;
  item: Item | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onCategoriesChanged: () => void;
};

const MAX_MB = 25;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

const inputClass =
  "mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-lg outline-none focus:border-stone-800";

export function ItemEditor({ side, item, categories, onClose, onSaved, onCategoriesChanged }: Props) {
  const L = LABELS[side];
  const [fields, setFields] = useState<ItemFields>({
    title: item?.title ?? "",
    description: item?.description ?? "",
    category_id: item?.category_id ?? categories[0]?.id ?? null,
    year: item?.year ?? null,
    materials: item?.materials ?? null,
    manufacturer: item?.manufacturer ?? null,
    model: item?.model ?? null,
    process: item?.process ?? null,
    published: item?.published ?? true,
  });
  const [photos, setPhotos] = useState<PhotoDraft[]>(() =>
    item
      ? [
          ...(item.cover_path ? [{ kind: "existing" as const, id: "cover", path: item.cover_path, caption: "" }] : []),
          ...item.item_photos.map((p) => ({ kind: "existing" as const, id: p.id, path: p.path, caption: p.caption })),
        ]
      : [],
  );
  const [cats, setCats] = useState(categories);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Free the in-memory previews when the editor closes.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => photosRef.current.forEach((p) => p.kind === "new" && URL.revokeObjectURL(p.preview)),
    [],
  );

  const set = <K extends keyof ItemFields>(key: K, value: ItemFields[K]) => setFields((f) => ({ ...f, [key]: value }));
  const text = (key: keyof ItemFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    set(key, (e.target.value || null) as never);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted: PhotoDraft[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPT.split(",").includes(file.type)) {
        setError(`"${file.name}" isn't a JPG, PNG or WebP photo.`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`"${file.name}" is larger than ${MAX_MB} MB. Please choose a smaller photo.`);
        continue;
      }
      accepted.push({ kind: "new", key: crypto.randomUUID(), file, preview: URL.createObjectURL(file), caption: "" });
    }
    setPhotos((p) => [...p, ...accepted]);
  };

  const keyOf = (p: PhotoDraft) => (p.kind === "new" ? p.key : p.id);
  const removePhoto = (key: string) =>
    setPhotos((ps) => {
      const gone = ps.find((p) => keyOf(p) === key);
      if (gone?.kind === "new") URL.revokeObjectURL(gone.preview);
      return ps.filter((p) => keyOf(p) !== key);
    });
  const makeCover = (key: string) =>
    setPhotos((ps) => {
      const chosen = ps.find((p) => keyOf(p) === key)!;
      return [chosen, ...ps.filter((p) => p !== chosen)];
    });
  const setCaption = (key: string, caption: string) =>
    setPhotos((ps) => ps.map((p) => (keyOf(p) === key ? { ...p, caption } : p)));

  const createCategory = async () => {
    const name = newCategory?.trim();
    if (!name) return;
    try {
      const cat = await addCategory(side, name, cats.length + 1);
      setCats((c) => [...c, cat]);
      set("category_id", cat.id);
      setNewCategory(null);
      onCategoriesChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      setError("Please add at least one photo.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveItem(side, item, { ...fields, title: fields.title.trim() }, photos, (done, total) => setProgress([done, total]));
      onSaved(
        fields.published
          ? `"${fields.title}" was saved and is live on the website.`
          : `"${fields.title}" was saved. It's hidden from the website until you tick "Show on website".`,
      );
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
      setProgress(null);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={item ? `Edit ${item.title}` : `Add a new ${L.piece}`} className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-2 sm:p-6">
      <form onSubmit={submit} className="mx-auto max-w-3xl rounded-3xl bg-stone-50 p-5 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{item ? `Edit "${item.title}"` : `Add a new ${L.piece}`}</h2>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-full px-3 py-1 text-3xl leading-none hover:bg-stone-200" aria-label="Close">
            ×
          </button>
        </div>

        {/* 1. Photos */}
        <section className="mb-8">
          <h3 className="mb-1 text-lg font-semibold">1. Photos</h3>
          <p className="mb-3 text-stone-600">The first photo is the main one shown in the gallery. You can add more for details{side === "eli" ? " or before/after shots" : " or work in progress"}.</p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`rounded-2xl border-4 border-dashed p-4 transition ${dragOver ? "border-stone-800 bg-stone-200" : "border-stone-300 bg-white"}`}
          >
            {photos.length > 0 && (
              <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((p, i) => {
                  const key = keyOf(p);
                  const src = p.kind === "new" ? p.preview : photoUrl(p.path);
                  return (
                    <li key={key} className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                      <div className="relative aspect-square bg-stone-200">
                        {/* eslint-disable-next-line @next/next/no-img-element -- local previews (blob: URLs) */}
                        {src && <img src={src} alt="" className="h-full w-full object-cover" />}
                        {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-stone-900 px-2 py-0.5 text-xs font-semibold text-white">Main photo</span>}
                      </div>
                      <div className="space-y-1 p-2">
                        {i > 0 && (
                          <input
                            value={p.caption}
                            onChange={(e) => setCaption(key, e.target.value)}
                            placeholder="Caption (optional)"
                            className="w-full rounded-lg border border-stone-200 px-2 py-1 text-sm"
                          />
                        )}
                        <div className="flex gap-1">
                          {i > 0 && (
                            <button type="button" onClick={() => makeCover(key)} className="flex-1 rounded-lg bg-stone-200 px-2 py-1 text-sm hover:bg-stone-300">
                              Make main
                            </button>
                          )}
                          <button type="button" onClick={() => removePhoto(key)} className="flex-1 rounded-lg bg-red-50 px-2 py-1 text-sm text-red-700 hover:bg-red-100">
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="w-full rounded-xl bg-stone-900 py-4 text-lg font-semibold text-white hover:bg-stone-700"
            >
              {photos.length ? "Add more photos" : "Choose photos"}
            </button>
            <p className="mt-2 text-center text-sm text-stone-500">…or drag them here. Up to {MAX_MB} MB each.</p>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT}
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        {/* 2. Details */}
        <section className="mb-8 space-y-4">
          <h3 className="text-lg font-semibold">2. Details</h3>
          <label className="block">
            <span className="font-medium">Title *</span>
            <input required value={fields.title} onChange={(e) => set("title", e.target.value)} placeholder={L.titleHint} className={inputClass} />
          </label>

          <div className="block">
            <label htmlFor="category" className="font-medium">Category</label>
            {newCategory === null ? (
              <select
                id="category"
                value={fields.category_id ?? ""}
                onChange={(e) => (e.target.value === "__new" ? setNewCategory("") : set("category_id", e.target.value || null))}
                className={inputClass}
              >
                <option value="">No category</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="__new">＋ New category…</option>
              </select>
            ) : (
              <div className="mt-1 flex gap-2">
                <input
                  id="category"
                  autoFocus
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createCategory())}
                  placeholder={L.categoryHint}
                  className={inputClass.replace("mt-1 ", "")}
                />
                <button type="button" onClick={createCategory} className="rounded-xl bg-stone-900 px-4 font-semibold text-white">Add</button>
                <button type="button" onClick={() => setNewCategory(null)} className="rounded-xl px-3 text-stone-600">Cancel</button>
              </div>
            )}
          </div>

          {side === "eli" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-medium">Manufacturer</span>
                <input value={fields.manufacturer ?? ""} onChange={text("manufacturer")} placeholder="e.g. Philips" className={inputClass} />
              </label>
              <label className="block">
                <span className="font-medium">Model</span>
                <input value={fields.model ?? ""} onChange={text("model")} placeholder="e.g. BX998A" className={inputClass} />
              </label>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-medium">{L.yearLabel}</span>
              <input
                type="number"
                inputMode="numeric"
                min={1900}
                max={2100}
                value={fields.year ?? ""}
                onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)}
                className={inputClass}
              />
            </label>
            {side === "inbar" && (
              <label className="block">
                <span className="font-medium">Materials</span>
                <input value={fields.materials ?? ""} onChange={text("materials")} placeholder="e.g. Pyrography on olive wood" className={inputClass} />
              </label>
            )}
          </div>

          <label className="block">
            <span className="font-medium">Short description</span>
            <textarea rows={3} value={fields.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
          </label>

          <label className="block">
            <span className="font-medium">{L.processLabel}</span>
            <textarea rows={4} value={fields.process ?? ""} onChange={text("process")} placeholder={L.processHint} className={inputClass} />
          </label>

          <label className="flex items-center gap-3 rounded-xl bg-white p-4">
            <input type="checkbox" checked={fields.published} onChange={(e) => set("published", e.target.checked)} className="h-6 w-6" />
            <span className="text-lg">Show on website</span>
          </label>
        </section>

        {error && <p role="alert" className="mb-4 rounded-xl bg-red-100 p-4 text-red-900">{error}</p>}

        <div className="flex gap-3">
          <button disabled={saving} className="flex-1 rounded-xl bg-green-700 py-4 text-xl font-bold text-white hover:bg-green-800 disabled:opacity-60">
            {saving ? (progress && progress[0] < progress[1] ? `Uploading photo ${progress[0] + 1} of ${progress[1]}…` : "Saving…") : "Save"}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border-2 border-stone-300 px-6 text-lg">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
