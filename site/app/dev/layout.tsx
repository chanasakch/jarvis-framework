import { ThemeProvider } from "@/components/theme/theme-provider";
import { fontVariables } from "@/lib/fonts";

import "../globals.css";

/**
 * A third, independent root layout for internal QA pages (currently just /dev/tokens) —
 * deliberately outside both locale trees: it has no LanguageSwitch (there is nothing to
 * mirror it to), no site nav, and is excluded from the sitemap. See
 * scripts/check-links.ts, which caught a broken /th/dev/tokens link when this page
 * inherited the full localized Header.
 */
export const metadata = { title: "Design tokens (internal)", robots: { index: false, follow: false } };

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVariables} font-sans`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
