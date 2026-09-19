import Link from "next/link";

import { Button } from "@/components/ui/button";
import { localizeHref, type Dictionary, type Locale } from "@/lib/i18n";

export function FinalCta({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { finalCta } = dict.landing;
  return (
    <section className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">{finalCta.heading}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{finalCta.body}</p>
        <Button asChild size="lg" className="mt-6">
          <Link href={localizeHref(locale, "/docs/introduction")}>{finalCta.cta}</Link>
        </Button>
      </div>
    </section>
  );
}
