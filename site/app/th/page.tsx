import { LocalePreferenceRedirect } from "@/components/i18n/locale-preference";

// Placeholder — see app/(en)/page.tsx. Full Thai landing content lands in step S5.
export default function ThaiHomePage() {
  return (
    <>
      <LocalePreferenceRedirect locale="th" />
      <main id="main-content" className="mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-display-lg font-semibold tracking-tight">Jarvis</h1>
        <p className="text-muted-foreground">
          เฟรมเวิร์ก SDLC ที่ขับเคลื่อนด้วย AI สำหรับ Claude Code เนื้อหาหน้า landing แบบเต็มจะเพิ่มในขั้น S5
        </p>
      </main>
    </>
  );
}
