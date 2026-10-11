"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Lang, Side } from "@/lib/types";

type Props = { lang: Lang; side: Side; itemId?: string; ownerName: string; title: string };

/** "Ask about this piece": stores the message for the parent to read in their admin inbox. */
export function ContactForm({ lang, side, itemId, ownerName, title }: Props) {
  const d = t(lang);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (state === "sent") return <p role="status" className="rounded-xl bg-[var(--side-card)] p-4">{d.sent(ownerName)}</p>;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-[var(--side-accent)] px-5 py-2 font-semibold text-[var(--side-bg)] hover:opacity-90"
      >
        {title}
      </button>
    );
  }

  const field = "mt-1 w-full rounded-lg border border-[var(--side-border)] bg-[var(--side-card)] px-3 py-2 text-[var(--side-fg)]";
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        // Honeypot: real people never see or fill this field.
        if (form.get("website")) return setState("sent");
        if (!isSupabaseConfigured) return setState("error");
        setState("sending");
        const { error } = await getBrowserClient()
          .from("messages")
          .insert({
            side,
            item_id: itemId ?? null,
            name: String(form.get("name")).trim(),
            email: String(form.get("email")).trim(),
            body: String(form.get("body")).trim(),
          });
        setState(error ? "error" : "sent");
      }}
    >
      <h3 className="font-semibold">{title}</h3>
      <label className="block text-sm">
        {d.yourName}
        <input name="name" required maxLength={100} autoComplete="name" className={field} />
      </label>
      <label className="block text-sm">
        {d.yourEmail}
        <input name="email" type="email" required maxLength={200} autoComplete="email" dir="ltr" className={field} />
      </label>
      <label className="block text-sm">
        {d.yourMessage}
        <textarea name="body" required maxLength={4000} rows={4} className={field} />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state === "error" && <p role="alert" className="text-sm text-red-500">{d.sendFailed}</p>}
      <button disabled={state === "sending"} className="rounded-full bg-[var(--side-accent)] px-5 py-2 font-semibold text-[var(--side-bg)] disabled:opacity-60">
        {state === "sending" ? d.sending : d.send}
      </button>
    </form>
  );
}
