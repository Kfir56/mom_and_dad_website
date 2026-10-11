"use client";

import { useEffect, useRef, useState } from "react";
import { pick, t } from "@/lib/i18n";
import { recordSideVisit } from "@/lib/visitor";
import type { Lang, Portfolio, Side } from "@/lib/types";
import { LanguageSwitch } from "./LanguageSwitch";
import { SplitScreenSlider, type Pane } from "./hero/SplitScreenSlider";
import { InbarBackground, InbarContent } from "./hero/InbarHero";
import { EliBackground, EliContent } from "./hero/EliHero";
import { SideSection } from "./SideSection";

const PANE_TO_SIDE: Record<Pane, Side> = { left: "inbar", right: "eli" };
const SIDE_TO_PANE: Record<Side, Pane> = { inbar: "left", eli: "right" };

export function HomeExperience({ lang, portfolio }: { lang: Lang; portfolio: Portfolio }) {
  const d = t(lang);
  const [selected, setSelected] = useState<Pane | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const side = selected ? PANE_TO_SIDE[selected] : null;
  const { inbar, eli } = portfolio;
  const nameOf = (s: Side) => pick(lang, portfolio[s].profile.display_name, portfolio[s].profile.display_name_he);

  // "/he#eli" (e.g. the back link on a piece page) opens that side and jumps to its gallery.
  useEffect(() => {
    let frame = 0;
    const openFromHash = () => {
      const fromHash = window.location.hash.slice(1);
      if (fromHash !== "inbar" && fromHash !== "eli") return;
      recordSideVisit(fromHash);
      frame = requestAnimationFrame(() => {
        setSelected(SIDE_TO_PANE[fromHash]);
        requestAnimationFrame(() => sectionRef.current?.scrollIntoView());
      });
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, []);

  const select = (pane: Pane | null) => {
    setSelected(pane);
    if (pane) recordSideVisit(PANE_TO_SIDE[pane]);
    // Keep the address shareable and make the back link land on the same side.
    history.replaceState(null, "", pane ? `#${PANE_TO_SIDE[pane]}` : window.location.pathname);
  };

  return (
    <main>
      <div className="relative">
        <LanguageSwitch lang={lang} className="absolute end-4 top-4 z-50" />
        <SplitScreenSlider
          selected={selected}
          onSelect={select}
          labels={{ open: d.openPane, slider: d.sliderLabel }}
          left={{
            label: d.inbarPaneLabel(nameOf("inbar")),
            background: <InbarBackground profile={inbar.profile} />,
            content: (share) => <InbarContent profile={inbar.profile} share={share} lang={lang} />,
          }}
          right={{
            label: d.eliPaneLabel(nameOf("eli")),
            background: <EliBackground profile={eli.profile} />,
            content: (share) => <EliContent profile={eli.profile} share={share} lang={lang} />,
          }}
        />

        {side && (
          <button
            type="button"
            onClick={() => sectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            className={`absolute bottom-8 left-1/2 z-40 -translate-x-1/2 animate-bounce rounded-full px-5 py-2 text-sm font-semibold shadow-lg ${
              side === "inbar" ? "bg-[#2b1638] text-white" : "bg-[#ffb347] font-mono uppercase tracking-wider text-[#1f140c]"
            }`}
          >
            {d.scrollToExplore}
          </button>
        )}
      </div>

      <div ref={sectionRef}>
        {side ? (
          <SideSection
            key={side}
            lang={lang}
            data={portfolio[side]}
            otherName={nameOf(side === "inbar" ? "eli" : "inbar")}
            onSwitch={() => {
              select(side === "inbar" ? "right" : "left");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
