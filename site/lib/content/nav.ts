import type { Dictionary } from "@/lib/i18n";

/** Ordering + slugs for the /docs/* left nav (SITE_SPEC.md information architecture).
 *  Titles are localized — resolved from Dictionary["docsNav"]/["docsNavGroups"] by the
 *  sidebar component, not hardcoded here. */
export const DOCS_NAV: { group: keyof Dictionary["docsNavGroups"]; items: (keyof Dictionary["docsNav"])[] }[] = [
  { group: "start", items: ["introduction", "getting-started", "concepts"] },
  { group: "reference", items: ["commands", "agents", "workflows", "gates", "standards", "configuration"] },
  { group: "team", items: ["team", "troubleshooting", "faq"] },
];

export const DOCS_SLUGS = DOCS_NAV.flatMap((g) => g.items);
export type DocSlug = (typeof DOCS_SLUGS)[number];
