import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient, isSupabaseConfigured } from "./supabase";
import { demoPortfolio } from "./demo-data";
import type { Category, Item, Portfolio, Side, SideProfile } from "./types";

/** Cache tag the admin panel invalidates after every change. */
export const PORTFOLIO_TAG = "portfolio";

/**
 * Everything the public site shows, for both parents, in one cached read.
 * The admin panel calls updateTag(PORTFOLIO_TAG) after edits, so changes
 * appear on the next page load without a redeploy.
 */
export async function getPortfolio(): Promise<Portfolio> {
  "use cache";
  cacheTag(PORTFOLIO_TAG);
  cacheLife("days");

  if (!isSupabaseConfigured) return demoPortfolio;

  const supabase = createPublicClient();
  const [sides, categories, items] = await Promise.all([
    supabase.from("sides").select("*"),
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("items")
      .select("*, item_photos(*)")
      .eq("published", true)
      .order("sort_order")
      .order("created_at", { ascending: false }),
  ]);

  const error = sides.error ?? categories.error ?? items.error;
  if (error) throw new Error(`Could not load portfolio: ${error.message}`);

  const build = (side: Side) => ({
    profile:
      (sides.data as SideProfile[]).find((s) => s.side === side) ??
      demoPortfolio[side].profile,
    categories: (categories.data as Category[]).filter((c) => c.side === side),
    items: (items.data as Item[])
      .filter((i) => i.side === side)
      .map((i) => ({
        ...i,
        item_photos: [...i.item_photos].sort((a, b) => a.sort_order - b.sort_order),
      })),
  });

  return { inbar: build("inbar"), eli: build("eli") };
}
