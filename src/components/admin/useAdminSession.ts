"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase";
import type { Side } from "@/lib/types";

export type AdminSession =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "not-admin"; session: Session }
  | { status: "ready"; session: Session; side: Side };

/** Current login plus which parent's side this account may edit. */
export function useAdminSession(): AdminSession {
  const [state, setState] = useState<AdminSession>({ status: "loading" });

  useEffect(() => {
    const supabase = getBrowserClient();
    let cancelled = false;

    const resolve = async (session: Session | null) => {
      if (!session) {
        if (!cancelled) setState({ status: "signed-out" });
        return;
      }
      const { data } = await supabase.from("admins").select("side").eq("user_id", session.user.id).maybeSingle();
      if (cancelled) return;
      setState(data ? { status: "ready", session, side: data.side as Side } : { status: "not-admin", session });
    };

    // Fires once right away with the stored session, then on every login/logout/refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer the query: Supabase recommends not awaiting other calls inside this callback.
      setTimeout(() => void resolve(session), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
