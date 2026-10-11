"use client";

import { useEffect, useMemo, useRef } from "react";
import type { FileSlot } from "@/lib/admin-api";
import { photoUrl } from "@/lib/supabase";
import { useAdminLang } from "./AdminLang";

type Props = {
  label: string;
  hint?: string;
  accept: string;
  kind: "image" | "audio";
  maxMb: number;
  value: FileSlot;
  onChange: (slot: FileSlot) => void;
  onError: (message: string) => void;
};

/** Pick, preview, replace or remove one optional file (a "before" photo, a sound clip, a news photo). */
export function FileSlotPicker({ label, hint, accept, kind, maxMb, value, onChange, onError }: Props) {
  const { a } = useAdminLang();
  const input = useRef<HTMLInputElement>(null);
  const file = "file" in value ? value.file : null;
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);
  const src = preview ?? ("path" in value ? photoUrl(value.path) : null);

  return (
    <div>
      <p className="font-medium">{label}</p>
      {hint && <p className="text-sm text-stone-500">{hint}</p>}
      {src && (
        <div className="mt-2">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- local previews (blob: URLs)
            <img src={src} alt="" className="h-32 w-48 rounded-xl object-cover" />
          ) : (
            <audio src={src} controls preload="none" className="w-full max-w-sm" />
          )}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => input.current?.click()} className="rounded-lg bg-stone-200 px-4 py-2 hover:bg-stone-300">
          {src ? a.replace : a.chooseFile}
        </button>
        {src && (
          <button type="button" onClick={() => onChange({ path: null })} className="rounded-lg bg-red-50 px-4 py-2 text-red-700 hover:bg-red-100">
            {a.remove}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          if (f.size > maxMb * 1024 * 1024) return onError(a.photoTooBig(f.name, maxMb));
          onChange({ file: f });
        }}
      />
    </div>
  );
}
