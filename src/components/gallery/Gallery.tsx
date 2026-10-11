"use client";

import { useMemo, useRef, useState } from "react";
import type { Category, Item, Side } from "@/lib/types";
import { ItemImage } from "./ItemImage";
import { ItemDialog } from "./ItemDialog";

type Props = { side: Side; categories: Category[]; items: Item[] };

export function Gallery({ side, categories, items }: Props) {
  const [filter, setFilter] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<Item | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Only offer categories that actually have pieces in them.
  const usedCategories = useMemo(
    () => categories.filter((c) => items.some((i) => i.category_id === c.id)),
    [categories, items],
  );
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name;
  const shown = filter ? items.filter((i) => i.category_id === filter) : items;

  const open = (item: Item) => {
    setOpenItem(item);
    dialogRef.current?.showModal();
  };

  if (items.length === 0) {
    return <p className="py-16 text-center text-[var(--side-muted)]">New pieces are on their way.</p>;
  }

  return (
    <>
      {usedCategories.length > 1 && (
        <div role="toolbar" aria-label="Filter by category" className="mb-8 flex flex-wrap justify-center gap-2">
          {[{ id: null, name: "All" }, ...usedCategories].map((c) => {
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
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      <ul className="columns-1 gap-6 sm:columns-2 lg:columns-3">
        {shown.map((item, idx) => (
          <li key={item.id} className="mb-6 break-inside-avoid">
            <button
              type="button"
              onClick={() => open(item)}
              className={`group block w-full overflow-hidden text-left transition duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--side-accent)] ${
                side === "inbar"
                  ? "rounded-2xl bg-[var(--side-card)] p-3 shadow-[0_10px_30px_-12px_rgba(123,44,191,.35)] hover:rotate-0"
                  : "rounded-md border border-[var(--side-border)] bg-[var(--side-card)] shadow-[0_10px_30px_-10px_rgba(0,0,0,.7)]"
              }`}
              style={side === "inbar" ? { rotate: `${idx % 2 ? 0.8 : -0.8}deg` } : undefined}
            >
              <div className={`relative overflow-hidden ${side === "inbar" ? "rounded-xl" : ""} ${idx % 3 === 1 ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
                <ItemImage
                  path={item.cover_path}
                  alt={item.title}
                  side={side}
                  seed={item.id}
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="transition duration-500 group-hover:scale-105"
                />
              </div>
              {side === "inbar" ? (
                <div className="px-1 pb-1 pt-3">
                  <p className="font-hand text-lg text-[var(--side-accent)]">{categoryName(item.category_id)}</p>
                  <h3 className="font-display text-xl font-bold italic">{item.title}</h3>
                  {item.materials && <p className="mt-1 text-sm text-[var(--side-muted)]">{item.materials}</p>}
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-retro text-xl text-[var(--side-accent)]">{item.title}</h3>
                    {item.year && <span className="rounded bg-[var(--side-accent)] px-2 py-0.5 font-mono text-xs font-bold text-[#1f140c]">{item.year}</span>}
                  </div>
                  <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[var(--side-muted)]">
                    {[item.manufacturer, item.model].filter(Boolean).join(" · ")}
                  </p>
                </div>
              )}
            </button>
          </li>
        ))}
      </ul>

      <ItemDialog ref={dialogRef} side={side} item={openItem} categoryName={categoryName(openItem?.category_id ?? null)} />
    </>
  );
}
