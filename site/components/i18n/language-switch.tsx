"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mirrorPath, type Dictionary, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "jarvis-site-locale";

function rememberChoice(locale: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Private browsing / storage disabled — the switch still works, it just won't be
    // remembered next visit. Never throw over a convenience feature.
  }
}

/**
 * A two-way segmented control, not a dropdown: SITE_SPEC.md calls it "EN/TH segmented
 * switch". Navigates to the exact mirrored path. Note this performs a full page
 * navigation, not a client-side transition — English and Thai are two independent
 * Next.js root layouts (each needs its own static <html lang>), and Next tears down and
 * recreates <html> when crossing between them. This is a confirmed, disclosed deviation
 * from SITE_SPEC.md's "never causes a full reload"; see DECISIONS.md D-025 for why the
 * alternatives that avoid it are worse under static export on GitHub Pages.
 */
export function LanguageSwitch({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const otherHref = mirrorPath(pathname, locale);

  return (
    <div
      role="group"
      aria-label={dict.languageSwitch.label}
      className="inline-flex items-center rounded-lg border border-input p-0.5 text-xs font-medium"
    >
      <Link
        href={locale === "en" ? pathname : otherHref}
        onClick={() => rememberChoice("en")}
        aria-current={locale === "en" ? "true" : undefined}
        className={cn(
          "rounded-md px-2 py-1 transition-colors",
          locale === "en" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </Link>
      <Link
        href={locale === "th" ? pathname : otherHref}
        onClick={() => rememberChoice("th")}
        aria-current={locale === "th" ? "true" : undefined}
        className={cn(
          "rounded-md px-2 py-1 transition-colors",
          locale === "th" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        ไทย
      </Link>
    </div>
  );
}

export { STORAGE_KEY as LOCALE_STORAGE_KEY };
