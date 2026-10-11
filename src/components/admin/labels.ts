import type { Side } from "@/lib/types";

/** Wording for the admin forms, so each parent sees words that fit their craft. */
export const LABELS: Record<Side, {
  piece: string;
  pieces: string;
  titleHint: string;
  categoryHint: string;
  processLabel: string;
  processHint: string;
  yearLabel: string;
}> = {
  inbar: {
    piece: "artwork",
    pieces: "artworks",
    titleHint: "e.g. Olive Branch",
    categoryHint: "e.g. Wood burning",
    processLabel: "How it was made",
    processHint: "Technique, tools, how long it took…",
    yearLabel: "Year made",
  },
  eli: {
    piece: "radio",
    pieces: "radios",
    titleHint: "e.g. Philips BX998A",
    categoryHint: "e.g. Tube radios",
    processLabel: "Restoration work",
    processHint: "What was broken, what you replaced, how it sounds now…",
    yearLabel: "Model year",
  },
};
