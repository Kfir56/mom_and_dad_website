"use client";

import { getBrowserClient, isSupabaseConfigured } from "./supabase";

const VISITOR_KEY = "visitor-id";

/** A random id kept in this browser so one person can like a piece once. It identifies nobody. */
export function visitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Count something at most once per browser session (a piece opened, a side visited). */
export function countOnce(key: string, fn: () => PromiseLike<unknown>) {
  if (!isSupabaseConfigured) return;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {}
  void Promise.resolve(fn()).catch(() => {});
}

const rpc = (fn: string, args: Record<string, unknown>) => getBrowserClient().rpc(fn, args);

export const recordView = (itemId: string) => countOnce(`view:${itemId}`, () => rpc("record_view", { p_item: itemId }));
export const recordSideVisit = (side: string) => countOnce(`visit:${side}`, () => rpc("record_side_visit", { p_side: side }));
export const recordShare = (itemId: string) => {
  if (isSupabaseConfigured) void Promise.resolve(rpc("record_share", { p_item: itemId })).catch(() => {});
};

export async function getLikeState(itemId: string): Promise<{ count: number; liked: boolean } | null> {
  const { data, error } = await rpc("like_state", { p_item: itemId, p_visitor: visitorId() });
  return error || !data ? null : (data as { count: number; liked: boolean });
}

export async function setLike(itemId: string, liked: boolean): Promise<number | null> {
  const { data, error } = await rpc("set_like", { p_item: itemId, p_visitor: visitorId(), p_liked: liked });
  return error ? null : (data as number);
}
