import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LANG, LANG_COOKIE, isLang } from "@/lib/i18n";

/** Send visitors from "/" to /he or /en: their last choice, else their browser language. */
export function proxy(request: NextRequest) {
  const saved = request.cookies.get(LANG_COOKIE)?.value;
  let lang = saved && isLang(saved) ? saved : null;
  if (!lang) {
    const accept = request.headers.get("accept-language")?.toLowerCase() ?? "";
    const first = accept.split(",")[0]?.trim() ?? "";
    lang = first.startsWith("en") ? "en" : first.startsWith("he") || first.startsWith("iw") ? "he" : DEFAULT_LANG;
  }
  return NextResponse.redirect(new URL(`/${lang}`, request.url));
}

export const config = { matcher: "/" };
