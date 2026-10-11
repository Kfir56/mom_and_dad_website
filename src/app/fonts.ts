import { Amatic_SC, Caveat, Fraunces, Geist, Righteous, Rubik, Space_Mono, Suez_One } from "next/font/google";

// Latin fonts, each paired with a Hebrew one (see globals.css font stacks).
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], style: ["normal", "italic"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });
const righteous = Righteous({ variable: "--font-righteous", subsets: ["latin"], weight: "400" });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"] });
const rubik = Rubik({ variable: "--font-rubik", subsets: ["hebrew", "latin"] });
const suez = Suez_One({ variable: "--font-suez", subsets: ["hebrew"], weight: "400" });
const amatic = Amatic_SC({ variable: "--font-amatic", subsets: ["hebrew"], weight: ["400", "700"] });

export const fontVariables = [geistSans, fraunces, caveat, righteous, spaceMono, rubik, suez, amatic]
  .map((f) => f.variable)
  .join(" ");
