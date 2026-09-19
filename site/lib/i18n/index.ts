import { en } from "./en";
import { th } from "./th";
import { DEFAULT_LOCALE, LOCALES, type Dictionary, type Locale } from "./types";

export { DEFAULT_LOCALE, LOCALES };
export type { Dictionary, Locale };

const dictionaries: Record<Locale, Dictionary> = { en, th };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Prefix a locale-relative path for the given locale. English has no prefix. */
export function localizeHref(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/**
 * Given the current pathname (as next/navigation's usePathname returns it — logical,
 * basePath already stripped) and the CURRENT locale it belongs to, return the
 * equivalent path under the OTHER locale. Used by the language switch so it can
 * navigate to the same page rather than always back to that locale's home.
 */
export function mirrorPath(pathname: string, from: Locale): string {
  const rest = from === DEFAULT_LOCALE ? pathname : pathname.replace(/^\/th(?=\/|$)/, "") || "/";
  const to: Locale = from === "en" ? "th" : "en";
  return localizeHref(to, rest);
}
