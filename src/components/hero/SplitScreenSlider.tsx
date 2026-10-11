"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

export type Pane = "left" | "right";

export type PaneConfig = {
  /** Accessible name, e.g. "Inbar's art". */
  label: string;
  /** Full-bleed background. It stays still while the divider moves. */
  background: ReactNode;
  /**
   * Foreground content. It is laid out in a box exactly as wide as the
   * visible part of the pane (a CSS container, so `cqw` units scale with it).
   * `share` is how much of the screen this pane covers (0..1).
   */
  content: (share: number) => ReactNode;
};

type Props = {
  left: PaneConfig;
  right: PaneConfig;
  /** Which pane is fully open, or null when both are showing. */
  selected: Pane | null;
  onSelect: (pane: Pane | null) => void;
  /** Dragging past this share opens a pane fully. */
  commitAt?: number;
  /** Accessible wording, for translations. */
  labels?: { open: (pane: string) => string; slider: (left: string, right: string) => string };
};

const DEFAULT_LABELS = {
  open: (pane: string) => `Open ${pane}`,
  slider: (a: string, b: string) => `Drag to choose between ${a} and ${b}`,
};

const CLICK_SLOP_PX = 5;
const HOVER_NUDGE = 0.06;
const KEY_STEP = 0.05;

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

/**
 * Full-screen split hero. The divider can be dragged (mouse, touch, pen),
 * moved with the keyboard, or skipped by clicking a side. Pulling it far
 * enough to one side "commits" that side and calls onSelect.
 */
export function SplitScreenSlider({ left, right, selected, onSelect, commitAt = 0.8, labels = DEFAULT_LABELS }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; moved: boolean } | null>(null);

  // Where the divider rests when no pane is selected (0 = all right, 1 = all left).
  const [restPos, setRestPos] = useState(0.5);
  // Live position while the user is dragging.
  const [dragPos, setDragPos] = useState<number | null>(null);
  const [hover, setHover] = useState<Pane | null>(null);

  const dragging = dragPos !== null;
  const basePos = selected === "left" ? 1 : selected === "right" ? 0 : restPos;
  const nudge =
    !dragging && !selected ? (hover === "left" ? HOVER_NUDGE : hover === "right" ? -HOVER_NUDGE : 0) : 0;
  const pos = clamp(dragging ? dragPos : basePos + nudge);

  const posFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0.5;
    return clamp((clientX - rect.left) / rect.width);
  }, []);

  // Decide what a released divider means.
  const settle = useCallback(
    (p: number) => {
      if (p >= commitAt) onSelect("left");
      else if (p <= 1 - commitAt) onSelect("right");
      else {
        setRestPos(p);
        onSelect(null);
      }
    },
    [commitAt, onSelect],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, moved: false };
    setDragPos(pos);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.startX) > CLICK_SLOP_PX) d.moved = true;
    if (d.moved) setDragPos(posFromClientX(e.clientX));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const p = posFromClientX(e.clientX);
    setDragPos(null);
    if (d.moved) {
      settle(p);
    } else if (selected) {
      // A tap on the handle while a side is open brings both sides back.
      setRestPos(0.5);
      onSelect(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, () => void> = {
      ArrowLeft: () => settle(clamp(basePos - KEY_STEP)),
      ArrowRight: () => settle(clamp(basePos + KEY_STEP)),
      Home: () => onSelect("right"),
      End: () => onSelect("left"),
      Escape: () => {
        setRestPos(0.5);
        onSelect(null);
      },
      Enter: () => {
        setRestPos(0.5);
        onSelect(null);
      },
    };
    const action = keys[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  const transition = dragging
    ? "none"
    : "clip-path 700ms cubic-bezier(.22,1,.36,1), transform 700ms cubic-bezier(.22,1,.36,1), left 700ms cubic-bezier(.22,1,.36,1), width 700ms cubic-bezier(.22,1,.36,1), opacity 400ms ease";

  // Content wrappers are full width; shift them so their centre sits in the
  // middle of the visible slice of their pane.
  const leftShift = (pos - 1) * 50;
  const rightShift = pos * 50;

  const paneButton = (pane: Pane, config: PaneConfig, share: number) =>
    selected !== pane && (
      <button
        type="button"
        aria-label={labels.open(config.label)}
        className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-none"
        onClick={() => onSelect(pane)}
        onMouseEnter={() => setHover(pane)}
        onMouseLeave={() => setHover(null)}
        tabIndex={share < 0.02 ? -1 : 0}
      />
    );

  return (
    <div
      ref={containerRef}
      // The geometry is physical (left pane / right pane) in every language.
      dir="ltr"
      className="relative h-svh w-full select-none overflow-hidden bg-black"
      data-dragging={dragging || undefined}
    >
      {/* Right pane sits underneath and is revealed as the left one shrinks. */}
      <section
        aria-label={right.label}
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${pos * 100}%)`, transition }}
      >
        {right.background}
        {paneButton("right", right, 1 - pos)}
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{ transform: `translateX(${rightShift}%)`, transition }}
        >
          <div className="@container mx-auto h-full" style={{ width: `${(1 - pos) * 100}%`, transition }}>
            {right.content(1 - pos)}
          </div>
        </div>
      </section>

      <section
        aria-label={left.label}
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${(1 - pos) * 100}% 0 0)`, transition }}
      >
        {left.background}
        {paneButton("left", left, pos)}
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{ transform: `translateX(${leftShift}%)`, transition }}
        >
          <div className="@container mx-auto h-full" style={{ width: `${pos * 100}%`, transition }}>
            {left.content(pos)}
          </div>
        </div>
      </section>

      {/* The divider and its grab handle. Kept a little inside the edges so it can always be grabbed back. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={labels.slider(left.label, right.label)}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos * 100)}
        aria-valuetext={
          selected === "left" ? `${left.label} open` : selected === "right" ? `${right.label} open` : `${Math.round(pos * 100)}% ${left.label}`
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className="group absolute top-0 z-30 flex h-full w-16 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center focus-visible:outline-none"
        style={{ left: `clamp(28px, ${pos * 100}%, calc(100% - 28px))`, transition }}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white/90 shadow-[0_0_24px_rgba(0,0,0,.45)] transition-opacity"
          style={{ opacity: selected ? 0 : 1 }}
        />
        <span
          aria-hidden
          className="relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-white/15 text-white shadow-[0_8px_30px_rgba(0,0,0,.35)] backdrop-blur-md transition-transform duration-200 group-hover:scale-110 group-focus-visible:ring-4 group-focus-visible:ring-white/70"
          style={dragging ? { transform: "scale(0.94)" } : undefined}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6-6 6 6 6" />
            <path d="m15 6 6 6-6 6" />
          </svg>
        </span>
      </div>
    </div>
  );
}
