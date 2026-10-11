"use client";

import { useState } from "react";
import { addCategory, deleteCategory, renameCategory } from "@/lib/admin-api";
import { pick } from "@/lib/i18n";
import type { Category, Item, Side } from "@/lib/types";
import { useAdminLang } from "./AdminLang";
import { craftOf } from "./admin-i18n";

type Props = {
  side: Side;
  categories: Category[];
  items: Item[];
  onChange: () => Promise<void>;
  onError: (msg: string) => void;
};

const field = "min-w-0 flex-1 rounded-xl border-2 border-stone-200 px-4 py-3 text-lg";

/** The English column falls back to the Hebrew name, so show it empty in that case. */
const englishOf = (c: Category) => (c.name_he && c.name === c.name_he ? "" : c.name);

export function CategoryManager({ side, categories, items, onChange, onError }: Props) {
  const { lang, a } = useAdminLang();
  const L = craftOf(lang, side);
  const [names, setNames] = useState({ he: "", en: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ he: "", en: "" });

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await onChange();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  const pair = (value: { he: string; en: string }, onChange: (v: { he: string; en: string }) => void, autoFocus = false) => (
    <>
      <input autoFocus={autoFocus} dir="rtl" lang="he" value={value.he} onChange={(e) => onChange({ ...value, he: e.target.value })} placeholder={a.hebrew} aria-label={`${a.newCategoryName} (${a.hebrew})`} className={field} />
      <input dir="ltr" lang="en" value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })} placeholder={a.english} aria-label={`${a.newCategoryName} (${a.english})`} className={field} />
    </>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-lg text-stone-600">{a.categoriesIntro(L.pieces)}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!names.he.trim() && !names.en.trim()) return;
          void run(async () => {
            await addCategory(side, names.en, names.he, categories.length + 1);
            setNames({ he: "", en: "" });
          });
        }}
        className="flex flex-wrap gap-2 sm:flex-nowrap"
      >
        {pair(names, setNames)}
        <button className="rounded-xl bg-stone-900 px-6 py-3 text-lg font-semibold text-white">{a.add}</button>
      </form>

      <ul className="divide-y divide-stone-200 rounded-2xl bg-white">
        {categories.map((c) => {
          const count = items.filter((i) => i.category_id === c.id).length;
          const name = pick(lang, c.name, c.name_he);
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
              {editingId === c.id ? (
                <>
                  {pair(edit, setEdit, true)}
                  <button
                    onClick={() =>
                      (edit.he.trim() || edit.en.trim()) &&
                      run(async () => {
                        await renameCategory(c.id, edit.en, edit.he);
                        setEditingId(null);
                      })
                    }
                    className="rounded-lg bg-stone-900 px-3 py-2 text-white"
                  >
                    {a.save}
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-2 text-stone-600">{a.cancel}</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-lg">
                    {name}
                    {c.name_he && englishOf(c) && <span className="ms-2 text-sm text-stone-400">{lang === "he" ? c.name : c.name_he}</span>}
                  </span>
                  <span className="text-sm text-stone-500">{a.countOf(count, L.piece, L.pieces)}</span>
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setEdit({ he: c.name_he, en: englishOf(c) });
                    }}
                    className="rounded-lg bg-stone-100 px-3 py-2 hover:bg-stone-200"
                  >
                    {a.rename}
                  </button>
                  <button
                    onClick={() => confirm(a.confirmDeleteCategory(name, count, L.piece, L.pieces)) && run(() => deleteCategory(c.id))}
                    className="rounded-lg px-3 py-2 text-red-700 hover:bg-red-50"
                  >
                    {a.delete}
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
