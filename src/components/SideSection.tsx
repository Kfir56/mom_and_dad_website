import type { SidePortfolio } from "@/lib/types";
import { Gallery } from "./gallery/Gallery";

type Props = { data: SidePortfolio; otherName: string; onSwitch: () => void };

/** About + gallery for whichever parent was chosen in the hero. */
export function SideSection({ data, otherName, onSwitch }: Props) {
  const { profile, categories, items } = data;
  const isInbar = profile.side === "inbar";

  return (
    <section data-side={profile.side} className="min-h-svh bg-[var(--side-bg)] text-[var(--side-fg)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <header className="mx-auto mb-14 max-w-2xl text-center">
          {isInbar ? (
            <>
              <p className="font-hand text-2xl text-[var(--side-accent)]">the studio of</p>
              <h2 className="font-display text-5xl font-black italic sm:text-6xl">{profile.display_name}</h2>
            </>
          ) : (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.4em] text-[var(--side-accent)]">The workbench of</p>
              <h2 className="font-retro text-5xl text-[var(--side-accent)] sm:text-6xl">{profile.display_name}</h2>
            </>
          )}
          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-[var(--side-muted)]">{profile.bio}</p>
        </header>

        <Gallery side={profile.side} categories={categories} items={items} />

        <div className="mt-20 text-center">
          <button
            type="button"
            onClick={onSwitch}
            className="rounded-full border-2 border-[var(--side-accent)] px-6 py-3 font-semibold transition hover:bg-[var(--side-accent)] hover:text-[var(--side-bg)]"
          >
            {isInbar ? `Now visit ${otherName}'s radios →` : `← Now visit ${otherName}'s art`}
          </button>
        </div>
      </div>
    </section>
  );
}
