"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANG_COOKIE, t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

/** עברית / English toggle that keeps you on the same page. */
export function LanguageSwitch({ lang, className = "" }: { lang: Lang; className?: string }) {
  const pathname = usePathname() ?? `/${lang}`;
  const d = t(lang);
  const target = d.switchToLang;
  const href = pathname.replace(/^\/(he|en)(?=\/|$)/, `/${target}`);
  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      onClick={() => {
        document.cookie = `${LANG_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
      className={`rounded-full bg-black/45 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-black/65 ${className}`}
    >
      {d.switchTo}
    </Link>
  );
}
