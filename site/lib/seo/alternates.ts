import type { Metadata } from "next";

import { localizeHref, type Locale } from "@/lib/i18n";

/**
 * hreflang alternates + canonical for a page that exists in both locales.
 * `path` is locale-relative (no /th prefix), e.g. "/docs/introduction" or "/".
 */
export function localeAlternates(path: string): Metadata["alternates"] {
  return {
    canonical: localizeHref("en", path),
    languages: {
      en: localizeHref("en", path),
      th: localizeHref("th", path),
      "x-default": localizeHref("en", path),
    },
  };
}

export function pageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: localeAlternates(path),
    openGraph: { title, description, locale: locale === "en" ? "en_US" : "th_TH" },
  };
}
