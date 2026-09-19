import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "../globals.css";

// The Thai counterpart of app/(en)/layout.tsx. `th` is a real segment (not a route
// group), so every route under here is prefixed /th — the other half of the
// "two thin parallel route trees" i18n approach (DECISIONS.md D-018).
export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: { default: "Jarvis", template: "%s · Jarvis" },
  description: "เฟรมเวิร์ก SDLC ที่ขับเคลื่อนด้วย AI สำหรับ Claude Code",
};

export default function ThaiRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${fontVariables} font-sans`}>
        <a href="#main-content" className="skip-link">
          ข้ามไปยังเนื้อหา
        </a>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
