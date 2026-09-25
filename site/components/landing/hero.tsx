import Link from "next/link";

import { HeroHud } from "@/components/landing/hero-hud";
import { GithubIcon } from "@/components/layout/github-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { getMeta } from "@/lib/generated/loaders";
import { localizeHref, type Dictionary, type Locale } from "@/lib/i18n";
import { siteConfig } from "@/site.config";
import { CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";

export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const meta = getMeta();

  return (
    <section className="relative isolate overflow-clip">
      <div className={cn(CONTAINER, "max-w-3xl pt-16 pb-12 text-center sm:pt-24")}>
      <Badge variant="neutral" className="mb-4">
        v{meta.version}
      </Badge>
      <h1 className="text-display-md font-semibold tracking-tight text-balance sm:text-display-lg">
        {dict.landing.hero.headline}
      </h1>
      <p className="mt-4 text-base text-muted-foreground sm:text-lg">{dict.landing.hero.subhead}</p>

      <div className="mx-auto mt-8 flex max-w-xl items-center justify-between gap-2 rounded-lg border border-border bg-muted px-4 py-2.5">
        {/* tabIndex: same WCAG 2.1.1/2.1.3 fix as the docs code blocks, in case the
            install command is ever longer than the container on a narrow viewport. */}
        <code tabIndex={0} className="overflow-x-auto font-mono text-sm whitespace-nowrap">
          {meta.installCommand}
        </code>
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
      </div>
      <HeroHud pauseLabel={dict.landing.hero.hudPause} playLabel={dict.landing.hero.hudPlay} />
    </section>
  );
}
