import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo/alternates";

export function generateMetadata() {
  const dict = getDictionary("th");
  return pageMetadata("th", "/changelog", dict.nav.changelog, dict.footer.tagline);
}

// See app/(en)/changelog/page.tsx — rendered from CHANGELOG.md in step S8.
export default function ThaiChangelogPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">ประวัติการอัปเดต</h1>
      <p className="text-muted-foreground">แสดงผลจาก CHANGELOG.md ในขั้น S8</p>
    </main>
  );
}
