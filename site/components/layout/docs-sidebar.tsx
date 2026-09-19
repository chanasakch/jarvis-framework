import Link from "next/link";

import { DOCS_NAV } from "@/lib/content/nav";
import { localizeHref, type Dictionary, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function DocsSidebar({ locale, dict, activeSlug }: { locale: Locale; dict: Dictionary; activeSlug: string }) {
  return (
    <nav aria-label={dict.nav.docs} className="space-y-6 text-sm">
      {DOCS_NAV.map((group) => (
        <div key={group.group} className="space-y-1">
          <h3 className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {dict.docsNavGroups[group.group]}
          </h3>
          <ul className="space-y-0.5">
            {group.items.map((slug) => {
              const active = slug === activeSlug;
              return (
                <li key={slug}>
                  <Link
                    href={localizeHref(locale, `/docs/${slug}`)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-2 py-1.5 transition-colors",
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {dict.docsNav[slug]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
