import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "../globals.css";

// This is one of two independent root layouts (the other is app/th/layout.tsx) — Next's
// "multiple root layouts" pattern. (en) is a route group (contributes no path segment),
// so this <html lang="en"> covers every unprefixed route. See DECISIONS.md D-018.
export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: { default: "Jarvis", template: "%s · Jarvis" },
  description: "An AI-driven SDLC framework for Claude Code.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVariables} font-sans`}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
