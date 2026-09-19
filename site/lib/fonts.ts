import { Inter, JetBrains_Mono, Noto_Sans_Thai } from "next/font/google";

// One CSS variable per font, combined into --font-sans / --font-mono in app/globals.css.
// Loading Inter + Noto Sans Thai together (rather than switching fonts per-locale in JS)
// means the browser's own font-fallback matching renders the right sub-font per character —
// same approach as the design reference (SYSTEM_DESIGN.md §2 Typography).

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-thai",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const fontVariables = `${inter.variable} ${notoSansThai.variable} ${jetbrainsMono.variable}`;
