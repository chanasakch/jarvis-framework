import { PencilIcon } from "lucide-react";

import type { Dictionary, Locale } from "@/lib/i18n";

const GITHUB_EDIT_BASE = "https://github.com/your-org/jarvis-framework/edit/main/site/content";

export function EditOnGithub({ locale, dict, slug }: { locale: Locale; dict: Dictionary; slug: string }) {
  const href = `${GITHUB_EDIT_BASE}/${locale}/docs/${slug}.mdx`;
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
