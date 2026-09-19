import Link from "next/link";

import { GithubIcon } from "@/components/layout/github-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { getMeta } from "@/lib/generated/loaders";
import { localizeHref, type Dictionary, type Locale } from "@/lib/i18n";
import { siteConfig } from "@/site.config";

export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const meta = getMeta();

  return (
    <section className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24">
      <Badge variant="neutral" className="mb-4">
        v{meta.version}
      </Badge>
      <h1 className="text-display-md font-semibold tracking-tight text-balance sm:text-display-lg">
        {dict.landing.hero.headline}
      </h1>
      <p className="mt-4 text-base text-muted-foreground sm:text-lg">{dict.landing.hero.subhead}</p>

      <div className="mx-auto mt-8 flex max-w-md items-center justify-between gap-2 rounded-lg border border-border bg-muted px-4 py-2.5">
        <code className="overflow-x-auto font-mono text-sm whitespace-nowrap">{meta.installCommand}</code>
        <CopyButton
          value={meta.installCommand}
          label={dict.landing.hero.copyInstall}
          copiedLabel={dict.landing.hero.copied}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href={localizeHref(locale, "/docs/getting-started")}>{dict.landing.hero.getStarted}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer noopener">
            <GithubIcon className="size-4" />
            {dict.landing.hero.viewOnGithub}
          </a>
        </Button>
      </div>
    </section>
  );
}
