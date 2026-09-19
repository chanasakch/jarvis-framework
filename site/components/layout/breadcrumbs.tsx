import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { localizeHref, type Dictionary, type Locale } from "@/lib/i18n";

export function Breadcrumbs({ locale, dict, title }: { locale: Locale; dict: Dictionary; title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href={localizeHref(locale, "/docs/introduction")} className="hover:text-foreground">
        {dict.docsShell.breadcrumbHome}
      </Link>
      <ChevronRightIcon aria-hidden="true" className="size-3.5" />
      <span aria-current="page" className="font-medium text-foreground">
        {title}
      </span>
    </nav>
  );
}
