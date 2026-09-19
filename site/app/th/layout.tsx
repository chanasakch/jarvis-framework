import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { fontVariables } from "@/lib/fonts";
import { getDictionary } from "@/lib/i18n";
import { localeAlternates } from "@/lib/seo/alternates";

import "../globals.css";

// The Thai counterpart of app/(en)/layout.tsx. `th` is a real segment (not a route
// group), so every route under here is prefixed /th — the other half of the
// "two thin parallel route trees" i18n approach (DECISIONS.md D-018/D-022).
export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: { default: "Jarvis", template: "%s · Jarvis" },
  description: "เฟรมเวิร์ก SDLC ที่ขับเคลื่อนด้วย AI สำหรับ Claude Code",
  alternates: localeAlternates("/"),
};

export default function ThaiRootLayout({ children }: { children: React.ReactNode }) {
  const dict = getDictionary("th");

  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${fontVariables} flex min-h-svh flex-col font-sans`}>
        <a href="#main-content" className="skip-link">
          {dict.skipToContent}
        </a>
        <ThemeProvider>
          <Header locale="th" dict={dict} />
          <div className="flex-1">{children}</div>
          <Footer locale="th" dict={dict} />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
