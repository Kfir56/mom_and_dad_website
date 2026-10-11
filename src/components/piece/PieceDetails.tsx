"use client";

import Link from "next/link";
import { useState } from "react";
import { pick, t } from "@/lib/i18n";
import { photoUrl } from "@/lib/supabase";
import { embedUrl } from "@/lib/video";
import type { Item, Lang, MediaKind } from "@/lib/types";
import { ItemImage } from "@/components/gallery/ItemImage";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { ContactForm } from "./ContactForm";
import { ShareButtons } from "./ShareButtons";

type Props = {
  lang: Lang;
  item: Item;
  ownerName: string;
  categoryName?: string;
  /** In the gallery pop-up, link to the piece's own page. */
  showPageLink?: boolean;
};

type Media = { id: string; path: string; caption: string; kind: MediaKind };

/** Everything about one piece: photos, videos, before/after, sound, details, share and contact. */
export function PieceDetails({ lang, item, ownerName, categoryName, showPageLink }: Props) {
  const d = t(lang);
  const side = item.side;
  const title = pick(lang, item.title, item.title_he);
  const pagePath = `/${lang}/piece/${item.id}`;

  const media: Media[] = [
    ...(item.cover_path ? [{ id: "cover", path: item.cover_path, caption: "", kind: "image" as const }] : []),
    ...item.item_photos,
  ];
  const before = photoUrl(item.before_path);
  const after = photoUrl(item.cover_path);
  const video = embedUrl(item.video_url);
  const audio = photoUrl(item.audio_path);

  // The first view is the before/after comparison when there is one.
  const [view, setView] = useState<"compare" | number>(before && after ? "compare" : 0);
  const current = typeof view === "number" ? media[view] : null;

  const facts: [string, string | number | null][] =
    side === "inbar"
      ? [
          [d.category, categoryName ?? null],
          [d.materials, pick(lang, item.materials, item.materials_he) || null],
          [d.year, item.year],
        ]
      : [
          [d.manufacturer, item.manufacturer],
          [d.model, item.model],
          [d.year, item.year],
          [d.type, categoryName ?? null],
        ];
  const description = pick(lang, item.description, item.description_he);
  const process = pick(lang, item.process, item.process_he);

  const thumb = "relative h-16 w-20 shrink-0 overflow-hidden rounded-md border-2";
  return (
    <div className="grid md:grid-cols-[3fr_2fr]">
      <div className="bg-black/20">
        {view === "compare" && before && after ? (
          <BeforeAfterSlider before={before} after={after} beforeLabel={d.before} afterLabel={d.after} alt={title} />
        ) : current?.kind === "video" ? (
          <video key={current.id} src={photoUrl(current.path) ?? undefined} controls playsInline className="aspect-[4/3] w-full bg-black object-contain" />
        ) : (
          <div className="relative aspect-[4/3]">
            <ItemImage path={current?.path ?? null} alt={title} side={side} seed={item.id} sizes="(min-width:768px) 60vw, 94vw" className="!object-contain" />
          </div>
        )}
        {current?.caption && <p className="px-4 pt-2 text-sm text-[var(--side-muted)]">{current.caption}</p>}

        {(media.length > 1 || (before && after)) && (
          <div className="flex gap-2 overflow-x-auto p-3">
            {before && after && (
              <button
                type="button"
                onClick={() => setView("compare")}
                aria-current={view === "compare"}
                className={`${thumb} flex items-center justify-center bg-black/40 text-xs font-semibold text-white ${view === "compare" ? "border-[var(--side-accent)]" : "border-transparent"}`}
              >
                {d.beforeAfter}
              </button>
            )}
            {media.map((m, i) => (
              <button
                key={m.id}
                type="button"
                aria-label={d.photo(i + 1)}
                aria-current={view === i}
                onClick={() => setView(i)}
                className={`${thumb} ${view === i ? "border-[var(--side-accent)]" : "border-transparent opacity-70"}`}
              >
                <ItemImage path={m.path} kind={m.kind} alt="" side={side} seed={m.id} sizes="80px" />
                {m.kind === "video" && <span className="absolute inset-0 flex items-center justify-center text-xl text-white drop-shadow">▶</span>}
              </button>
            ))}
          </div>
        )}

        {video && (
          <div className="aspect-video w-full">
            <iframe
              src={video}
              title={title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}
      </div>

      <div className="space-y-5 p-6 md:p-8">
        <h2 className={side === "inbar" ? "font-display pe-8 text-3xl font-bold italic" : "font-retro pe-8 text-3xl text-[var(--side-accent)]"}>{title}</h2>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {facts
            .filter(([, v]) => v !== null && v !== "")
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className={`text-[var(--side-muted)] ${side === "eli" ? "font-mono text-xs uppercase leading-5" : ""}`}>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>

        {audio && (
          <div>
            <p className={`mb-1 text-sm font-semibold ${side === "eli" ? "font-mono uppercase" : ""}`}>♪ {d.listen}</p>
            <audio src={audio} controls preload="none" className="w-full" />
          </div>
        )}

        {description && <p className="whitespace-pre-line leading-relaxed">{description}</p>}

        {process && (
          <div className="border-s-4 border-[var(--side-accent)] ps-4">
            <h3 className={`mb-1 text-sm font-semibold ${side === "eli" ? "font-mono uppercase tracking-wider" : "font-hand text-xl"}`}>
              {side === "inbar" ? d.howMade : d.restoration}
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed">{process}</p>
          </div>
        )}

        <ShareButtons lang={lang} path={pagePath} title={title} />
        {showPageLink && (
          <Link href={pagePath} className="block w-fit text-sm underline underline-offset-4">
            {d.viewPage}
          </Link>
        )}
        <ContactForm lang={lang} side={side} itemId={item.id} ownerName={ownerName} title={d.ask} />
      </div>
    </div>
  );
}
