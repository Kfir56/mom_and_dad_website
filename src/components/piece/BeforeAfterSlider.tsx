"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Props = { before: string; after: string; beforeLabel: string; afterLabel: string; alt: string };

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/** Drag the handle to compare a "before" and an "after" photo of the same piece. */
export function BeforeAfterSlider({ before, after, beforeLabel, afterLabel, alt }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0.5);
  const [dragging, setDragging] = useState(false);

  const fromX = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? clamp((clientX - r.left) / r.width) : 0.5;
  };

  return (
    <div
      ref={ref}
      dir="ltr"
      className="relative aspect-[4/3] w-full touch-none select-none overflow-hidden bg-black"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        setPos(fromX(e.clientX));
      }}
      onPointerMove={(e) => dragging && setPos(fromX(e.clientX))}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <Image src={after} alt={`${alt} (${afterLabel})`} fill sizes="(min-width:768px) 60vw, 94vw" className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${(1 - pos) * 100}% 0 0)` }}>
        <Image src={before} alt={`${alt} (${beforeLabel})`} fill sizes="(min-width:768px) 60vw, 94vw" className="object-cover" />
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 text-xs font-semibold uppercase text-white">{beforeLabel}</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 text-xs font-semibold uppercase text-white">{afterLabel}</span>
      <div
        role="slider"
        tabIndex={0}
        aria-label={`${beforeLabel} / ${afterLabel}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos * 100)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => clamp(p - 0.05));
          if (e.key === "ArrowRight") setPos((p) => clamp(p + 0.05));
        }}
        className="absolute inset-y-0 w-10 -translate-x-1/2 cursor-ew-resize focus-visible:outline-none"
        style={{ left: `${pos * 100}%` }}
      >
        <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,.5)]" />
        <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-black/30 text-white backdrop-blur">
          ⇔
        </span>
      </div>
    </div>
  );
}
