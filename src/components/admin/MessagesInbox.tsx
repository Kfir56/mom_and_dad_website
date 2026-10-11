"use client";

import { useState } from "react";
import { deleteMessage, setMessageRead } from "@/lib/admin-api";
import { pick } from "@/lib/i18n";
import type { Item, Message } from "@/lib/types";
import { useAdminLang } from "./AdminLang";

type Props = { messages: Message[]; items: Item[]; onChange: () => Promise<void>; onError: (msg: string) => void };

/** Messages visitors sent from the website. Replies go out from the parent's own email app. */
export function MessagesInbox({ messages, items, onChange, onError }: Props) {
  const { lang, a } = useAdminLang();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    try {
      await fn();
      await onChange();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const when = (iso: string) =>
    new Date(iso).toLocaleString(lang === "he" ? "he-IL" : "en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-3xl space-y-6">
      <p className="text-lg text-stone-600">{a.messagesIntro}</p>
      {messages.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-stone-500">{a.noMessages}</p>}
      <ul className="space-y-3">
        {messages.map((m) => {
          const item = items.find((i) => i.id === m.item_id);
          const itemTitle = item ? pick(lang, item.title, item.title_he) : null;
          const mailto = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(a.replySubject(itemTitle))}&body=${encodeURIComponent(
            `\n\n> ${m.body.replace(/\n/g, "\n> ")}`,
          )}`;
          return (
            <li key={m.id} className={`rounded-2xl p-5 ${m.is_read ? "bg-white" : "bg-amber-50 ring-2 ring-amber-300"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-lg font-semibold">
                  {!m.is_read && <span className="me-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">{a.newBadge}</span>}
                  {m.name} <span dir="ltr" className="text-sm font-normal text-stone-500">&lt;{m.email}&gt;</span>
                </p>
                <time dateTime={m.created_at} className="text-sm text-stone-500">{when(m.created_at)}</time>
              </div>
              <p className="mt-1 text-sm text-stone-500">{itemTitle ? a.about(itemTitle) : a.generalMessage}</p>
              <p dir="auto" className="mt-3 whitespace-pre-line text-lg leading-relaxed">{m.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={mailto}
                  onClick={() => !m.is_read && void run(m.id, () => setMessageRead(m.id, true))}
                  className="rounded-xl bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700"
                >
                  {a.reply}
                </a>
                <button disabled={busy === m.id} onClick={() => run(m.id, () => setMessageRead(m.id, !m.is_read))} className="rounded-xl bg-stone-100 px-4 py-2 hover:bg-stone-200">
                  {m.is_read ? a.markUnread : a.markRead}
                </button>
                <button
                  disabled={busy === m.id}
                  onClick={() => confirm(a.confirmDeleteMessage) && run(m.id, () => deleteMessage(m.id))}
                  className="rounded-xl px-4 py-2 text-red-700 hover:bg-red-50"
                >
                  {a.delete}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
