"use client";

import { useState, type Ref } from "react";
import type { Item, Side } from "@/lib/types";
import { ItemImage } from "./ItemImage";

type Props = { ref: Ref<HTMLDialogElement>; side: Side; item: Item | null; categoryName?: string };

/** Full details for one piece, with all its photos. */
export function ItemDialog({ ref, side, item, categoryName }: Props) {
  return (
    <dialog
      ref={ref}
      data-side={side}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      className="m-auto max-h-[92svh] w-[min(64rem,94vw)] overflow-y-auto rounded-2xl bg-[var(--side-bg)] p-0 text-[var(--side-fg)] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      {/* Keyed by item so the photo index resets for each piece. */}
      {item && <DialogBody key={item.id} side={side} item={item} categoryName={categoryName} />}
    </dialog>
  );
}

function DialogBody({ side, item, categoryName }: { side: Side; item: Item; categoryName?: string }) {
  const photos = [
    ...(item.cover_path ? [{ id: "cover", path: item.cover_path, caption: "" }] : []),
    ...item.item_photos,
  ];
  const [index, setIndex] = useState(0);
  const current = photos[index] ?? null;

  const facts: [string, string | number | null][] =
    side === "inbar"
      ? [["Category", categoryName ?? null], ["Materials", item.materials], ["Year", item.year]]
      : [["Manufacturer", item.manufacturer], ["Model", item.model], ["Year", item.year], ["Type", categoryName ?? null]];

  return (
    <div className="grid md:grid-cols-[3fr_2fr]">
      <div className="bg-black/20">
        <div className="relative aspect-[4/3]">
          <ItemImage path={current?.path ?? null} alt={item.title} side={side} seed={item.id} sizes="(min-width:768px) 60vw, 94vw" className="!object-contain" />
        </div>
        {current?.caption && <p className="px-4 pt-2 text-sm text-[var(--side-muted)]">{current.caption}</p>}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 ${i === index ? "border-[var(--side-accent)]" : "border-transparent opacity-70"}`}
              >
                <ItemImage path={p.path} alt="" side={side} seed={p.id} sizes="80px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative p-6 md:p-8">
        <form method="dialog">
          <button aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 text-2xl leading-none hover:bg-black/10">
            ×
          </button>
        </form>
        <h2 className={side === "inbar" ? "font-display pr-8 text-3xl font-bold italic" : "font-retro pr-8 text-3xl text-[var(--side-accent)]"}>
          {item.title}
        </h2>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {facts
            .filter(([, v]) => v !== null && v !== "")
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className={`text-[var(--side-muted)] ${side === "eli" ? "font-mono uppercase text-xs leading-5" : ""}`}>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>
        {item.description && <p className="mt-5 whitespace-pre-line leading-relaxed">{item.description}</p>}
        {item.process && (
          <div className="mt-5 border-l-4 border-[var(--side-accent)] pl-4">
            <h3 className={`mb-1 text-sm font-semibold ${side === "eli" ? "font-mono uppercase tracking-wider" : "font-hand text-xl"}`}>
              {side === "inbar" ? "How it was made" : "Restoration work"}
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed">{item.process}</p>
          </div>
        )}
      </div>
    </div>
  );
}
