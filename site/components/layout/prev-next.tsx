import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { localizeHref, type Dictionary, type Locale } from "@/lib/i18n";
import { DOCS_SLUGS } from "@/lib/content/nav";

export function PrevNext({ locale, dict, activeSlug }: { locale: Locale; dict: Dictionary; activeSlug: string }) {
  const index = DOCS_SLUGS.indexOf(activeSlug as (typeof DOCS_SLUGS)[number]);
  const prevSlug = index > 0 ? DOCS_SLUGS[index - 1] : undefined;
  const nextSlug = index >= 0 && index < DOCS_SLUGS.length - 1 ? DOCS_SLUGS[index + 1] : undefined;

  if (!prevSlug && !nextSlug) return null;

  return (
    <nav aria-label="Page navigation" className="flex items-center justify-between gap-4 border-t border-border pt-6">
      {prevSlug ? (
        <Link
          href={localizeHref(locale, `/docs/${prevSlug}`)}
          className="flex flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-sm ring-1 ring-border hover:bg-accent"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeftIcon className="size-3" /> {dict.docsShell.previous}
          </span>
          <span className="font-medium">{dict.docsNav[prevSlug]}</span>
        </Link>
      ) : (
        <span />
      )}
      {nextSlug ? (
        <Link
          href={localizeHref(locale, `/docs/${nextSlug}`)}
          className="flex flex-col items-end gap-0.5 rounded-lg px-3 py-2 text-right text-sm ring-1 ring-border hover:bg-accent"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {dict.docsShell.next} <ArrowRightIcon className="size-3" />
          </span>
          <span className="font-medium">{dict.docsNav[nextSlug]}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
