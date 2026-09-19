import { getDictionary } from "@/lib/i18n";
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

      <div className="space-y-10">
        {entries.map((entry) => (
          <section key={entry.version} aria-labelledby={`v${entry.version}`}>
            <h2 id={`v${entry.version}`} className="scroll-mt-24 font-mono text-lg font-semibold">
              v{entry.version}
              <time dateTime={entry.date} className="ml-3 font-sans text-sm font-normal text-muted-foreground">
                {entry.date}
              </time>
            </h2>
            <div className="mt-3 space-y-4">
              {entry.sections.map((section) => (
                <div key={section.heading}>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{section.heading}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-6 text-sm text-foreground/90">
                    {section.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
