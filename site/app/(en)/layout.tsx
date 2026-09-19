import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { fontVariables } from "@/lib/fonts";
import { getDictionary } from "@/lib/i18n";
import { localeAlternates } from "@/lib/seo/alternates";

import "../globals.css";

// This is one of two independent root layouts (the other is app/th/layout.tsx) — Next's
// "multiple root layouts" pattern. (en) is a route group (contributes no path segment),
// so this <html lang="en"> covers every unprefixed route. See DECISIONS.md D-018/D-022.
export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: { default: "Jarvis", template: "%s · Jarvis" },
  description: "An AI-driven SDLC framework for Claude Code.",
  alternates: localeAlternates("/"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const dict = getDictionary("en");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVariables} flex min-h-svh flex-col font-sans`}>
        <a href="#main-content" className="skip-link">
          {dict.skipToContent}
        </a>
        <ThemeProvider>
          <Header locale="en" dict={dict} />
          <div className="flex-1">{children}</div>
          <Footer locale="en" dict={dict} />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
