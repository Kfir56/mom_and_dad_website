"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const LEVELS = [1, 2, 3.5];

/**
 * Full-screen photo viewer. Tap or click to zoom in step by step, scroll or drag to move around;
 * on a phone, pinching also works. Built on <dialog>, so Esc and the back gesture close it.
 */
export function PhotoZoom({ lang, src, alt, onClose }: { lang: Lang; src: string; alt: string; onClose: () => void }) {
  const d = t(lang);
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const [level, setLevel] = useState(0);
  const zoom = LEVELS[level];

  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);

  // Zoom around a point (as a fraction of the visible area), keeping it under the finger or cursor.
  const zoomTo = (next: number, fx = 0.5, fy = 0.5) => {
    const el = scroller.current;
    if (!el) return setLevel(next);
    const old = LEVELS[level];
    const cx = (el.scrollLeft + el.clientWidth * fx) / old;
    const cy = (el.scrollTop + el.clientHeight * fy) / old;
    setLevel(next);
    requestAnimationFrame(() => {
      const z = LEVELS[next];
      el.scrollLeft = cx * z - el.clientWidth * fx;
      el.scrollTop = cy * z - el.clientHeight * fy;
    });
  };

  const bump = (dir: 1 | -1, fx?: number, fy?: number) => zoomTo(Math.min(LEVELS.length - 1, Math.max(0, level + dir)), fx, fy);

  const btn = "flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur hover:bg-white/30 disabled:opacity-30";
  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      className="m-0 h-svh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black"
    >
      <div
        ref={scroller}
        dir="ltr"
        className={`h-full w-full overflow-auto ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        style={{ touchAction: "pan-x pan-y pinch-zoom" }}
        onPointerDown={(e) => {
          if (e.pointerType === "touch") return; // touch scrolls natively
          const el = e.currentTarget;
          drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop, moved: false };
        }}
        onPointerMove={(e) => {
          const s = drag.current;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) s.moved = true;
          if (s.moved && zoom > 1) {
            e.currentTarget.scrollLeft = s.left - dx;
            e.currentTarget.scrollTop = s.top - dy;
          }
        }}
        onPointerUp={() => setTimeout(() => (drag.current = null), 0)}
        onClick={(e) => {
          if (drag.current?.moved) return;
          const r = e.currentTarget.getBoundingClientRect();
          const fx = (e.clientX - r.left) / r.width;
          const fy = (e.clientY - r.top) / r.height;
          // Cycle 1x -> 2x -> 3.5x -> back to fit.
          zoomTo(level === LEVELS.length - 1 ? 0 : level + 1, fx, fy);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- the original, full-size photo is the point here */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="block select-none"
          style={{ width: `${zoom * 100}%`, height: zoom === 1 ? "100%" : "auto", maxWidth: "none", objectFit: "contain" }}
        />
      </div>
      <div className="fixed end-4 top-4 flex gap-2">
        <button type="button" className={btn} aria-label={d.zoomOut} disabled={level === 0} onClick={() => bump(-1)}>
          −
        </button>
        <button type="button" className={btn} aria-label={d.zoomIn} disabled={level === LEVELS.length - 1} onClick={() => bump(1)}>
          +
        </button>
        <button type="button" className={btn} aria-label={d.close} onClick={() => dialog.current?.close()}>
          ×
        </button>
      </div>
    </dialog>
  );
}
