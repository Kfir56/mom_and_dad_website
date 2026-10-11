"use client";

import { createContext, use, useCallback, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { dirOf } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { ADMIN_TEXT, type AdminDict } from "./admin-i18n";

const KEY = "admin-lang";
const listeners = new Set<() => void>();

function read(): Lang {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "he";
  } catch {
    return "he";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

type Ctx = { lang: Lang; a: AdminDict; toggle: () => void };
const AdminLangContext = createContext<Ctx | null>(null);

/** Admin panel language: Hebrew by default, remembered on this device. */
export function AdminLangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, read, () => "he" as Lang);
  const toggle = useCallback(() => {
    try {
      localStorage.setItem(KEY, lang === "he" ? "en" : "he");
    } catch {}
    listeners.forEach((l) => l());
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirOf(lang);
  }, [lang]);

  return <AdminLangContext value={{ lang, a: ADMIN_TEXT[lang], toggle }}>{children}</AdminLangContext>;
}

export function useAdminLang() {
  const ctx = use(AdminLangContext);
  if (!ctx) throw new Error("useAdminLang must be used inside AdminLangProvider");
  return ctx;
}

export function AdminLangSwitch({ className = "" }: { className?: string }) {
  const { a, toggle } = useAdminLang();
  return (
    <button type="button" onClick={toggle} className={`rounded-full px-4 py-2 font-medium ${className}`}>
      {a.switchTo}
    </button>
  );
}

/**
 * A text field in both languages, side by side. Hebrew is written right-to-left,
 * English left-to-right, whatever language the admin panel is in.
 */
export function BiField({
  label,
  he,
  en,
  onHe,
  onEn,
  multiline,
  rows = 3,
  placeholder,
  className,
}: {
  label: string;
  he: string;
  en: string;
  onHe: (v: string) => void;
  onEn: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className: string;
}) {
  const { a } = useAdminLang();
  const field = (lang: Lang, value: string, onChange: (v: string) => void) => {
    const props = {
      value,
      dir: dirOf(lang),
      lang,
      placeholder: lang === "he" ? placeholder : undefined,
      "aria-label": `${label} (${lang === "he" ? a.hebrew : a.english})`,
      className,
      onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    };
    return (
      <label className="block">
        <span className="text-sm text-stone-500">{lang === "he" ? a.hebrew : a.english}</span>
        {multiline ? <textarea rows={rows} {...props} /> : <input {...props} />}
      </label>
    );
  };
  return (
    <fieldset>
      <legend className="font-medium">{label}</legend>
      <div className="grid gap-x-3 sm:grid-cols-2">
        {field("he", he, onHe)}
        {field("en", en, onEn)}
      </div>
    </fieldset>
  );
}
