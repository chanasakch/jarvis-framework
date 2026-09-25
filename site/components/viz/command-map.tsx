import { Lock, ShieldBan } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import type { CliCommand, SlashCommand } from "@/lib/generated/schemas";
import type { Dictionary } from "@/lib/i18n";
import { stagger } from "@/lib/reveal";

const chip = "rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs";

/**
 * Who can run what, drawn from the generated command data: slash commands and the CLI verbs
 * Claude may run on the left, and the human-only verbs on the right, behind the line guard.js
 * draws. The split is the CLI's own `humanOnly` flag, so a command that becomes human-only
 * moves across the line on the next build.
 */
export function CommandMap({ dict, commands, cli }: { dict: Dictionary; commands: SlashCommand[]; cli: CliCommand[] }) {
  const t = dict.viz.commandMap;
  const claudeCli = cli.filter((c) => !c.humanOnly);
  const humanCli = cli.filter((c) => c.humanOnly);

  return (
    <Reveal className="not-prose @container my-6">
      <p className="mb-3 text-sm text-muted-foreground">{t.intro}</p>

      <div className="grid gap-3 @2xl:grid-cols-[1fr_auto_minmax(0,16rem)] @2xl:gap-0">
        <div style={stagger(0)} className="reveal rounded-lg border border-border bg-card p-4 @2xl:rounded-r-none @2xl:border-r-0">
          <p className="text-xs font-medium tracking-wide text-brand uppercase">
            {t.claude} <span className="text-muted-foreground">({commands.length + claudeCli.length})</span>
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t.slash} ({commands.length})
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {commands.map((c) => (
              <li key={c.id} className={chip}>
                {c.id}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            {t.cli} ({claudeCli.length})
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {claudeCli.map((c) => (
              <li key={c.id} className={chip}>
                {c.id}
              </li>
            ))}
          </ul>
        </div>

        {/* The line guard.js draws. It is drawn in once when the map scrolls in. */}
        <div aria-hidden="true" className="relative flex items-center justify-center py-1 @2xl:w-12 @2xl:py-0">
          <span className="chart-draw absolute inset-x-0 top-1/2 h-0 border-t-2 border-dashed border-phase-gate-failed @2xl:inset-x-auto @2xl:inset-y-0 @2xl:left-1/2 @2xl:top-0 @2xl:h-auto @2xl:border-t-0 @2xl:border-l-2" />
          <span style={stagger(1)} className="reveal relative z-10 flex items-center gap-1.5 rounded-full border border-phase-gate-failed/50 bg-background px-2.5 py-1 text-[11px] font-medium text-phase-gate-failed @2xl:flex-col @2xl:rounded-lg @2xl:px-2 @2xl:py-2 @2xl:text-center">
            <ShieldBan className="size-4" />
            {t.barrier}
          </span>
        </div>

        <div style={stagger(2)} className="reveal rounded-lg border border-phase-gate-failed/30 bg-phase-gate-failed/5 p-4 @2xl:rounded-l-none @2xl:border-l-0">
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-phase-gate-failed uppercase">
            <Lock aria-hidden="true" className="size-3.5" />
            {t.you} <span className="text-muted-foreground">({humanCli.length})</span>
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {humanCli.map((c) => (
              <li key={c.id} className={`${chip} border-phase-gate-failed/40 bg-background`}>
                {c.id}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{t.note}</p>
    </Reveal>
  );
}
