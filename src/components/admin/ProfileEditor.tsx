"use client";

import { useState } from "react";
import { saveProfile } from "@/lib/admin-api";
import { photoUrl } from "@/lib/supabase";
import type { Side, SideProfile } from "@/lib/types";

type Props = { side: Side; profile: SideProfile; onSaved: () => Promise<void>; onError: (msg: string) => void };

const inputClass = "mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-lg outline-none focus:border-stone-800";

/** The name, tagline, bio and big background photo on this parent's half of the home page. */
export function ProfileEditor({ side, profile, onSaved, onError }: Props) {
  const [fields, setFields] = useState({ display_name: profile.display_name, tagline: profile.tagline, bio: profile.bio });
  const [hero, setHero] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const current = photoUrl(profile.hero_image);

  return (
    <form
      className="max-w-2xl space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await saveProfile(side, fields, hero, profile.hero_image);
          setHero(null);
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
        {current && !hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt="Current background" className="mt-2 h-40 w-full rounded-xl object-cover" />
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setHero(e.target.files?.[0] ?? null)} className="mt-2 block text-lg" />
      </div>
      <button disabled={saving} className="rounded-xl bg-green-700 px-8 py-4 text-xl font-bold text-white hover:bg-green-800 disabled:opacity-60">
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
