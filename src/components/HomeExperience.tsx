"use client";

import { useRef, useState } from "react";
import type { Portfolio, Side } from "@/lib/types";
import { SplitScreenSlider, type Pane } from "./hero/SplitScreenSlider";
import { InbarBackground, InbarContent } from "./hero/InbarHero";
import { EliBackground, EliContent } from "./hero/EliHero";
import { SideSection } from "./SideSection";

const PANE_TO_SIDE: Record<Pane, Side> = { left: "inbar", right: "eli" };

export function HomeExperience({ portfolio }: { portfolio: Portfolio }) {
  const [selected, setSelected] = useState<Pane | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const side = selected ? PANE_TO_SIDE[selected] : null;
  const { inbar, eli } = portfolio;

  return (
    <main>
      <div className="relative">
        <SplitScreenSlider
          selected={selected}
          onSelect={setSelected}
          left={{
            label: `${inbar.profile.display_name}'s art`,
            background: <InbarBackground profile={inbar.profile} />,
            content: (share) => <InbarContent profile={inbar.profile} share={share} />,
          }}
          right={{
            label: `${eli.profile.display_name}'s radios`,
            background: <EliBackground profile={eli.profile} />,
            content: (share) => <EliContent profile={eli.profile} share={share} />,
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
            Scroll to explore ↓
          </button>
        )}
      </div>

      <div ref={sectionRef}>
        {side ? (
          <SideSection key={side} data={portfolio[side]} otherName={portfolio[side === "inbar" ? "eli" : "inbar"].profile.display_name} onSwitch={() => {
            setSelected(side === "inbar" ? "right" : "left");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }} />
        ) : null}
      </div>
    </main>
  );
}
