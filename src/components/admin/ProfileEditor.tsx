"use client";

import { useEffect, useMemo, useState } from "react";
import { saveProfile } from "@/lib/admin-api";
import { photoUrl } from "@/lib/supabase";
import type { Side, SideProfile } from "@/lib/types";

type Props = { side: Side; profile: SideProfile; onSaved: () => Promise<void>; onError: (msg: string) => void };

const inputClass = "mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-lg outline-none focus:border-stone-800";

/** The name, tagline, bio and big background photo on this parent's half of the home page. */
export function ProfileEditor({ side, profile, onSaved, onError }: Props) {
  const [fields, setFields] = useState({ display_name: profile.display_name, tagline: profile.tagline, bio: profile.bio });
  const [hero, setHero] = useState<File | null>(null);
  const [removeHero, setRemoveHero] = useState(false);
  // Bumped to reset the file picker after "Don't use this photo".
  const [pickerKey, setPickerKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const current = photoUrl(profile.hero_image);
  const preview = useMemo(() => (hero ? URL.createObjectURL(hero) : null), [hero]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <form
      className="max-w-2xl space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await saveProfile(side, fields, { heroFile: hero, removeHero, oldHero: profile.hero_image });
          setHero(null);
          setRemoveHero(false);
          await onSaved();
        } catch (err) {
          onError((err as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <p className="text-lg text-stone-600">This is what visitors see on your half of the home page and at the top of your gallery.</p>
      <label className="block">
        <span className="font-medium">Your name</span>
        <input required value={fields.display_name} onChange={(e) => setFields({ ...fields, display_name: e.target.value })} className={inputClass} />
      </label>
      <label className="block">
        <span className="font-medium">One-line tagline</span>
        <input value={fields.tagline} onChange={(e) => setFields({ ...fields, tagline: e.target.value })} className={inputClass} />
      </label>
      <label className="block">
        <span className="font-medium">About me</span>
        <textarea rows={6} value={fields.bio} onChange={(e) => setFields({ ...fields, bio: e.target.value })} className={inputClass} />
      </label>
      <div>
        <span className="font-medium">Background photo (optional)</span>
        {preview ? (
          <div className="mt-2 space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
            <img src={preview} alt="New background" className="h-40 w-full rounded-xl object-cover" />
            <button
              type="button"
              onClick={() => {
                setHero(null);
                setPickerKey((k) => k + 1);
              }}
              className="rounded-lg bg-stone-200 px-4 py-2 hover:bg-stone-300"
            >
              Don&apos;t use this photo
            </button>
          </div>
        ) : current && !removeHero ? (
          <div className="mt-2 space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt="Current background" className="h-40 w-full rounded-xl object-cover" />
            <button type="button" onClick={() => setRemoveHero(true)} className="rounded-lg bg-red-50 px-4 py-2 text-red-700 hover:bg-red-100">
              Remove background photo
            </button>
          </div>
        ) : removeHero ? (
          <p className="mt-2 rounded-xl bg-amber-50 p-3 text-amber-900">
            The background photo will be removed when you press Save.{" "}
            <button type="button" onClick={() => setRemoveHero(false)} className="underline">
              Undo
            </button>
          </p>
        ) : null}
        <input
          key={pickerKey}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            setHero(e.target.files?.[0] ?? null);
            setRemoveHero(false);
          }}
          className="mt-2 block text-lg"
        />
      </div>
      <button disabled={saving} className="rounded-xl bg-green-700 px-8 py-4 text-xl font-bold text-white hover:bg-green-800 disabled:opacity-60">
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
