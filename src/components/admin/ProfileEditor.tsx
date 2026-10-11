"use client";

import { useEffect, useMemo, useState } from "react";
import { saveProfile, type ProfileFields } from "@/lib/admin-api";
import { photoUrl } from "@/lib/supabase";
import type { Side, SideProfile } from "@/lib/types";
import { BiField, useAdminLang } from "./AdminLang";

type Props = { side: Side; profile: SideProfile; onSaved: () => Promise<void>; onError: (msg: string) => void };

const inputClass = "mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-lg outline-none focus:border-stone-800";

/** The name, tagline, bio and big background photo on this parent's half of the home page. */
export function ProfileEditor({ side, profile, onSaved, onError }: Props) {
  const { a } = useAdminLang();
  const [fields, setFields] = useState<ProfileFields>({
    display_name: profile.display_name === profile.display_name_he ? "" : profile.display_name,
    display_name_he: profile.display_name_he,
    tagline: profile.tagline,
    tagline_he: profile.tagline_he,
    bio: profile.bio,
    bio_he: profile.bio_he,
  });
  const set = (key: keyof ProfileFields) => (value: string) => setFields((f) => ({ ...f, [key]: value }));
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
      className="max-w-3xl space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!fields.display_name.trim() && !fields.display_name_he.trim()) return;
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
      <p className="text-lg text-stone-600">{a.profileIntro}</p>
      <p className="text-sm text-stone-500">{a.bothLangsHint}</p>
      <BiField label={a.yourName} he={fields.display_name_he} en={fields.display_name} onHe={set("display_name_he")} onEn={set("display_name")} className={inputClass} />
      <BiField label={a.tagline} he={fields.tagline_he} en={fields.tagline} onHe={set("tagline_he")} onEn={set("tagline")} className={inputClass} />
      <BiField label={a.aboutMe} multiline rows={6} he={fields.bio_he} en={fields.bio} onHe={set("bio_he")} onEn={set("bio")} className={inputClass} />
      <div>
        <span className="font-medium">{a.backgroundPhoto}</span>
        {preview ? (
          <div className="mt-2 space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
            <img src={preview} alt={a.newBackground} className="h-40 w-full rounded-xl object-cover" />
            <button
              type="button"
              onClick={() => {
                setHero(null);
                setPickerKey((k) => k + 1);
              }}
              className="rounded-lg bg-stone-200 px-4 py-2 hover:bg-stone-300"
            >
              {a.dontUse}
            </button>
          </div>
        ) : current && !removeHero ? (
          <div className="mt-2 space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt={a.currentBackground} className="h-40 w-full rounded-xl object-cover" />
            <button type="button" onClick={() => setRemoveHero(true)} className="rounded-lg bg-red-50 px-4 py-2 text-red-700 hover:bg-red-100">
              {a.removeBackground}
            </button>
          </div>
        ) : removeHero ? (
          <p className="mt-2 rounded-xl bg-amber-50 p-3 text-amber-900">
            {a.backgroundWillGo}{" "}
            <button type="button" onClick={() => setRemoveHero(false)} className="underline">
              {a.undo}
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
        {saving ? a.saving : a.save}
      </button>
    </form>
  );
}
