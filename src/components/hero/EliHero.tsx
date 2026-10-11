import Image from "next/image";
import type { Lang, SideProfile } from "@/lib/types";
import { dirOf, pick, t } from "@/lib/i18n";
import { photoUrl } from "@/lib/supabase";

/** Dad's side: walnut cabinet, grille cloth, a glowing tuning dial. */
export function EliBackground({ profile }: { profile: SideProfile }) {
  const hero = photoUrl(profile.hero_image);
  return (
    <div className="eli-wood absolute inset-0 overflow-hidden">
      {hero && <Image src={hero} alt="" fill priority sizes="100vw" className="object-cover opacity-35" />}
      <div aria-hidden className="eli-grille absolute inset-x-[6%] bottom-[8%] top-[56%] rounded-[2.5rem] border-[10px] border-[#3b2414] shadow-[inset_0_0_60px_rgba(0,0,0,.6)]" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,170,60,.18),transparent_60%)]" />
    </div>
  );
}

const FREQS = [530, 600, 700, 800, 1000, 1200, 1400, 1600];

export function EliContent({ profile, share, lang }: { profile: SideProfile; share: number; lang: Lang }) {
  const d = t(lang);
  const visible = share > 0.18;
  // The needle sweeps across the dial as Eli's side opens up.
  const needle = 6 + share * 88;
  return (
    <div
      dir={dirOf(lang)}
      className="flex h-full flex-col items-center justify-center px-6 text-center text-[#f6e7c8]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms ease" }}
    >
      <p className="font-mono text-[clamp(.6rem,1.8cqw,.875rem)] uppercase tracking-[0.4em] text-[#ffb347]/90">{d.eliKicker}</p>
      <h1
        className="font-retro mt-2 text-[clamp(3rem,22cqw,13rem)] leading-none text-[#ffcf7a] drop-shadow-[0_0_30px_rgba(255,170,60,.55)]"
      >
        {pick(lang, profile.display_name, profile.display_name_he)}
      </h1>
      <p className="mt-3 max-w-sm text-[clamp(.95rem,3.4cqw,1.25rem)]">{pick(lang, profile.tagline, profile.tagline_he)}</p>

      {/* tuning dial */}
      <div dir="ltr" className="relative mt-8 w-[min(34rem,88%)] rounded-lg border-2 border-[#c9a46a] bg-[linear-gradient(#1d120a,#2a1a0e)] px-4 py-3 shadow-[0_0_40px_rgba(255,170,60,.25),inset_0_0_20px_rgba(0,0,0,.8)]">
        <div className="flex justify-between font-mono text-[clamp(7px,1.6cqw,12px)] text-[#ffcf7a]/80">
          {FREQS.map((f, i) => (
            <span key={f} className={i % 2 ? "@max-md:hidden" : undefined}>
              {f}
            </span>
          ))}
        </div>
        <div className="mt-1 h-2 bg-[repeating-linear-gradient(90deg,#ffcf7a55_0_1px,transparent_1px_8px)]" />
        <div
          aria-hidden
          className="absolute inset-y-1 w-[3px] rounded bg-[#ff4d2e] shadow-[0_0_10px_#ff4d2e]"
          style={{ left: `${needle}%`, transition: "left 250ms ease-out" }}
        />
      </div>
      <p className="mt-6 font-mono text-xs uppercase tracking-widest text-[#f6e7c8]/70" style={{ opacity: share > 0.55 && share < 0.98 ? 1 : 0 }}>
        {d.eliHint}
      </p>
    </div>
  );
}
