import type { Lang, Side } from "./types";

export const DEFAULT_LANG: Lang = "he";
export const LANG_COOKIE = "lang";

export const isLang = (value: string): value is Lang => value === "he" || value === "en";

export const dirOf = (lang: Lang) => (lang === "he" ? "rtl" : "ltr");

/**
 * Content is stored in English (plain columns) and Hebrew (*_he columns).
 * Show the visitor's language, falling back to the other one if it's empty.
 */
export function pick(lang: Lang, en: string | null | undefined, he: string | null | undefined): string {
  const first = lang === "he" ? he : en;
  const second = lang === "he" ? en : he;
  return (first?.trim() ? first : second) ?? "";
}

/** Format a yyyy-mm-dd date for display. */
export function formatDate(lang: Lang, iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(lang === "he" ? "he-IL" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const en = {
  switchTo: "עברית",
  switchToLang: "he" as Lang,
  inbarKicker: "the art of",
  eliKicker: "Restored · 1950s – 1960s",
  inbarHint: "↔ pull me wider, or tap to step inside",
  eliHint: "tune in ↔ drag or tap",
  scrollToExplore: "Scroll to explore ↓",
  sliderLabel: (a: string, b: string) => `Drag to choose between ${a} and ${b}`,
  openPane: (name: string) => `Open ${name}`,
  inbarPaneLabel: (name: string) => `${name}'s art`,
  eliPaneLabel: (name: string) => `${name}'s radios`,
  inbarSectionKicker: "the studio of",
  eliSectionKicker: "The workbench of",
  visitOther: (side: Side, other: string): string => (side === "inbar" ? `Now visit ${other}'s radios →` : `← Now visit ${other}'s art`),
  all: "All",
  filterLabel: "Filter by category",
  emptyGallery: "New pieces are on their way.",
  category: "Category",
  materials: "Materials",
  year: "Year",
  manufacturer: "Manufacturer",
  model: "Model",
  type: "Type",
  howMade: "How it was made",
  restoration: "Restoration work",
  beforeAfter: "Before & after",
  before: "Before",
  after: "After",
  listen: "Listen",
  close: "Close",
  photo: (n: number) => `Photo ${n}`,
  share: "Share",
  shareWhatsApp: "WhatsApp",
  copyLink: "Copy link",
  linkCopied: "Link copied!",
  radioOn: "Turn the radio on",
  radioOff: "Turn it off",
  stopSound: "Stop",
  backToGallery: (name: string) => `← Back to ${name}'s gallery`,
  ask: "Ask about this piece",
  askGeneral: (name: string) => `Send ${name} a message`,
  yourName: "Your name",
  yourEmail: "Your email",
  yourMessage: "Your message",
  send: "Send",
  sending: "Sending…",
  sent: (name: string) => `Thank you! ${name} will get back to you by email.`,
  sendFailed: "Sorry, the message didn't go through. Please try again later.",
  news: (side: Side): string => (side === "inbar" ? "Exhibitions & news" : "News"),
  upcoming: "Upcoming",
  notFound: "This piece couldn't be found.",
};

export type Dict = typeof en;

const he: Dict = {
  switchTo: "English",
  switchToLang: "en",
  inbarKicker: "האמנות של",
  eliKicker: "משוחזרים · שנות ה־50 וה־60",
  inbarHint: "↔ משכו אותי, או לחצו כדי להיכנס",
  eliHint: "כוונו את התחנה ↔ גררו או לחצו",
  scrollToExplore: "גללו למטה ↓",
  sliderLabel: (a, b) => `גררו כדי לבחור בין ${a} ל${b}`,
  openPane: (name) => `פתיחת ${name}`,
  inbarPaneLabel: (name) => `האמנות של ${name}`,
  eliPaneLabel: (name) => `מקלטי הרדיו של ${name}`,
  inbarSectionKicker: "הסטודיו של",
  eliSectionKicker: "שולחן העבודה של",
  visitOther: (side, other) => (side === "inbar" ? `לבקר אצל ${other} ומקלטי הרדיו ←` : `→ לבקר אצל ${other} והאמנות`),
  all: "הכל",
  filterLabel: "סינון לפי קטגוריה",
  emptyGallery: "יצירות חדשות בדרך.",
  category: "קטגוריה",
  materials: "חומרים",
  year: "שנה",
  manufacturer: "יצרן",
  model: "דגם",
  type: "סוג",
  howMade: "איך זה נעשה",
  restoration: "עבודת השחזור",
  beforeAfter: "לפני ואחרי",
  before: "לפני",
  after: "אחרי",
  listen: "האזינו",
  close: "סגירה",
  photo: (n) => `תמונה ${n}`,
  share: "שיתוף",
  shareWhatsApp: "וואטסאפ",
  copyLink: "העתקת קישור",
  linkCopied: "הקישור הועתק!",
  radioOn: "הדליקו את הרדיו",
  radioOff: "כבו את הרדיו",
  stopSound: "עצירה",
  backToGallery: (name) => `→ חזרה לגלריה של ${name}`,
  ask: "לשאול על היצירה",
  askGeneral: (name) => `לשלוח הודעה ל${name}`,
  yourName: "השם שלך",
  yourEmail: "האימייל שלך",
  yourMessage: "ההודעה",
  send: "שליחה",
  sending: "שולח…",
  sent: (name) => `תודה! ההודעה נשלחה ל${name}, והתשובה תגיע במייל.`,
  sendFailed: "ההודעה לא נשלחה. אפשר לנסות שוב מאוחר יותר.",
  news: (side) => (side === "inbar" ? "תערוכות וחדשות" : "חדשות"),
  upcoming: "בקרוב",
  notFound: "היצירה לא נמצאה.",
};

export const dictionaries: Record<Lang, Dict> = { en, he };

export const t = (lang: Lang) => dictionaries[lang];
