import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo/alternates";

export function generateMetadata() {
  const dict = getDictionary("en");
  return pageMetadata("en", "/changelog", dict.nav.changelog, dict.footer.tagline);
}

// Rendered from CHANGELOG.md in step S8; placeholder keeps the route (and its language
// switch / nav entry) real ahead of that.
export default function ChangelogPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>
      <p className="text-muted-foreground">Rendered from CHANGELOG.md in step S8.</p>
    </main>
  );
}
