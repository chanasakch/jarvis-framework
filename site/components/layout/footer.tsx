import Link from "next/link";

import { localizeHref, type Dictionary, type Locale } from "@/lib/i18n";
import { DOCS_NAV } from "@/lib/content/nav";
import { siteConfig } from "@/site.config";

import { Logo } from "./logo";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const docsLinks = DOCS_NAV[0]?.items ?? [];
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <Logo className="size-5 text-brand" />
            {dict.meta.frameworkName}
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">{dict.footer.tagline}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {dict.footer.docsHeading}
          </h3>
          <ul className="space-y-1 text-sm">
            {docsLinks.map((slug) => (
              <li key={slug}>
                <Link href={localizeHref(locale, `/docs/${slug}`)} className="text-muted-foreground hover:text-foreground">
                  {dict.docsNav[slug]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {dict.footer.projectHeading}
          </h3>
          <ul className="space-y-1 text-sm">
            <li>
              <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-foreground">
                GitHub
              </a>
            </li>
            <li>
              <Link href={localizeHref(locale, "/changelog")} className="text-muted-foreground hover:text-foreground">
                {dict.nav.changelog}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-6">
        © {year} {dict.meta.frameworkName} · {dict.footer.license}
      </div>
    </footer>
  );
}
