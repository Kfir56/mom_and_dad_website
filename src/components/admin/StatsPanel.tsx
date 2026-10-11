"use client";

import { pick } from "@/lib/i18n";
import type { AdminData } from "@/lib/admin-api";
import { useAdminLang } from "./AdminLang";

/** Simple counts for the parent: visits, piece views, likes, shares, and which pieces people look at most. */
export function StatsPanel({ data }: { data: AdminData }) {
  const { lang, a } = useAdminLang();
  const sum = (key: "view_count" | "like_count" | "share_count") => data.items.reduce((n, i) => n + i[key], 0);
  const cards: [string, number][] = [
    [a.statVisits, data.profile.visits],
    [a.statViews, sum("view_count")],
    [a.statLikes, sum("like_count")],
    [a.statShares, sum("share_count")],
    [a.statMessages, data.messages.length],
  ];
  const ranked = [...data.items].sort((x, y) => y.view_count - x.view_count || y.like_count - x.like_count);
  const max = Math.max(1, ...ranked.map((i) => i.view_count));
  const nf = new Intl.NumberFormat(lang === "he" ? "he-IL" : "en-GB");

  return (
    <div className="max-w-3xl space-y-8">
      <p className="text-lg text-stone-600">{a.statsIntro}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map(([label, value]) => (
          <li key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-3xl font-bold tabular-nums">{nf.format(value)}</p>
            <p className="mt-1 text-sm text-stone-500">{label}</p>
          </li>
        ))}
      </ul>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{a.topPieces}</h2>
        {ranked.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-stone-500">{a.noStatsYet}</p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-2xl bg-white">
            {ranked.map((item) => (
              <li key={item.id} className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-medium">{pick(lang, item.title, item.title_he)}</p>
                  <p className="shrink-0 text-sm tabular-nums text-stone-500">
                    {a.colViews} {nf.format(item.view_count)} · {a.colLikes} {nf.format(item.like_count)} · {a.colShares} {nf.format(item.share_count)}
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100" aria-hidden>
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#ff5d8f,#7b2cbf)]" style={{ width: `${(item.view_count / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
