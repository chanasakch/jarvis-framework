import { getDictionary } from "@/lib/i18n";
import { ChangelogTimeline } from "@/components/viz/changelog-timeline";
import { getChangelog } from "@/lib/generated/loaders";
import { pageMetadata } from "@/lib/seo/alternates";

export function generateMetadata() {
  const dict = getDictionary("en");
  return pageMetadata("en", "/changelog", dict.nav.changelog, dict.changelog.subhead);
}

export default function ChangelogPage() {
  const dict = getDictionary("en");
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
