import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Callout } from "@/components/mdx/callout";
import { DOCS_SLUGS, type DocSlug } from "@/lib/content/nav";
import { getDictionary, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo/alternates";

import { DocsShell } from "./docs-shell";
import type { Heading } from "./docs-toc";

/**
 * Shared implementation behind both app/(en)/docs/[...slug]/page.tsx and
 * app/th/docs/[...slug]/page.tsx (D-018's "thin wrapper, shared logic" pattern).
 *
 * Renders a placeholder body for now — the real MDX loader (frontmatter, headings
 * extraction, next-mdx-remote/rsc rendering) is built in S4/S6 and will replace only
 * the body of this function; DocsShell, routing, generateStaticParams and metadata are
 * already final.
 */
export function docsStaticParams() {
  return DOCS_SLUGS.map((slug) => ({ slug: [slug] }));
}

export function docsMetadata(locale: Locale, slugParts: string[]): Metadata {
  const slug = slugParts[0] as DocSlug | undefined;
  const dict = getDictionary(locale);
  if (!slug || !DOCS_SLUGS.includes(slug)) return {};
  const title = dict.docsNav[slug];
  return pageMetadata(locale, `/docs/${slug}`, title, dict.footer.tagline);
}

const PLACEHOLDER_HEADINGS: Heading[] = [
  { id: "overview", text: "Overview", level: 2 },
  { id: "coming-soon", text: "Coming soon", level: 2 },
];

export function DocsPageContent({ locale, slugParts }: { locale: Locale; slugParts: string[] }) {
  const slug = slugParts[0] as DocSlug | undefined;
  if (!slug || slugParts.length !== 1 || !DOCS_SLUGS.includes(slug)) notFound();

  const dict = getDictionary(locale);

  return (
    <DocsShell locale={locale} dict={dict} activeSlug={slug} headings={PLACEHOLDER_HEADINGS}>
      <h1 id="overview" className="text-2xl font-semibold tracking-tight">
        {dict.docsNav[slug]}
      </h1>
      <Callout kind="note" title="Content coming in step S6">
        This page is wired up — navigation, breadcrumbs, the on-this-page outline, language
        switching and the edit link all work — but its written content lands in step S6 of the
        build, generated for reference pages and hand-written for the rest, per site/SITE_SPEC.md.
      </Callout>
      <h2 id="coming-soon" className="text-xl font-semibold tracking-tight">
        Coming soon
      </h2>
      <p className="text-muted-foreground">
        Try the language switch above, or use the on-this-page outline to jump between the two
        headings on this placeholder — both are fully functional ahead of the real content.
      </p>
    </DocsShell>
  );
}
