import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const STORAGE_BUCKET = "portfolio";

/** Public URL of a file in the portfolio bucket. */
export function photoUrl(path: string | null | undefined): string | null {
  if (!path || !url) return null;
  return `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

/** Stateless client for reading public content on the server. */
export function createPublicClient(): SupabaseClient {
  return createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let browserClient: SupabaseClient | null = null;

/** Singleton client for the admin panel; keeps the login session in the browser. */
export function getBrowserClient(): SupabaseClient {
  browserClient ??= createClient(url!, anonKey!);
  return browserClient;
}
