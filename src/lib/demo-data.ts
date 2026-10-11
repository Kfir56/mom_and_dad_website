import type { Category, Item, Portfolio, Side } from "./types";

// Shown until Supabase is connected, so the design can be previewed right away.

const c = (id: string, side: Side, name: string, name_he: string, sort_order: number): Category => ({
  id,
  side,
  name,
  name_he,
  sort_order,
});

const base = {
  cover_path: null,
  before_path: null,
  audio_path: null,
  video_url: null,
  published: true,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  item_photos: [],
  year: null,
  title_he: "",
  description_he: "",
  materials: null,
  materials_he: null,
  manufacturer: null,
  model: null,
  process: null,
  process_he: null,
};

const item = (fields: Partial<Item> & Pick<Item, "id" | "side" | "title">): Item => ({ ...base, category_id: null, description: "", ...fields });

export const demoPortfolio: Portfolio = {
  inbar: {
    profile: {
      side: "inbar",
      display_name: "Inbar",
      display_name_he: "ענבר",
      tagline: "Paint, fire, water and wood",
      tagline_he: "צבע, אש, מים ועץ",
      bio: "Painting, wood burning, water art, woodworking, sculpting and every kind of brush in between. Each piece starts with a material and a question: what does it want to become?",
      bio_he: "ציור, צריבה בעץ, אמנות מים, עבודות עץ, פיסול וכל סוג של מכחול שביניהם. כל יצירה מתחילה בחומר ובשאלה: מה הוא רוצה להיות?",
      hero_image: null,
    },
    categories: [
      c("c-paint", "inbar", "Painting", "ציור", 1),
      c("c-burn", "inbar", "Wood burning", "צריבה בעץ", 2),
      c("c-water", "inbar", "Water art", "אמנות מים", 3),
      c("c-wood", "inbar", "Woodworking", "עבודות עץ", 4),
      c("c-sculpt", "inbar", "Sculpting", "פיסול", 5),
    ],
    items: [
      item({ id: "i1", side: "inbar", category_id: "c-paint", title: "Citrus Grove at Noon", title_he: "פרדס בצהריים", description: "Thick layers of colour built up over three weeks.", description_he: "שכבות עבות של צבע שנבנו במשך שלושה שבועות.", materials: "Oil on canvas, 80×60 cm", materials_he: "שמן על בד, 80×60 ס״מ", process: "Palette knife over a burnt-sienna ground.", year: 2025 }),
      item({ id: "i2", side: "inbar", category_id: "c-burn", title: "Olive Branch", title_he: "ענף זית", description: "A single branch burned into a slice of olive wood.", materials: "Pyrography on olive wood", materials_he: "צריבה על עץ זית", year: 2024 }),
      item({ id: "i3", side: "inbar", category_id: "c-water", title: "Ebru Tide", title_he: "גאות אברו", description: "Marbled paper pulled from a bath of floating pigment.", materials: "Ebru (water marbling) on cotton paper", year: 2025 }),
      item({ id: "i4", side: "inbar", category_id: "c-wood", title: "Walnut Bowl", title_he: "קערת אגוז", description: "Turned from a fallen walnut limb.", materials: "Walnut, beeswax finish", year: 2023 }),
      item({ id: "i5", side: "inbar", category_id: "c-sculpt", title: "Listening", title_he: "מקשיבה", description: "A small figure, head tilted, listening.", materials: "Air-dry clay, acrylic wash", year: 2024 }),
      item({ id: "i6", side: "inbar", category_id: "c-paint", title: "Night Market", title_he: "שוק לילה", description: "Loose brushwork, lots of lamp light.", materials: "Acrylic on board", year: 2026 }),
    ],
    posts: [
      { id: "p1", side: "inbar", title: "Open studio weekend", title_he: "סוף שבוע של סטודיו פתוח", body: "New wood-burning pieces and works in progress.", body_he: "עבודות צריבה חדשות ועבודות בתהליך.", location: "Rishon LeZion", event_date: "2026-11-20", image_path: null, published: true, created_at: "2026-10-01T00:00:00Z" },
    ],
  },
  eli: {
    profile: {
      side: "eli",
      display_name: "Eli",
      display_name_he: "אלי",
      tagline: "Vintage radios, brought back to life",
      tagline_he: "מקלטי רדיו וינטג׳ שחוזרים לחיים",
      bio: "Restoring tube and transistor radios from the 1950s and 1960s: new capacitors, re-strung dials, polished Bakelite, and that warm sound coming back out of the speaker.",
      bio_he: "משחזר מקלטי רדיו עם מנורות וטרנזיסטורים משנות ה־50 וה־60: קבלים חדשים, חוטי כיוון מתוחים מחדש, בקליט מבריק, והצליל החם שחוזר לצאת מהרמקול.",
      hero_image: null,
    },
    categories: [
      c("c-tube", "eli", "Tube radios", "רדיו מנורות", 1),
      c("c-trans", "eli", "Transistor radios", "רדיו טרנזיסטורים", 2),
      c("c-gram", "eli", "Radiograms", "רדיוגרמות", 3),
    ],
    items: [
      item({ id: "r1", side: "eli", category_id: "c-tube", title: "Philips BX998A", description: "Large wooden table set with a green magic-eye tuning indicator.", description_he: "מקלט שולחני גדול מעץ עם עין קסם ירוקה לכיוון.", manufacturer: "Philips", model: "BX998A", year: 1955, process: "Replaced all paper capacitors, re-strung the dial cord, re-lacquered the cabinet.", process_he: "החלפת כל קבלי הנייר, מתיחה מחדש של חוט הכיוון ולכה חדשה לארגז." }),
      item({ id: "r2", side: "eli", category_id: "c-tube", title: "Grundig 2010", description: "Classic West German set with a superb push-button bank.", manufacturer: "Grundig", model: "2010", year: 1958, process: "Cleaned the band switch, new rectifier, realigned the FM band." }),
      item({ id: "r3", side: "eli", category_id: "c-trans", title: "Zenith Royal 500", description: "Pocket transistor radio in a two-tone case.", manufacturer: "Zenith", model: "Royal 500", year: 1960, process: "New electrolytics, cleaned the volume pot, polished the case." }),
      item({ id: "r4", side: "eli", category_id: "c-gram", title: "Telefunken Opus 7", description: "Radio with a cabinet worthy of a living room centrepiece.", manufacturer: "Telefunken", model: "Opus 7", year: 1957, process: "Full recap, new speaker cloth, restored the cabinet veneer." }),
      item({ id: "r5", side: "eli", category_id: "c-trans", title: "Sony TR-610", description: "Tiny, beautiful, and still pulls in stations.", manufacturer: "Sony", model: "TR-610", year: 1958, process: "Replaced the battery clip and output transformer." }),
    ],
    posts: [],
  },
};
