"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

/** Share a piece's page: native share sheet on phones, WhatsApp, or copy the link. */
export function ShareButtons({ lang, path, title, onShare }: { lang: Lang; path: string; title: string; onShare?: () => void }) {
  const d = t(lang);
  const [copied, setCopied] = useState(false);
  const url = () => new URL(path, window.location.origin).toString();

  const btn = "rounded-full border border-[var(--side-border)] px-3 py-1.5 text-sm font-medium hover:border-[var(--side-accent)]";
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={btn}
        onClick={async () => {
          onShare?.();
          if (navigator.share) {
            await navigator.share({ title, url: url() }).catch(() => {});
          } else {
            await navigator.clipboard.writeText(url());
            setCopied(true);
          }
        }}
      >
        {d.share}
      </button>
      <button type="button" className={btn} onClick={() => { onShare?.(); window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`, "_blank", "noopener"); }}>
        {d.shareWhatsApp}
      </button>
      <button
        type="button"
        className={btn}
        onClick={async () => {
          onShare?.();
          await navigator.clipboard.writeText(url());
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }}
      >
        {copied ? d.linkCopied : d.copyLink}
      </button>
    </div>
  );
}
