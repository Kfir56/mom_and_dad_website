import type { Metadata } from "next";
import { Caveat, Fraunces, Geist, Righteous, Space_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], style: ["normal", "italic"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });
const righteous = Righteous({ variable: "--font-righteous", subsets: ["latin"], weight: "400" });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Inbar & Eli",
  description: "Inbar's multimedia art and Eli's restored vintage radios.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} ${caveat.variable} ${righteous.variable} ${spaceMono.variable} antialiased`}
    >
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
