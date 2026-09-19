import Link from "next/link";

import { Button } from "@/components/ui/button";

// This IS the site's global 404.html (English root layout, GitHub Pages' one static
// fallback for every unmatched path) — see DECISIONS.md D-018/D-022.
export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you were looking for doesn&apos;t exist or has moved.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
