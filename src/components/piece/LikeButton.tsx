"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getLikeState, setLike } from "@/lib/visitor";
import type { Lang } from "@/lib/types";

/** A heart with a live total. One like per browser; tap again to take it back. */
export function LikeButton({ lang, itemId }: { lang: Lang; itemId: string }) {
  const d = t(lang);
  const [state, setState] = useState<{ count: number; liked: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getLikeState(itemId).then((s) => !cancelled && s && setState(s));
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  if (!isSupabaseConfigured) return null;
  const liked = state?.liked ?? false;
  const count = state?.count ?? 0;

  return (
    <button
      type="button"
      aria-pressed={liked}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const next = !liked;
        setState({ count: Math.max(0, count + (next ? 1 : -1)), liked: next }); // optimistic
        const total = await setLike(itemId, next);
        setState(total === null ? { count, liked } : { count: total, liked: next });
        setBusy(false);
      }}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        liked
          ? "border-transparent bg-[var(--side-accent)] text-[var(--side-bg)]"
          : "border-[var(--side-border)] hover:border-[var(--side-accent)]"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {liked ? d.liked : d.like}
      {count > 0 && <span className="opacity-80">· {d.likesCount(count)}</span>}
    </button>
  );
}
