import { pick } from "./i18n";
import type { Category, Item, Lang } from "./types";

export type SortKey = "featured" | "newest" | "oldest" | "year" | "az";
export const SORT_KEYS: SortKey[] = ["featured", "newest", "oldest", "year", "az"];

/** Lower-case and drop Hebrew vowel marks and accents, so searches match however the text was typed. */
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[֑-ׇ̀-ͯ]/g, "")
    .toLowerCase();

/** Everything a visitor might type to find a piece, in both languages. */
function haystack(item: Item, categories: Category[]) {
  const cat = categories.find((c) => c.id === item.category_id);
  return normalize(
    [
      item.title, item.title_he, item.description, item.description_he,
      item.materials, item.materials_he, item.manufacturer, item.model,
      item.process, item.process_he, item.year, cat?.name, cat?.name_he,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

/** Every word typed must appear somewhere in the piece's text. */
export function matchesQuery(item: Item, categories: Category[], query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = haystack(item, categories);
  return words.every((w) => text.includes(w));
}

export function sortItems(items: Item[], key: SortKey, lang: Lang): Item[] {
  if (key === "featured") return items;
  const list = [...items];
  const title = (i: Item) => pick(lang, i.title, i.title_he);
  if (key === "newest") list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (key === "oldest") list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (key === "year") list.sort((a, b) => (b.year ?? -1) - (a.year ?? -1));
  if (key === "az") list.sort((a, b) => title(a).localeCompare(title(b), lang));
  return list;
}

/** Up to `limit` other pieces from the same side: same category first, then the rest. */
export function relatedItems(item: Item, all: Item[], limit = 3): Item[] {
  const others = all.filter((i) => i.id !== item.id && i.side === item.side);
  const same = others.filter((i) => item.category_id && i.category_id === item.category_id);
  const rest = others.filter((i) => !same.includes(i));
  return [...same, ...rest].slice(0, limit);
}
