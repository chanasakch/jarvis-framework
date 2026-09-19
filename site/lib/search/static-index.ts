import { DOCS_NAV } from "@/lib/content/nav";
import { localizeHref, type Dictionary, type Locale } from "@/lib/i18n";

import type { SearchItem } from "./types";

/**
 * The search index before generated content exists. Built from the same nav config the
 * sidebar renders — one source of truth. S4 (content generation) extends this with
 * every command, agent and workflow from `content/generated/search-index.<locale>.json`;
 * this function stays as the "pages" fallback so the palette works even if that fetch
 * fails (see components/search/command-palette.tsx).
 */
export function getStaticSearchItems(locale: Locale, dict: Dictionary): SearchItem[] {
  const items: SearchItem[] = [
    { id: "changelog", title: dict.nav.changelog, group: "pages", href: localizeHref(locale, "/changelog") },
  ];
  for (const group of DOCS_NAV) {
    for (const slug of group.items) {
      items.push({
        id: `docs:${slug}`,
        title: dict.docsNav[slug],
        group: "pages",
        href: localizeHref(locale, `/docs/${slug}`),
      });
    }
  }
  return items;
}
