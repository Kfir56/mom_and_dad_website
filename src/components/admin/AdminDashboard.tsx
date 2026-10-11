"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteItem, duplicateItem, loadSide, reorderItems, type AdminData } from "@/lib/admin-api";
import { pick } from "@/lib/i18n";
import { getBrowserClient } from "@/lib/supabase";
import type { Item, Side } from "@/lib/types";
import { coverOf, ItemImage } from "@/components/gallery/ItemImage";
import { AdminLangSwitch, useAdminLang } from "./AdminLang";
import { craftOf } from "./admin-i18n";
import { ItemEditor } from "./ItemEditor";
import { CategoryManager } from "./CategoryManager";
import { ProfileEditor } from "./ProfileEditor";
import { NewsManager } from "./NewsManager";
import { MessagesInbox } from "./MessagesInbox";
import { StatsPanel } from "./StatsPanel";

type Tab = "pieces" | "categories" | "news" | "messages" | "stats" | "about";

export function AdminDashboard({ side, email }: { side: Side; email: string }) {
  const { lang, a } = useAdminLang();
  const L = craftOf(lang, side);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pieces");
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const orderBeforeDrag = useRef<Item[] | null>(null);

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

  const titleOf = (item: Item) => pick(lang, item.title, item.title_he);

  const remove = async (item: Item) => {
    if (!confirm(a.confirmDelete(titleOf(item)))) return;
    try {
      await deleteItem(item);
      flash(a.deleted(titleOf(item)));
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const duplicate = async (item: Item) => {
    setCopying(item.id);
    try {
      const id = await duplicateItem(side, item, { en: a.copySuffix, he: a.copySuffixHe });
      const fresh = await loadSide(side);
      setData(fresh);
      flash(a.duplicated(titleOf(item)));
      // Open the copy so it can be edited right away.
      setEditing(fresh.items.find((i) => i.id === id) ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCopying(null);
    }
  };

  // ---- reordering: arrows move one step; dragging previews live and saves on drop.
  const setItems = (items: Item[]) => setData((d) => (d ? { ...d, items } : d));
  const saveOrder = async (items: Item[]) => {
    try {
      await reorderItems(items.map((i) => i.id));
      flash(a.orderSaved);
    } catch (e) {
      setError((e as Error).message);
      await reload();
    }
  };
  const move = (index: number, by: number) => {
    if (!data) return;
    const to = index + by;
    if (to < 0 || to >= data.items.length) return;
    const items = [...data.items];
    const [moved] = items.splice(index, 1);
    items.splice(to, 0, moved);
    setItems(items);
    void saveOrder(items);
  };
  const dragOver = (overId: string) => {
    if (!data || !dragId || dragId === overId) return;
    const from = data.items.findIndex((i) => i.id === dragId);
    const to = data.items.findIndex((i) => i.id === overId);
    const items = [...data.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    setItems(items);
  };

  const categoryName = (id: string | null) => {
    const c = data?.categories.find((c) => c.id === id);
    return c ? pick(lang, c.name, c.name_he) : undefined;
  };
  const unread = data?.messages.filter((m) => !m.is_read).length ?? 0;
  const tabs: [Tab, string][] = [
    ["pieces", a.tabPieces(L.pieces)],
    ["messages", a.tabMessages],
    ["news", a.tabNews],
    ["stats", a.tabStats],
    ["categories", a.tabCategories],
    ["about", a.tabAbout],
  ];

  return (
    <div data-side={side} className="min-h-svh bg-stone-100 text-stone-900">
      <header className={`${side === "inbar" ? "bg-[linear-gradient(110deg,#ff5d8f,#7b2cbf_55%,#2ec4b6)]" : "eli-wood"} text-white`}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <div>
            <p className="text-sm opacity-80">{a.signedInAs(email)}</p>
            <h1 className={`text-3xl ${side === "inbar" ? "font-display font-black italic" : "font-retro text-[#ffcf7a]"}`}>
              {a.hi(data ? pick(lang, data.profile.display_name, data.profile.display_name_he) : "")}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminLangSwitch className="bg-white/20 backdrop-blur hover:bg-white/30" />
            <Link href={`/${lang}#${side}`} target="_blank" className="rounded-full bg-white/20 px-4 py-2 font-medium backdrop-blur hover:bg-white/30">
              {a.viewSite}
            </Link>
            <button onClick={() => getBrowserClient().auth.signOut()} className="rounded-full bg-black/25 px-4 py-2 font-medium hover:bg-black/40">
              {a.signOut}
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 sm:px-6">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-current={tab === key}
              className={`shrink-0 rounded-t-xl px-4 py-3 text-lg font-semibold sm:px-5 ${tab === key ? "bg-stone-100 text-stone-900" : "text-white/85 hover:bg-white/10"}`}
            >
              {label}
              {key === "messages" && unread > 0 && (
                <span className="ms-2 inline-flex min-w-6 items-center justify-center rounded-full bg-amber-500 px-1.5 text-sm text-white">{unread}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {notice && <p role="status" className="mb-6 rounded-xl bg-green-100 p-4 text-lg text-green-900">{notice}</p>}
        {error && (
          <p role="alert" className="mb-6 rounded-xl bg-red-100 p-4 text-red-900">
            {a.somethingWrong} {error}{" "}
            <button className="underline" onClick={() => setError(null)}>{a.dismiss}</button>
          </p>
        )}
        {!data ? (
          <p className="text-stone-500">{a.loadingPieces(L.pieces)}</p>
        ) : tab === "pieces" ? (
          <>
            <button
              onClick={() => setEditing("new")}
              className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border-4 border-dashed border-stone-300 bg-white py-8 text-xl font-semibold text-stone-700 transition hover:border-stone-500"
            >
              <span className="text-3xl">＋</span> {a.addNew(L.piece)}
            </button>

            {data.items.length === 0 ? (
              <p className="text-center text-lg text-stone-500">{a.noPieces(L.pieces)}</p>
            ) : (
              <p className="mb-4 text-stone-500">{a.reorderHint}</p>
            )}

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item, index) => {
                const cover = coverOf(item);
                const extra = item.item_photos.length;
                return (
                  <li
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      orderBeforeDrag.current = data.items;
                      setDragId(item.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      dragOver(item.id);
                    }}
                    onDrop={(e) => e.preventDefault()}
                    onDragEnd={() => {
                      setDragId(null);
                      const before = orderBeforeDrag.current?.map((i) => i.id).join();
                      if (before !== data.items.map((i) => i.id).join()) void saveOrder(data.items);
                    }}
                    className={`cursor-grab overflow-hidden rounded-2xl bg-white shadow-sm transition active:cursor-grabbing ${dragId === item.id ? "opacity-40 ring-4 ring-stone-400" : ""}`}
                  >
                    <div className="relative aspect-[4/3]">
                      <ItemImage path={cover.path} kind={cover.kind} alt={titleOf(item)} side={side} seed={item.id} sizes="(min-width:1024px) 33vw, 50vw" />
                      {!item.published && (
                        <span className="absolute start-2 top-2 rounded-full bg-stone-900/80 px-3 py-1 text-sm text-white">{a.hidden}</span>
                      )}
                      <span className="absolute end-2 top-2 flex gap-1">
                        {extra > 0 && <span className="rounded-full bg-white/90 px-3 py-1 text-sm">{a.morePhotos(extra)}</span>}
                        {item.audio_path && <span className="rounded-full bg-white/90 px-2 py-1 text-sm">♪</span>}
                        {item.before_path && <span className="rounded-full bg-white/90 px-2 py-1 text-sm">⇆</span>}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-stone-500">{categoryName(item.category_id) ?? a.noCategory}</p>
                      <h2 className="text-lg font-semibold">{titleOf(item)}</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          aria-label={a.moveEarlier}
                          title={a.moveEarlier}
                          className="rounded-xl bg-stone-100 px-3 py-2 text-lg hover:bg-stone-200 disabled:opacity-30"
                        >
                          {lang === "he" ? "→" : "←"}
                        </button>
                        <button
                          onClick={() => move(index, 1)}
                          disabled={index === data.items.length - 1}
                          aria-label={a.moveLater}
                          title={a.moveLater}
                          className="rounded-xl bg-stone-100 px-3 py-2 text-lg hover:bg-stone-200 disabled:opacity-30"
                        >
                          {lang === "he" ? "←" : "→"}
                        </button>
                        <button onClick={() => setEditing(item)} className="flex-1 rounded-xl bg-stone-900 py-2 font-medium text-white hover:bg-stone-700">
                          {a.edit}
                        </button>
                        <button
                          onClick={() => duplicate(item)}
                          disabled={copying !== null}
                          className="rounded-xl bg-stone-100 px-3 py-2 font-medium hover:bg-stone-200 disabled:opacity-50"
                        >
                          {copying === item.id ? a.duplicating : a.duplicate}
                        </button>
                        <button onClick={() => remove(item)} className="rounded-xl border-2 border-red-200 px-3 py-2 font-medium text-red-700 hover:bg-red-50">
                          {a.delete}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : tab === "categories" ? (
          <CategoryManager side={side} categories={data.categories} items={data.items} onChange={reload} onError={setError} />
        ) : tab === "news" ? (
          <NewsManager
            side={side}
            posts={data.posts}
            onChange={async (message) => {
              flash(message);
              await reload();
            }}
            onError={setError}
          />
        ) : tab === "stats" ? (
          <StatsPanel data={data} />
        ) : tab === "messages" ? (
          <MessagesInbox messages={data.messages} items={data.items} onChange={reload} onError={setError} />
        ) : (
          <ProfileEditor
            side={side}
            profile={data.profile}
            onSaved={async () => {
              flash(a.pageUpdated);
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
