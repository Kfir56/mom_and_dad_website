"use client";

import { useState } from "react";
import { addCategory, deleteCategory, renameCategory } from "@/lib/admin-api";
import type { Category, Item, Side } from "@/lib/types";
import { LABELS } from "./labels";

type Props = {
  side: Side;
  categories: Category[];
  items: Item[];
  onChange: () => Promise<void>;
  onError: (msg: string) => void;
};

export function CategoryManager({ side, categories, items, onChange, onError }: Props) {
  const L = LABELS[side];
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await onChange();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <p className="text-lg text-stone-600">Categories group your {L.pieces} on the website, so visitors can filter them.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          void run(async () => {
            await addCategory(side, name.trim(), categories.length + 1);
            setName("");
          });
        }}
        className="flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={L.categoryHint}
          aria-label="New category name"
          className="flex-1 rounded-xl border-2 border-stone-200 px-4 py-3 text-lg"
        />
        <button className="rounded-xl bg-stone-900 px-6 text-lg font-semibold text-white">Add</button>
      </form>

      <ul className="divide-y divide-stone-200 rounded-2xl bg-white">
        {categories.map((c) => {
          const count = items.filter((i) => i.category_id === c.id).length;
          return (
            <li key={c.id} className="flex items-center gap-3 p-4">
              {editingId === c.id ? (
                <>
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 rounded-lg border-2 border-stone-200 px-3 py-2" />
                  <button onClick={() => run(async () => { await renameCategory(c.id, editName.trim()); setEditingId(null); })} className="rounded-lg bg-stone-900 px-3 py-2 text-white">Save</button>
                  <button onClick={() => setEditingId(null)} className="px-2 text-stone-600">Cancel</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-lg">{c.name}</span>
                  <span className="text-sm text-stone-500">{count} {count === 1 ? L.piece : L.pieces}</span>
                  <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} className="rounded-lg bg-stone-100 px-3 py-2 hover:bg-stone-200">Rename</button>
                  <button
                    onClick={() =>
                      confirm(`Delete the category "${c.name}"? ${count ? `The ${count} ${count === 1 ? L.piece : L.pieces} in it will stay, just without a category.` : ""}`) &&
                      run(() => deleteCategory(c.id))
                    }
                    className="rounded-lg px-3 py-2 text-red-700 hover:bg-red-50"
                  >
                    Delete
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
