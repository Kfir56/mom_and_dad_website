import type { Portfolio } from "./types";

// Shown until Supabase is connected, so the design can be previewed right away.

const c = (id: string, side: "inbar" | "eli", name: string, sort_order: number) => ({
  id,
  side,
  name,
  sort_order,
});

const base = {
  cover_path: null,
  published: true,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  item_photos: [],
  year: null,
  materials: null,
  manufacturer: null,
  model: null,
  process: null,
};

export const demoPortfolio: Portfolio = {
  inbar: {
    profile: {
      side: "inbar",
      display_name: "Inbar",
      tagline: "Paint, fire, water and wood",
      bio: "Painting, wood burning, water art, woodworking, sculpting and every kind of brush in between. Each piece starts with a material and a question: what does it want to become?",
      hero_image: null,
    },
    categories: [
      c("c-paint", "inbar", "Painting", 1),
      c("c-burn", "inbar", "Wood burning", 2),
      c("c-water", "inbar", "Water art", 3),
      c("c-wood", "inbar", "Woodworking", 4),
      c("c-sculpt", "inbar", "Sculpting", 5),
    ],
    items: [
      { ...base, id: "i1", side: "inbar", category_id: "c-paint", title: "Citrus Grove at Noon", description: "Thick layers of colour built up over three weeks.", materials: "Oil on canvas, 80×60 cm", process: "Palette knife over a burnt-sienna ground.", year: 2025 },
      { ...base, id: "i2", side: "inbar", category_id: "c-burn", title: "Olive Branch", description: "A single branch burned into a slice of olive wood.", materials: "Pyrography on olive wood", process: "Shading built up with a fine tip at low heat.", year: 2024 },
      { ...base, id: "i3", side: "inbar", category_id: "c-water", title: "Ebru Tide", description: "Marbled paper pulled from a bath of floating pigment.", materials: "Ebru (water marbling) on cotton paper", year: 2025 },
      { ...base, id: "i4", side: "inbar", category_id: "c-wood", title: "Walnut Bowl", description: "Turned from a fallen walnut limb.", materials: "Walnut, beeswax finish", year: 2023 },
      { ...base, id: "i5", side: "inbar", category_id: "c-sculpt", title: "Listening", description: "A small figure, head tilted, listening.", materials: "Air-dry clay, acrylic wash", year: 2024 },
      { ...base, id: "i6", side: "inbar", category_id: "c-paint", title: "Night Market", description: "Loose brushwork, lots of lamp light.", materials: "Acrylic on board", year: 2026 },
    ],
  },
  eli: {
    profile: {
      side: "eli",
      display_name: "Eli",
      tagline: "Vintage radios, brought back to life",
      bio: "Restoring tube and transistor radios from the 1950s and 1960s: new capacitors, re-strung dials, polished Bakelite, and that warm sound coming back out of the speaker.",
      hero_image: null,
    },
    categories: [
      c("c-tube", "eli", "Tube radios", 1),
      c("c-trans", "eli", "Transistor radios", 2),
      c("c-gram", "eli", "Radiograms", 3),
    ],
    items: [
      { ...base, id: "r1", side: "eli", category_id: "c-tube", title: "Philips BX998A", description: "Large wooden table set with a green magic-eye tuning indicator.", manufacturer: "Philips", model: "BX998A", year: 1955, process: "Replaced all paper capacitors, re-strung the dial cord, re-lacquered the cabinet." },
      { ...base, id: "r2", side: "eli", category_id: "c-tube", title: "Grundig 2010", description: "Classic West German set with a superb push-button bank.", manufacturer: "Grundig", model: "2010", year: 1958, process: "Cleaned the band switch, new rectifier, realigned the FM band." },
      { ...base, id: "r3", side: "eli", category_id: "c-trans", title: "Zenith Royal 500", description: "Pocket transistor radio in a two-tone case.", manufacturer: "Zenith", model: "Royal 500", year: 1960, process: "New electrolytics, cleaned the volume pot, polished the case." },
      { ...base, id: "r4", side: "eli", category_id: "c-gram", title: "Telefunken Opus 7", description: "Radio with a cabinet worthy of a living room centrepiece.", manufacturer: "Telefunken", model: "Opus 7", year: 1957, process: "Full recap, new speaker cloth, restored the cabinet veneer." },
      { ...base, id: "r5", side: "eli", category_id: "c-trans", title: "Sony TR-610", description: "Tiny, beautiful, and still pulls in stations.", manufacturer: "Sony", model: "TR-610", year: 1958, process: "Replaced the battery clip and output transformer." },
    ],
  },
};
