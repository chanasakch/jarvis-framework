import type { ReactNode } from "react";

import type { Dictionary, Locale } from "@/lib/i18n";
import { Callout } from "@/components/mdx/callout";

import { Breadcrumbs } from "./breadcrumbs";
import { DocsSidebar } from "./docs-sidebar";
import { DocsToc, type Heading } from "./docs-toc";
import { EditOnGithub } from "./edit-on-github";
import { PrevNext } from "./prev-next";
import { CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";

/**
 * Composes the docs page chrome: left nav, breadcrumbs, content, right TOC, edit link,
 * prev/next. `translated: false` renders the missing-translation notice from
 * SITE_SPEC.md ("Missing Thai content falls back to English with a small notice") — S6
 * wires this from real MDX file presence; for now callers pass it explicitly.
 */
export function DocsShell({
  locale,
  dict,
  activeSlug,
  headings,
  translated = true,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  activeSlug: string;
  headings: Heading[];
  translated?: boolean;
  children: ReactNode;
}) {
  const title = dict.docsNav[activeSlug as keyof Dictionary["docsNav"]] ?? activeSlug;

  return (
    <div className={cn(CONTAINER, "flex gap-8 py-8")}>
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20">
          <DocsSidebar locale={locale} dict={dict} activeSlug={activeSlug} />
        </div>
      </aside>

      <main id="main-content" className="min-w-0 flex-1 space-y-6">
        <Breadcrumbs locale={locale} dict={dict} title={title} />
        {!translated && <Callout kind="note">{dict.docsShell.missingTranslationNotice}</Callout>}
        {/* MDX prose styling (headings/paragraphs/lists spacing) lands with the real
            content pipeline in S4/S6 — this wrapper is the attachment point. */}
        <article className="max-w-none space-y-4">{children}</article>
        <EditOnGithub locale={locale} dict={dict} slug={activeSlug} />
        <PrevNext locale={locale} dict={dict} activeSlug={activeSlug} />
      </main>

      <aside className="hidden w-52 shrink-0 xl:block">
        <div className="sticky top-20">
          <DocsToc headings={headings} title={dict.docsShell.onThisPage} />
        </div>
      </aside>
    </div>
  );
}
