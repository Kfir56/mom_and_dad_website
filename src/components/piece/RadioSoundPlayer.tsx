"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { RadioKnob } from "./RadioKnob";

/** A piece's sound clip, played with a radio knob instead of a plain audio bar. */
export function RadioSoundPlayer({ lang, src }: { lang: Lang; src: string }) {
  const d = t(lang);
  const audio = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = audio.current;
    return () => el?.pause();
  }, []);

  return (
    <div>
      <audio
        ref={audio}
        src={src}
        preload="none"
        onEnded={() => setOn(false)}
        onPause={() => setOn(false)}
        onPlay={() => setOn(true)}
      />
      <RadioKnob
        on={on}
        label={on ? d.stopSound : d.listen}
        onToggle={() => {
          const el = audio.current;
          if (!el) return;
          if (el.paused) void el.play().catch(() => setOn(false));
          else el.pause();
        }}
      />
    </div>
  );
}
