import Link from "next/link";

import { SdlcLifecycle } from "@/components/sdlc/sdlc-lifecycle";
import { Button } from "@/components/ui/button";
import { localizeHref, type Dictionary, type Locale } from "@/lib/i18n";
import { CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";

/** Landing-page teaser for the SDLC lifecycle: the same diagram as /docs/sdlc, with a
 *  link to the full guide. */
export function LifecycleSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const { teaser } = dict.sdlc;
  return (
    <section className={cn(CONTAINER, "py-16")}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          {teaser.heading}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{teaser.subhead}</p>
      </div>
      <div className="mt-10">
        <SdlcLifecycle dict={dict} />
      </div>
      <div className="mt-6 text-center">
        <Button asChild variant="outline">
          <Link href={localizeHref(locale, "/docs/sdlc")}>{teaser.cta}</Link>
        </Button>
      </div>
    </section>
  );
}
