import { FeatureGrid } from "@/components/landing/feature-grid";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { MeetJarvis } from "@/components/landing/meet-jarvis";
import { LifecycleSection } from "@/components/landing/lifecycle-section";
import { ProblemApproach } from "@/components/landing/problem-approach";
import { StatsStrip } from "@/components/landing/stats-strip";
import { SdlcPipeline } from "@/components/landing/sdlc-pipeline";
import { TerminalReplay } from "@/components/landing/terminal-replay";
import { getWorkflows } from "@/lib/generated/loaders";
import type { Dictionary, Locale } from "@/lib/i18n";

/**
 * Shared implementation behind both app/(en)/page.tsx and app/th/page.tsx — the same
 * "thin wrapper, shared logic" pattern as the docs route (DECISIONS.md D-018).
 */
export function LandingPage({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const workflows = getWorkflows();

  return (
    <main id="main-content">
      <Hero locale={locale} dict={dict} />
      <StatsStrip dict={dict} />
      <MeetJarvis dict={dict} />
      <ProblemApproach dict={dict} />
      <LifecycleSection locale={locale} dict={dict} />
      <SdlcPipeline dict={dict} workflows={workflows} />
      <FeatureGrid dict={dict} />
      <TerminalReplay dict={dict} />
      <FinalCta locale={locale} dict={dict} />
    </main>
  );
}
