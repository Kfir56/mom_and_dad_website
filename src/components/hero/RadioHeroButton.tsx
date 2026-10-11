"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { createRadioSound, type RadioSound } from "@/lib/radio-sound";
import type { Lang } from "@/lib/types";
import { RadioKnob } from "@/components/piece/RadioKnob";

/** "Turn the radio on" knob on Eli's side of the hero. Plays a synthesized radio, so it needs no upload. */
export function RadioHeroButton({ lang }: { lang: Lang }) {
  const d = t(lang);
  const [on, setOn] = useState(false);
  const sound = useRef<RadioSound | null>(null);

  useEffect(() => () => sound.current?.stop(), []);

  return (
    <RadioKnob
      size="lg"
      on={on}
      label={on ? d.radioOff : d.radioOn}
      className="mt-6 text-[#f6e7c8]"
      onToggle={() => {
        sound.current ??= createRadioSound();
        if (on) sound.current.stop();
        else sound.current.start();
        setOn(!on);
      }}
    />
  );
}
