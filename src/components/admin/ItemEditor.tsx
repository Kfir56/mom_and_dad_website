"use client";

import { useEffect, useRef, useState } from "react";
import { addCategory, saveItem, type FileSlot, type ItemFields, type MediaDraft } from "@/lib/admin-api";
import { pick } from "@/lib/i18n";
import { photoUrl } from "@/lib/supabase";
import { embedUrl } from "@/lib/video";
import type { Category, Item, MediaKind, Side } from "@/lib/types";
import { BiField, useAdminLang } from "./AdminLang";
import { craftOf } from "./admin-i18n";
import { FileSlotPicker } from "./FileSlotPicker";

type Props = {
  side: Side;
  item: Item | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onCategoriesChanged: () => void;
};

/** Supabase free plan allows files up to 50 MB. Photos are shrunk before upload, so this mostly limits videos. */
const MAX_MB = 50;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const AUDIO_ACCEPT = "audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,.m4a,.mp3";

const inputClass =
  "mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-lg outline-none focus:border-stone-800";

export function ItemEditor({ side, item, categories, onClose, onSaved, onCategoriesChanged }: Props) {
  const { lang, a } = useAdminLang();
  const L = craftOf(lang, side);
  const [fields, setFields] = useState<ItemFields>({
    title: item?.title ?? "",
    title_he: item?.title_he ?? "",
    description: item?.description ?? "",
    description_he: item?.description_he ?? "",
    category_id: item?.category_id ?? categories[0]?.id ?? null,
    year: item?.year ?? null,
    materials: item?.materials ?? null,
    materials_he: item?.materials_he ?? null,
    manufacturer: item?.manufacturer ?? null,
    model: item?.model ?? null,
    process: item?.process ?? null,
    process_he: item?.process_he ?? null,
    video_url: item?.video_url ?? null,
    published: item?.published ?? true,
  });
  const [media, setMedia] = useState<MediaDraft[]>(() =>
    item
      ? [
          ...(item.cover_path
            ? [{ source: "existing" as const, id: "cover", path: item.cover_path, caption: "", kind: "image" as const }]
            : []),
          ...item.item_photos.map((p) => ({ source: "existing" as const, id: p.id, path: p.path, caption: p.caption, kind: p.kind })),
        ]
      : [],
  );
  const [before, setBefore] = useState<FileSlot>({ path: item?.before_path ?? null });
  const [audio, setAudio] = useState<FileSlot>({ path: item?.audio_path ?? null });
  const [cats, setCats] = useState(categories);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Free the in-memory previews when the editor closes.
  const mediaRef = useRef(media);
  useEffect(() => {
    mediaRef.current = media;
  }, [media]);
  useEffect(() => () => mediaRef.current.forEach((m) => m.source === "new" && URL.revokeObjectURL(m.preview)), []);

  const set = <K extends keyof ItemFields>(key: K, value: ItemFields[K]) => setFields((f) => ({ ...f, [key]: value }));
  const orNull = (v: string) => (v.trim() ? v : null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted: MediaDraft[] = [];
    for (const file of Array.from(files)) {
      const kind: MediaKind | null = IMAGE_TYPES.includes(file.type) ? "image" : VIDEO_TYPES.includes(file.type) ? "video" : null;
      if (!kind) {
        setError(a.badType(file.name));
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(kind === "video" ? a.videoTooBig(file.name, MAX_MB) : a.photoTooBig(file.name, MAX_MB));
        continue;
      }
      accepted.push({ source: "new", key: crypto.randomUUID(), file, preview: URL.createObjectURL(file), caption: "", kind });
    }
    // Keep a photo first so the gallery has a main picture.
    setMedia((m) => {
      const all = [...m, ...accepted];
      const firstImage = all.findIndex((x) => x.kind === "image");
      return firstImage > 0 ? [all[firstImage], ...all.filter((_, i) => i !== firstImage)] : all;
    });
  };

  const keyOf = (m: MediaDraft) => (m.source === "new" ? m.key : m.id);
  const removeMedia = (key: string) =>
    setMedia((ms) => {
      const gone = ms.find((m) => keyOf(m) === key);
      if (gone?.source === "new") URL.revokeObjectURL(gone.preview);
      return ms.filter((m) => keyOf(m) !== key);
    });
  const makeCover = (key: string) =>
    setMedia((ms) => {
      const chosen = ms.find((m) => keyOf(m) === key)!;
      return [chosen, ...ms.filter((m) => m !== chosen)];
    });
  const setCaption = (key: string, caption: string) => setMedia((ms) => ms.map((m) => (keyOf(m) === key ? { ...m, caption } : m)));
  const coverKey = media.find((m) => m.kind === "image");

  const createCategory = async () => {
    const name = newCategory?.trim();
    if (!name) return;
    try {
      // Saved in the language the panel is in; the other one can be added under Categories.
      const cat = await addCategory(side, lang === "en" ? name : "", lang === "he" ? name : "", cats.length + 1);
      setCats((c) => [...c, cat]);
      set("category_id", cat.id);
      setNewCategory(null);
      onCategoriesChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const displayTitle = pick(lang, fields.title, fields.title_he);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (media.length === 0) return setError(a.needMedia);
    if (!fields.title.trim() && !fields.title_he.trim()) return setError(a.needTitle);
    if (fields.video_url && !embedUrl(fields.video_url)) return setError(a.badVideoLink);
    setSaving(true);
    setError(null);
    try {
      await saveItem(
        side,
        item,
        { ...fields, title: fields.title.trim(), title_he: fields.title_he.trim(), video_url: fields.video_url?.trim() || null },
        media,
        { before, audio },
        (done, total) => setProgress([done, total]),
      );
      onSaved(fields.published ? a.savedLive(displayTitle) : a.savedHidden(displayTitle));
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
      setProgress(null);
    }
  };

  const itemTitle = item ? pick(lang, item.title, item.title_he) : "";
  return (
    <div role="dialog" aria-modal="true" aria-label={item ? a.editTitle(itemTitle) : a.addNew(L.piece)} className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-2 sm:p-6">
      <form onSubmit={submit} noValidate className="mx-auto max-w-3xl rounded-3xl bg-stone-50 p-5 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{item ? a.editTitle(itemTitle) : a.addNew(L.piece)}</h2>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-full px-3 py-1 text-3xl leading-none hover:bg-stone-200" aria-label={a.close}>
            ×
          </button>
        </div>

        {/* 1. Photos & videos */}
        <section className="mb-8">
          <h3 className="mb-1 text-lg font-semibold">{a.stepMedia}</h3>
          <p className="mb-3 text-stone-600">{a.mediaHint(side)}</p>
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
            {media.length > 0 && (
              <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.map((m) => {
                  const key = keyOf(m);
                  const src = m.source === "new" ? m.preview : photoUrl(m.path);
                  const isCover = m === coverKey;
                  return (
                    <li key={key} className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                      <div className="relative aspect-square bg-stone-200">
                        {src && m.kind === "video" ? (
                          <video src={`${src}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element -- local previews (blob: URLs)
                          src && <img src={src} alt="" className="h-full w-full object-cover" />
                        )}
                        {isCover && <span className="absolute start-2 top-2 rounded-full bg-stone-900 px-2 py-0.5 text-xs font-semibold text-white">{a.mainPhoto}</span>}
                        {m.kind === "video" && <span className="absolute start-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">▶ {a.video}</span>}
                      </div>
                      <div className="space-y-1 p-2">
                        {!isCover && (
                          <input
                            value={m.caption}
                            onChange={(e) => setCaption(key, e.target.value)}
                            placeholder={a.caption}
                            className="w-full rounded-lg border border-stone-200 px-2 py-1 text-sm"
                          />
                        )}
                        <div className="flex gap-1">
                          {!isCover && m.kind === "image" && (
                            <button type="button" onClick={() => makeCover(key)} className="flex-1 rounded-lg bg-stone-200 px-2 py-1 text-sm hover:bg-stone-300">
                              {a.makeMain}
                            </button>
                          )}
                          <button type="button" onClick={() => removeMedia(key)} className="flex-1 rounded-lg bg-red-50 px-2 py-1 text-sm text-red-700 hover:bg-red-100">
                            {a.remove}
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
              {media.length ? a.addMore : a.choose}
            </button>
            <p className="mt-2 text-center text-sm text-stone-500">{a.dragHere(MAX_MB)}</p>
            <input
              ref={fileInput}
              type="file"
              accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        {/* 2. Extras */}
        <section className="mb-8 space-y-5 rounded-2xl bg-white p-4">
          <h3 className="text-lg font-semibold">{a.stepExtras}</h3>
          <FileSlotPicker label={a.beforePhoto} hint={a.beforeHint} accept={IMAGE_TYPES.join(",")} kind="image" maxMb={MAX_MB} value={before} onChange={setBefore} onError={setError} />
          <FileSlotPicker label={`♪ ${a.sound}`} hint={L.soundHint} accept={AUDIO_ACCEPT} kind="audio" maxMb={MAX_MB} value={audio} onChange={setAudio} onError={setError} />
          <label className="block">
            <span className="font-medium">▶ {a.videoLink}</span>
            <span className="block text-sm text-stone-500">{a.videoLinkHint}</span>
            <input
              type="url"
              dir="ltr"
              value={fields.video_url ?? ""}
              onChange={(e) => set("video_url", orNull(e.target.value))}
              placeholder="https://youtu.be/…"
              className={inputClass}
            />
            {fields.video_url && !embedUrl(fields.video_url) && <span className="text-sm text-red-700">{a.badVideoLink}</span>}
          </label>
        </section>

        {/* 3. Details */}
        <section className="mb-8 space-y-4">
          <h3 className="text-lg font-semibold">{a.stepDetails}</h3>
          <p className="text-sm text-stone-500">{a.bothLangsHint}</p>
          <BiField
            label={`${a.title} *`}
            he={fields.title_he}
            en={fields.title}
            onHe={(v) => set("title_he", v)}
            onEn={(v) => set("title", v)}
            placeholder={L.titleHint}
            className={inputClass}
          />

          <div className="block">
            <label htmlFor="category" className="font-medium">{a.category}</label>
            {newCategory === null ? (
              <select
                id="category"
                value={fields.category_id ?? ""}
                onChange={(e) => (e.target.value === "__new" ? setNewCategory("") : set("category_id", e.target.value || null))}
                className={inputClass}
              >
                <option value="">{a.noCategory}</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{pick(lang, c.name, c.name_he)}</option>
                ))}
                <option value="__new">{a.newCategory}</option>
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
                <button type="button" onClick={createCategory} className="rounded-xl bg-stone-900 px-4 font-semibold text-white">{a.add}</button>
                <button type="button" onClick={() => setNewCategory(null)} className="rounded-xl px-3 text-stone-600">{a.cancel}</button>
              </div>
            )}
          </div>

          {side === "eli" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-medium">{a.manufacturer}</span>
                <input dir="ltr" value={fields.manufacturer ?? ""} onChange={(e) => set("manufacturer", orNull(e.target.value))} placeholder="Philips" className={inputClass} />
              </label>
              <label className="block">
                <span className="font-medium">{a.model}</span>
                <input dir="ltr" value={fields.model ?? ""} onChange={(e) => set("model", orNull(e.target.value))} placeholder="BX998A" className={inputClass} />
              </label>
            </div>
          )}

          <label className="block sm:w-1/2">
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
            <BiField
              label={a.materials}
              he={fields.materials_he ?? ""}
              en={fields.materials ?? ""}
              onHe={(v) => set("materials_he", orNull(v))}
              onEn={(v) => set("materials", orNull(v))}
              placeholder={a.materialsHint}
              className={inputClass}
            />
          )}

          <BiField
            label={a.description}
            multiline
            he={fields.description_he}
            en={fields.description}
            onHe={(v) => set("description_he", v)}
            onEn={(v) => set("description", v)}
            className={inputClass}
          />

          <BiField
            label={L.processLabel}
            multiline
            rows={4}
            he={fields.process_he ?? ""}
            en={fields.process ?? ""}
            onHe={(v) => set("process_he", orNull(v))}
            onEn={(v) => set("process", orNull(v))}
            placeholder={L.processHint}
            className={inputClass}
          />

          <label className="flex items-center gap-3 rounded-xl bg-white p-4">
            <input type="checkbox" checked={fields.published} onChange={(e) => set("published", e.target.checked)} className="h-6 w-6" />
            <span className="text-lg">{a.showOnSite}</span>
          </label>
        </section>

        {error && <p role="alert" className="mb-4 rounded-xl bg-red-100 p-4 text-red-900">{error}</p>}

        <div className="flex gap-3">
          <button disabled={saving} className="flex-1 rounded-xl bg-green-700 py-4 text-xl font-bold text-white hover:bg-green-800 disabled:opacity-60">
            {saving ? (progress && progress[0] < progress[1] ? a.uploading(progress[0] + 1, progress[1]) : a.saving) : a.save}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border-2 border-stone-300 px-6 text-lg">
            {a.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}
