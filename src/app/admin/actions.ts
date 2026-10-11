"use server";

import { updateTag } from "next/cache";
import { PORTFOLIO_TAG } from "@/lib/portfolio";
import { createPublicClient } from "@/lib/supabase";

/**
 * Called by the admin panel after any change so the public site shows it
 * on the next visit. Only signed-in admins may trigger it.
 */
export async function refreshPublicSite(accessToken: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Not signed in");
  updateTag(PORTFOLIO_TAG);
}
