import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { CommandPalette } from "@/components/search/command-palette";
import { SearchProvider } from "@/components/search/search-provider";
import { SearchTrigger, SearchTriggerIcon } from "@/components/search/search-trigger";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { localizeHref, type Dictionary, type Locale } from "@/lib/i18n";
import { siteConfig } from "@/site.config";

import { GithubIcon } from "./github-icon";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";

export function Header({ locale, dict, version }: { locale: Locale; dict: Dictionary; version?: string }) {
  const links = [
    { href: localizeHref(locale, "/docs/introduction"), label: dict.nav.docs },
    { href: localizeHref(locale, "/docs/commands"), label: dict.nav.commands },
    { href: localizeHref(locale, "/docs/workflows"), label: dict.nav.workflows },
    { href: localizeHref(locale, "/changelog"), label: dict.nav.changelog },
  ];

  return (
    <SearchProvider>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className={cn(CONTAINER, "flex h-14 items-center gap-4")}>
          <MobileNav locale={locale} dict={dict} />

          {/* aria-label, not just the visible span: below `sm` the text is hidden and
              the Logo is aria-hidden, which left this link with no accessible name at
              all — a real WCAG failure Lighthouse caught (link-name audit). */}
          <Link
            href={localizeHref(locale, "/")}
            aria-label={dict.meta.frameworkName}
            className="flex items-center gap-2 font-semibold"
          >
            <Logo className="size-5 text-brand" />
            <span className="hidden sm:inline" aria-hidden="true">
              {dict.meta.frameworkName}
            </span>
          </Link>

          {version && (
            <Badge variant="neutral" className="hidden sm:inline-flex">
              {version}
            </Badge>
          )}

          <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label={dict.nav.docs}>
            {links.map((l) => (
              <Button key={l.href} asChild variant="ghost" size="sm">
                <Link href={l.href}>{l.label}</Link>
              </Button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <SearchTriggerIcon dict={dict} />
            <SearchTrigger dict={dict} />
            <LanguageSwitch locale={locale} dict={dict} />
            <ThemeToggle
              labels={{ light: dict.theme.light, dark: dict.theme.dark, system: dict.theme.system }}
            />
            <Button asChild variant="ghost" size="icon">
              <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer noopener" aria-label={dict.nav.github}>
                <GithubIcon />
              </a>
            </Button>
          </div>
        </div>
      </header>
      <CommandPalette locale={locale} dict={dict} />
    </SearchProvider>
  );
}
