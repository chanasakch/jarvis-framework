// Placeholder landing page — replaced with the full hero/pipeline/replay build in S5.
// Exists now so the app builds and the token/primitive work in S2 is visually checkable
// in context, not just on /dev/tokens.
export default function HomePage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-display-lg font-semibold tracking-tight">Jarvis</h1>
      <p className="text-muted-foreground">
        An AI-driven SDLC framework for Claude Code. Landing page content lands in step S5.
      </p>
    </main>
  );
}
