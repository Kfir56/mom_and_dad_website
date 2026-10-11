"use client";

import type { ReactNode } from "react";

type Props = {
  /** True while the sound is playing: the knob turns, the lamp glows, the button sits "pushed in". */
  on: boolean;
  onToggle: () => void;
  label: ReactNode;
  /** Accessible name; defaults to the visible label. */
  ariaLabel?: string;
  size?: "md" | "lg";
  className?: string;
};

/** A chunky radio push-knob with a pilot lamp. Colours follow --side-accent when inside a side, else warm amber. */
export function RadioKnob({ on, onToggle, label, ariaLabel, size = "md", className = "" }: Props) {
  const px = size === "lg" ? "h-20 w-20" : "h-16 w-16";
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={ariaLabel}
      onClick={onToggle}
      className={`group pointer-events-auto inline-flex items-center gap-4 rounded-full py-1 pe-5 ps-1 text-start focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--side-accent,#ffb347)]/60 ${className}`}
    >
      <span
        className={`relative flex ${px} shrink-0 items-center justify-center rounded-full border-2 border-black/60 transition-all duration-150 ${
          on
            ? "translate-y-[2px] shadow-[inset_0_3px_8px_rgba(0,0,0,.8),0_1px_0_rgba(255,255,255,.2)]"
            : "shadow-[0_5px_0_rgba(0,0,0,.55),0_10px_18px_rgba(0,0,0,.5)] group-hover:-translate-y-[1px]"
        }`}
        style={{
          background: "radial-gradient(circle at 35% 28%, #7a4a2a 0%, #3b2112 55%, #1c0f08 100%)",
        }}
      >
        {/* grip ridges */}
        <span
          aria-hidden
          className="absolute inset-[5px] rounded-full"
          style={{
            background: "repeating-conic-gradient(rgba(255,255,255,.10) 0 4deg, rgba(0,0,0,.18) 4deg 12deg)",
            transform: on ? "rotate(55deg)" : "rotate(0deg)",
            transition: "transform 400ms cubic-bezier(.22,1,.36,1)",
          }}
        />
        {/* brass centre with pointer */}
        <span
          aria-hidden
          className="relative flex h-[58%] w-[58%] items-start justify-center rounded-full border border-black/50"
          style={{
            background: "radial-gradient(circle at 35% 30%, #f6d98f, #b8893a 60%, #6e4b17)",
            transform: on ? "rotate(55deg)" : "rotate(0deg)",
            transition: "transform 400ms cubic-bezier(.22,1,.36,1)",
          }}
        >
          <span className="mt-[3px] h-[38%] w-[3px] rounded bg-[#2a1a0e]" />
        </span>
      </span>
      <span className="flex flex-col gap-1.5 rounded-xl bg-black/55 px-3 py-2 backdrop-blur-sm">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-3 w-3 rounded-full border border-black/40 transition-all duration-300"
            style={{
              background: on ? "radial-gradient(circle at 35% 30%, #fff3c4, #ff9d2e 55%, #b34700)" : "radial-gradient(circle at 35% 30%, #6b5a45, #2c2218)",
              boxShadow: on ? "0 0 12px 3px rgba(255,157,46,.75)" : "none",
            }}
          />
          {on && (
            <span aria-hidden className="flex h-3 items-end gap-[2px]">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="w-[3px] animate-pulse rounded-sm bg-[var(--side-accent,#ffb347)]" style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 120}ms` }} />
              ))}
            </span>
          )}
        </span>
        <span className="font-mono text-sm font-semibold uppercase tracking-wider">{label}</span>
      </span>
    </button>
  );
}
