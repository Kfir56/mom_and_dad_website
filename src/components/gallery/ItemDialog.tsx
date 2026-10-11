"use client";

import type { Ref } from "react";
import { t } from "@/lib/i18n";
import type { Item, Lang, Side } from "@/lib/types";
import { PieceDetails } from "@/components/piece/PieceDetails";

type Props = { ref: Ref<HTMLDialogElement>; lang: Lang; side: Side; item: Item | null; ownerName: string; categoryName?: string; related?: Item[]; onPickRelated?: (item: Item) => void };

/** Pop-up with full details for one piece. */
export function ItemDialog({ ref, lang, side, item, ownerName, categoryName, related, onPickRelated }: Props) {
  return (
    <dialog
      ref={ref}
      data-side={side}
      dir={lang === "he" ? "rtl" : "ltr"}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      onClose={(e) => e.currentTarget.querySelectorAll("video, audio").forEach((m) => (m as HTMLMediaElement).pause())}
      className="m-auto max-h-[92svh] w-[min(64rem,94vw)] overflow-y-auto rounded-2xl bg-[var(--side-bg)] p-0 text-[var(--side-fg)] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <form method="dialog" className="sticky top-0 z-10 h-0">
        <button aria-label={t(lang).close} className="absolute end-3 top-3 rounded-full bg-black/40 px-3 py-1 text-2xl leading-none text-white hover:bg-black/60">
          ×
        </button>
      </form>
      {/* Keyed by item so the media viewer resets for each piece. */}
      {item && <PieceDetails key={item.id} lang={lang} item={item} ownerName={ownerName} categoryName={categoryName} related={related} onPickRelated={onPickRelated} />}
    </dialog>
  );
}
