import type { Dictionary } from "@/lib/i18n";
import { CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";

export function ProblemApproach({ dict }: { dict: Dictionary }) {
  const { problem } = dict.landing;

  return (
    <section className={cn(CONTAINER, "py-16")}>
      <h2 className="sr-only">{problem.heading}</h2>
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{problem.problemLabel}</p>
          <h3 className="text-lg font-semibold text-balance">{problem.problemTitle}</h3>
          <p className="text-sm text-muted-foreground">{problem.problemBody}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-brand uppercase">{problem.approachLabel}</p>
          <h3 className="text-lg font-semibold text-balance">{problem.approachTitle}</h3>
          <p className="text-sm text-muted-foreground">{problem.approachBody}</p>
        </div>
      </div>
    </section>
  );
}
