import type { Metadata } from "next";
import "../globals.css";
import { fontVariables } from "../fonts";
import { AdminLangProvider } from "@/components/admin/AdminLang";

export const metadata: Metadata = { title: "Admin · Inbar & Eli", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="he" dir="rtl" className={`${fontVariables} antialiased`} suppressHydrationWarning>
      <body className="min-h-svh">
        <AdminLangProvider>{children}</AdminLangProvider>
      </body>
    </html>
  );
}
