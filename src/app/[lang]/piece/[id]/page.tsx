import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { PieceDetails } from "@/components/piece/PieceDetails";
import { coverOf } from "@/components/gallery/ItemImage";
import { isLang, pick, t } from "@/lib/i18n";
import { getItem, getPortfolio } from "@/lib/portfolio";
import { photoUrl } from "@/lib/supabase";
import type { Lang } from "@/lib/types";

// Every published piece is prerendered; new ones render on first visit and are then cached.
export async function generateStaticParams() {
  const { inbar, eli } = await getPortfolio();
  const ids = [...inbar.items, ...eli.items].map((item) => ({ id: item.id }));
  // Cache Components needs at least one entry to check the route at build time.
  return ids.length ? ids : [{ id: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/piece/[id]">): Promise<Metadata> {
  const { lang: rawLang, id } = await params;
  const lang: Lang = isLang(rawLang) ? rawLang : "he";
  const found = await getItem(id);
  if (!found) return { title: t(lang).notFound };

  const { item, side } = found;
  const name = pick(lang, side.profile.display_name, side.profile.display_name_he);
  const title = `${pick(lang, item.title, item.title_he)} · ${name}`;
  const description = pick(lang, item.description, item.description_he).slice(0, 200) || pick(lang, side.profile.tagline, side.profile.tagline_he);
  // WhatsApp, Facebook etc. show this photo in the link preview.
  const cover = coverOf(item);
  const image = cover.kind === "image" ? photoUrl(cover.path) : null;
  return {
    title,
    description,
    alternates: { languages: { he: `/he/piece/${id}`, en: `/en/piece/${id}` } },
    openGraph: { title, description, type: "article", locale: lang === "he" ? "he_IL" : "en_US", ...(image && { images: [{ url: image }] }) },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default function PiecePage(props: PageProps<"/[lang]/piece/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-neutral-900" />}>
      <Piece params={props.params} />
    </Suspense>
  );
}

async function Piece({ params }: Pick<PageProps<"/[lang]/piece/[id]">, "params">) {
  const { lang: rawLang, id } = await params;
  const lang: Lang = isLang(rawLang) ? rawLang : "he";
  const d = t(lang);
  const found = await getItem(id);

  if (!found) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-neutral-900 p-6 text-center text-white">
        <p className="text-xl">{d.notFound}</p>
        <Link href={`/${lang}`} className="underline underline-offset-4">
          {lang === "he" ? "לעמוד הבית" : "Go to the home page"}
        </Link>
      </main>
    );
  }

  const { item, side } = found;
  const name = pick(lang, side.profile.display_name, side.profile.display_name_he);
  const category = side.categories.find((c) => c.id === item.category_id);

  return (
    <main data-side={item.side} className="min-h-svh bg-[var(--side-bg)] text-[var(--side-fg)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <nav className="mb-6 flex items-center justify-between gap-4">
          <Link href={`/${lang}#${item.side}`} className={`font-semibold hover:underline ${item.side === "eli" ? "font-mono text-sm uppercase tracking-wider" : ""}`}>
            {d.backToGallery(name)}
          </Link>
          <LanguageSwitch lang={lang} />
        </nav>
        <article className={`overflow-hidden bg-[var(--side-card)]/40 ${item.side === "inbar" ? "rounded-3xl" : "rounded-md border border-[var(--side-border)]"}`}>
          <PieceDetails lang={lang} item={item} ownerName={name} categoryName={category ? pick(lang, category.name, category.name_he) : undefined} />
        </article>
      </div>
    </main>
  );
}
