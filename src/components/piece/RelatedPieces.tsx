"use client";

import Link from "next/link";
import { pick, t } from "@/lib/i18n";
import type { Item, Lang } from "@/lib/types";
import { coverOf, ItemImage } from "@/components/gallery/ItemImage";

/** "More like this": a few other pieces. In the gallery pop-up they swap the open piece; on a piece page they link. */
export function RelatedPieces({ lang, items, onPick }: { lang: Lang; items: Item[]; onPick?: (item: Item) => void }) {
  const d = t(lang);
  if (items.length === 0) return null;
  return (
    <section className="border-t border-[var(--side-border)] p-6 md:p-8">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--side-muted)]">{d.related}</h3>
      <ul className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const title = pick(lang, item.title, item.title_he);
          const cover = coverOf(item);
          const card = (
            <>
              <span className="relative block aspect-[4/3] overflow-hidden rounded-lg">
                <ItemImage path={cover.path} kind={cover.kind} alt="" side={item.side} seed={item.id} sizes="(min-width:768px) 20vw, 30vw" className="transition duration-300 group-hover:scale-105" />
              </span>
              <span className="mt-1.5 block truncate text-sm font-medium">{title}</span>
            </>
          );
          return (
            <li key={item.id}>
              {onPick ? (
                <button type="button" onClick={() => onPick(item)} className="group block w-full text-start">
                  {card}
                </button>
              ) : (
                <Link href={`/${lang}/piece/${item.id}`} className="group block">
                  {card}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
