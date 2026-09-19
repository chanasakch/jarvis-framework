"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Wraps next-themes. `attribute="class"` toggles `.dark` on <html>, matching the
 * `.dark { ... }` overrides in app/globals.css and the Shiki dual-theme CSS rule.
 * `disableTransitionOnChange` avoids a flash of transitioning colors on toggle.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
