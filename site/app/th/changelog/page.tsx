import { getDictionary } from "@/lib/i18n";
import { ChangelogTimeline } from "@/components/viz/changelog-timeline";
import { getChangelog } from "@/lib/generated/loaders";
import { pageMetadata } from "@/lib/seo/alternates";

export function generateMetadata() {
  const dict = getDictionary("th");
  return pageMetadata("th", "/changelog", dict.nav.changelog, dict.changelog.subhead);
}

// Changelog entries are English-only (technical release notes, sourced from one root
// CHANGELOG.md) — only this page's chrome (title, subhead, empty state) is translated.
export default function ThaiChangelogPage() {
  const dict = getDictionary("th");
  const entries = getChangelog();

  return (
    <main id="main-content" className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.changelog.title}</h1>
        <p className="mt-1 text-muted-foreground">{dict.changelog.subhead}</p>
      </div>

      {entries.length === 0 && <p className="text-sm text-muted-foreground">{dict.changelog.empty}</p>}

      <ChangelogTimeline dict={dict} entries={entries} />
    </main>
  );
}
