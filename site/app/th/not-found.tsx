import Link from "next/link";

import { Button } from "@/components/ui/button";

// Serves client-side navigations to an unmatched /th/... path. A cold hit on such a URL
// falls back to the English 404 (a documented static-hosting limitation, not a bug —
// see DECISIONS.md D-018/D-022 and SITE_PLAN.md §7 risk 3).
export default function ThaiNotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">ไม่พบหน้านี้</h1>
      <p className="text-sm text-muted-foreground">หน้าที่คุณต้องการไม่มีอยู่หรือถูกย้ายไปแล้ว</p>
      <Button asChild>
        <Link href="/th">กลับหน้าแรก</Link>
      </Button>
    </main>
  );
}
