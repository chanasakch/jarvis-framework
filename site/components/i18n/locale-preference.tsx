"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { Locale } from "@/lib/i18n";

import { LOCALE_STORAGE_KEY } from "./language-switch";

/**
 * Mounted only on the two landing pages (app/(en)/page.tsx, app/th/page.tsx). If the
 * visitor previously chose a language via LanguageSwitch, apply it once on a fresh
 * landing visit — the same "remember the choice" behavior the switch itself documents,
 * scoped to the entry point rather than fighting a direct deep link to a specific docs
 * page in a locale the visitor typed on purpose (see SITE_PLAN.md §2).
 */
export function LocalePreferenceRedirect({ locale }: { locale: Locale }) {
  const router = useRouter();

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      return;
    }
    if (stored && stored !== locale && (stored === "en" || stored === "th")) {
      router.replace(stored === "th" ? "/th" : "/");
    }
  }, [locale, router]);

  return null;
}
