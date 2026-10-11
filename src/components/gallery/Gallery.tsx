"use client";

import { useMemo, useRef, useState } from "react";
import { pick, t } from "@/lib/i18n";
import { matchesQuery, relatedItems, sortItems, type SortKey } from "@/lib/gallery-tools";
import type { Category, Item, Lang, Side } from "@/lib/types";
import { coverOf, ItemImage } from "./ItemImage";
import { ItemDialog } from "./ItemDialog";

type Props = { lang: Lang; side: Side; ownerName: string; categories: Category[]; items: Item[] };

export function Gallery({ lang, side, ownerName, categories, items }: Props) {
  const d = t(lang);
  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [openItem, setOpenItem] = useState<Item | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Only offer categories that actually have pieces in them.
  const usedCategories = useMemo(
    () => categories.filter((c) => items.some((i) => i.category_id === c.id)),
    [categories, items],
  );
  const categoryName = (id: string | null) => {
    const c = categories.find((c) => c.id === id);
    return c ? pick(lang, c.name, c.name_he) : undefined;
  };
  const shown = useMemo(
    () =>
      sortItems(
        items.filter((i) => (!filter || i.category_id === filter) && matchesQuery(i, categories, query)),
        sort,
        lang,
      ),
    [items, categories, filter, query, sort, lang],
  );
  const sortNames: Record<SortKey, string> = {
    featured: d.sortFeatured,
    newest: d.sortNewest,
    oldest: d.sortOldest,
    year: d.sortYear,
    az: d.sortAz,
  };
  const field = "rounded-full border border-[var(--side-border)] bg-[var(--side-card)] px-4 py-2 text-sm text-[var(--side-fg)] outline-none focus:border-[var(--side-accent)]";

  const open = (item: Item) => {
    setOpenItem(item);
    const dialog = dialogRef.current;
    dialog?.showModal();
    // Start at the top: focusing the close button can scroll the pop-up a little.
    requestAnimationFrame(() => dialog?.scrollTo({ top: 0 }));
  };

  if (items.length === 0) {
    return <p className="py-16 text-center text-[var(--side-muted)]">{d.emptyGallery}</p>;
  }

  return (
    <>
      {items.length > 1 && (
        <div className="mx-auto mb-6 flex max-w-2xl flex-wrap items-center justify-center gap-3">
          <div className="relative min-w-0 flex-1 basis-56">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={d.searchPlaceholder}
              aria-label={d.searchLabel}
              className={`${field} w-full pe-10`}
            />
            {query && (
              <button type="button" aria-label={d.clearSearch} onClick={() => setQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-lg leading-none text-[var(--side-muted)] hover:text-[var(--side-fg)]">
                ×
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--side-muted)]">
            {d.sortLabel}
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={field}>
              {(Object.keys(sortNames) as SortKey[]).map((k) => (
                <option key={k} value={k}>{sortNames[k]}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {usedCategories.length > 1 && (
        <div role="toolbar" aria-label={d.filterLabel} className="mb-8 flex flex-wrap justify-center gap-2">
          {[{ id: null, name: d.all, name_he: d.all }, ...usedCategories].map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(c.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-transparent bg-[var(--side-accent)] text-[var(--side-bg)]"
                    : "border-[var(--side-border)] text-[var(--side-fg)] hover:border-[var(--side-accent)]"
                } ${side === "eli" ? "font-mono uppercase tracking-wider" : ""}`}
              >
                {pick(lang, c.name, c.name_he)}
              </button>
            );
          })}
        </div>
      )}

      {shown.length === 0 && <p className="py-12 text-center text-[var(--side-muted)]">{d.noResults}</p>}

      <ul className="columns-1 gap-6 sm:columns-2 lg:columns-3">
        {shown.map((item, idx) => {
          const title = pick(lang, item.title, item.title_he);
          const cover = coverOf(item);
          const materials = pick(lang, item.materials, item.materials_he);
          return (
          <li key={item.id} className="mb-6 break-inside-avoid">
            <button
              type="button"
              onClick={() => open(item)}
              className={`group block w-full overflow-hidden text-start transition duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--side-accent)] ${
                side === "inbar"
                  ? "rounded-2xl bg-[var(--side-card)] p-3 shadow-[0_10px_30px_-12px_rgba(123,44,191,.35)] hover:rotate-0"
                  : "rounded-md border border-[var(--side-border)] bg-[var(--side-card)] shadow-[0_10px_30px_-10px_rgba(0,0,0,.7)]"
              }`}
              style={side === "inbar" ? { rotate: `${idx % 2 ? 0.8 : -0.8}deg` } : undefined}
            >
              <div className={`relative overflow-hidden ${side === "inbar" ? "rounded-xl" : ""} ${idx % 3 === 1 ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
                <ItemImage
                  path={cover.path}
                  kind={cover.kind}
                  alt={title}
                  side={side}
                  seed={item.id}
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="transition duration-500 group-hover:scale-105"
                />
                <MediaBadges item={item} />
              </div>
              {side === "inbar" ? (
                <div className="px-1 pb-1 pt-3">
                  <p className="font-hand text-lg text-[var(--side-accent)]">{categoryName(item.category_id)}</p>
                  <h3 className="font-display text-xl font-bold italic">{title}</h3>
                  {materials && <p className="mt-1 text-sm text-[var(--side-muted)]">{materials}</p>}
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-retro text-xl text-[var(--side-accent)]">{title}</h3>
                    {item.year && <span className="rounded bg-[var(--side-accent)] px-2 py-0.5 font-mono text-xs font-bold text-[#1f140c]">{item.year}</span>}
                  </div>
                  <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[var(--side-muted)]">
                    {[item.manufacturer, item.model].filter(Boolean).join(" · ")}
                  </p>
                </div>
              )}
            </button>
          </li>
          );
        })}
      </ul>

      <ItemDialog
        ref={dialogRef}
        lang={lang}
        side={side}
        ownerName={ownerName}
        item={openItem}
        related={openItem ? relatedItems(openItem, items) : []}
        onPickRelated={(i) => {
          setOpenItem(i);
          dialogRef.current?.scrollTo({ top: 0 });
        }} categoryName={categoryName(openItem?.category_id ?? null)} />
    </>
  );
}

/** Little corner icons for pieces that have more than photos. */
function MediaBadges({ item }: { item: Item }) {
  const badges = [
    item.before_path && item.cover_path ? "⇆" : null,
    item.video_url || item.item_photos.some((p) => p.kind === "video") ? "▶" : null,
    item.audio_path ? "♪" : null,
  ].filter(Boolean);
  if (!badges.length) return null;
  return (
    <span aria-hidden className="absolute end-2 top-2 flex gap-1">
      {badges.map((b) => (
        <span key={b} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-sm text-white backdrop-blur">
          {b}
        </span>
      ))}
    </span>
  );
}
