"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { deleteItem, loadSide } from "@/lib/admin-api";
import { getBrowserClient } from "@/lib/supabase";
import type { Item, Side, SidePortfolio } from "@/lib/types";
import { ItemImage } from "@/components/gallery/ItemImage";
import { ItemEditor } from "./ItemEditor";
import { CategoryManager } from "./CategoryManager";
import { ProfileEditor } from "./ProfileEditor";
import { LABELS } from "./labels";

type Tab = "pieces" | "categories" | "about";

export function AdminDashboard({ side, email }: { side: Side; email: string }) {
  const L = LABELS[side];
  const [data, setData] = useState<SidePortfolio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pieces");
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await loadSide(side));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [side]);

  useEffect(() => {
    let cancelled = false;
    loadSide(side)
      .then((d) => !cancelled && setData(d))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [side]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const remove = async (item: Item) => {
    if (!confirm(`Delete "${item.title}"? This also removes its photos and can't be undone.`)) return;
    try {
      await deleteItem(item);
      flash(`"${item.title}" was deleted.`);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const categoryName = (id: string | null) => data?.categories.find((c) => c.id === id)?.name;

  return (
    <div data-side={side} className="min-h-svh bg-stone-100 text-stone-900">
      <header className={`${side === "inbar" ? "bg-[linear-gradient(110deg,#ff5d8f,#7b2cbf_55%,#2ec4b6)]" : "eli-wood"} text-white`}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <div>
            <p className="text-sm opacity-80">Signed in as {email}</p>
            <h1 className={`text-3xl ${side === "inbar" ? "font-display font-black italic" : "font-retro text-[#ffcf7a]"}`}>
              Hi {data?.profile.display_name ?? ""}!
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href="/" target="_blank" className="rounded-full bg-white/20 px-4 py-2 font-medium backdrop-blur hover:bg-white/30">
              View website ↗
            </Link>
            <button
              onClick={() => getBrowserClient().auth.signOut()}
              className="rounded-full bg-black/25 px-4 py-2 font-medium hover:bg-black/40"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-4 sm:px-6">
          {(
            [
              ["pieces", `My ${L.pieces}`],
              ["categories", "Categories"],
              ["about", "About me"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-current={tab === key}
              className={`rounded-t-xl px-5 py-3 text-lg font-semibold ${tab === key ? "bg-stone-100 text-stone-900" : "text-white/85 hover:bg-white/10"}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {notice && <p role="status" className="mb-6 rounded-xl bg-green-100 p-4 text-lg text-green-900">{notice}</p>}
        {error && (
          <p role="alert" className="mb-6 rounded-xl bg-red-100 p-4 text-red-900">
            Something went wrong: {error}{" "}
            <button className="underline" onClick={() => setError(null)}>Dismiss</button>
          </p>
        )}
        {!data ? (
          <p className="text-stone-500">Loading your {L.pieces}…</p>
        ) : tab === "pieces" ? (
          <>
            <button
              onClick={() => setEditing("new")}
              className="mb-8 flex w-full items-center justify-center gap-3 rounded-2xl border-4 border-dashed border-stone-300 bg-white py-8 text-xl font-semibold text-stone-700 transition hover:border-stone-500"
            >
              <span className="text-3xl">＋</span> Add a new {L.piece}
            </button>

            {data.items.length === 0 && <p className="text-center text-lg text-stone-500">No {L.pieces} yet. Add your first one above.</p>}

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="relative aspect-[4/3]">
                    <ItemImage path={item.cover_path} alt={item.title} side={side} seed={item.id} sizes="(min-width:1024px) 33vw, 50vw" />
                    {!item.published && (
                      <span className="absolute left-2 top-2 rounded-full bg-stone-900/80 px-3 py-1 text-sm text-white">Hidden</span>
                    )}
                    {item.item_photos.length > 0 && (
                      <span className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-sm">+{item.item_photos.length} photos</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-stone-500">{categoryName(item.category_id) ?? "No category"}</p>
                    <h2 className="text-lg font-semibold">{item.title}</h2>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setEditing(item)} className="flex-1 rounded-xl bg-stone-900 py-2 font-medium text-white hover:bg-stone-700">
                        Edit
                      </button>
                      <button onClick={() => remove(item)} className="rounded-xl border-2 border-red-200 px-4 py-2 font-medium text-red-700 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : tab === "categories" ? (
          <CategoryManager side={side} categories={data.categories} items={data.items} onChange={reload} onError={setError} />
        ) : (
          <ProfileEditor
            side={side}
            profile={data.profile}
            onSaved={async () => {
              flash("Your page was updated.");
              await reload();
            }}
            onError={setError}
          />
        )}
      </main>

      {editing && data && (
        <ItemEditor
          side={side}
          item={editing === "new" ? null : editing}
          categories={data.categories}
          onClose={() => setEditing(null)}
          onCategoriesChanged={reload}
          onSaved={async (message) => {
            setEditing(null);
            flash(message);
            await reload();
          }}
        />
      )}
    </div>
  );
}
