import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { fontVariables } from "../fonts";
import { dirOf, isLang } from "@/lib/i18n";
import { LANGS } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

// Absolute base for share links and previews. Vercel sets these automatically.
const siteHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const metadataBase = new URL(siteHost ? `https://${siteHost}` : "http://localhost:3000");

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const text =
    lang === "he"
      ? { title: "ענבר ואלי", description: "האמנות של ענבר ומקלטי הרדיו המשוחזרים של אלי." }
      : { title: "Inbar & Eli", description: "Inbar's multimedia art and Eli's restored vintage radios." };
  return {
    ...text,
    metadataBase,
    alternates: { languages: { he: "/he", en: "/en" } },
    openGraph: { ...text, siteName: text.title, locale: lang === "he" ? "he_IL" : "en_US" },
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} dir={dirOf(lang)} className={`${fontVariables} antialiased`}>
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
