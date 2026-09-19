import { PencilIcon } from "lucide-react";

import type { Dictionary, Locale } from "@/lib/i18n";
import { siteConfig } from "@/site.config";

export function EditOnGithub({ locale, dict, slug }: { locale: Locale; dict: Dictionary; slug: string }) {
  const href = `${siteConfig.editBaseUrl}/${locale}/docs/${slug}.mdx`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <PencilIcon className="size-3.5" />
      {dict.docsShell.editThisPage}
    </a>
  );
}
