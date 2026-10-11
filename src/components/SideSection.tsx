import { formatDate, pick, t } from "@/lib/i18n";
import { photoUrl } from "@/lib/supabase";
import type { Lang, Post, Side, SidePortfolio } from "@/lib/types";
import Image from "next/image";
import { Gallery } from "./gallery/Gallery";
import { ContactForm } from "./piece/ContactForm";

type Props = { lang: Lang; data: SidePortfolio; otherName: string; onSwitch: () => void };

/** About, gallery, news and contact for whichever parent was chosen in the hero. */
export function SideSection({ lang, data, otherName, onSwitch }: Props) {
  const d = t(lang);
  const { profile, categories, items, posts } = data;
  const side = profile.side;
  const isInbar = side === "inbar";
  const name = pick(lang, profile.display_name, profile.display_name_he);

  return (
    <section id={side} data-side={side} className="min-h-svh bg-[var(--side-bg)] text-[var(--side-fg)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <header className="mx-auto mb-14 max-w-2xl text-center">
          {isInbar ? (
            <>
              <p className="font-hand text-2xl text-[var(--side-accent)]">{d.inbarSectionKicker}</p>
              <h2 className="font-display text-5xl font-black italic sm:text-6xl">{name}</h2>
            </>
          ) : (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.4em] text-[var(--side-accent)]">{d.eliSectionKicker}</p>
              <h2 className="font-retro text-5xl text-[var(--side-accent)] sm:text-6xl">{name}</h2>
            </>
          )}
          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-[var(--side-muted)]">
            {pick(lang, profile.bio, profile.bio_he)}
          </p>
        </header>

        <Gallery lang={lang} side={side} ownerName={name} categories={categories} items={items} />

        {posts.length > 0 && <News lang={lang} side={side} posts={posts} />}

        <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-[var(--side-border)] bg-[var(--side-card)]/40 p-6 text-center">
          <ContactForm lang={lang} side={side} ownerName={name} title={d.askGeneral(name)} />
        </div>

        <div className="mt-16 text-center">
          <button
            type="button"
            onClick={onSwitch}
            className="rounded-full border-2 border-[var(--side-accent)] px-6 py-3 font-semibold transition hover:bg-[var(--side-accent)] hover:text-[var(--side-bg)]"
          >
            {d.visitOther(side, otherName)}
          </button>
        </div>
      </div>
    </section>
  );
}

function News({ lang, side, posts }: { lang: Lang; side: Side; posts: Post[] }) {
  const d = t(lang);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mt-24">
      <h2
        className={`mb-8 text-center ${side === "inbar" ? "font-display text-4xl font-bold italic" : "font-retro text-4xl text-[var(--side-accent)]"}`}
      >
        {d.news(side)}
      </h2>
      <ul className="mx-auto grid max-w-4xl gap-6">
        {posts.map((post) => {
          const image = photoUrl(post.image_path);
          const upcoming = post.event_date && post.event_date >= today;
          const body = pick(lang, post.body, post.body_he);
          return (
            <li
              key={post.id}
              className={`grid overflow-hidden bg-[var(--side-card)] sm:grid-cols-[14rem_1fr] ${side === "inbar" ? "rounded-2xl" : "rounded-md border border-[var(--side-border)]"}`}
            >
              {image && (
                <div className="relative aspect-[4/3] sm:aspect-auto">
                  <Image src={image} alt="" fill sizes="(min-width:640px) 14rem, 100vw" className="object-cover" />
                </div>
              )}
              <div className={`p-5 ${image ? "" : "sm:col-span-2"}`}>
                <p className={`flex flex-wrap items-center gap-2 text-sm text-[var(--side-muted)] ${side === "eli" ? "font-mono uppercase tracking-wider" : ""}`}>
                  {upcoming && (
                    <span className="rounded-full bg-[var(--side-accent)] px-2 py-0.5 text-xs font-bold text-[var(--side-bg)]">{d.upcoming}</span>
                  )}
                  {post.event_date && <time dateTime={post.event_date}>{formatDate(lang, post.event_date)}</time>}
                  {post.event_date && post.location && <span aria-hidden>·</span>}
                  {post.location && <span>{post.location}</span>}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{pick(lang, post.title, post.title_he)}</h3>
                {body && <p className="mt-2 whitespace-pre-line leading-relaxed">{body}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
