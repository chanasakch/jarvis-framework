import { JarvisOrb } from "@/components/landing/jarvis-orb";
import { Reveal } from "@/components/ui/reveal";
import type { Dictionary } from "@/lib/i18n";
import { CONTAINER } from "@/lib/layout";
import { stagger } from "@/lib/reveal";
import { cn } from "@/lib/utils";

/**
 * Its own section on the landing page that says what Jarvis is: the /jarvis entry point. The
 * steps restate what the orchestrator does (read state, hand a phase to its agent, stop at the
 * gate), all documented in the concepts and gates pages, so the copy adds no claim of its own.
 */
export function MeetJarvis({ dict }: { dict: Dictionary }) {
  const { meet } = dict.landing;

  return (
    <section
      aria-labelledby="meet-heading"
      className={cn(CONTAINER, "py-16 sm:py-24")}
    >
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <JarvisOrb pauseLabel={meet.pause} playLabel={meet.play} />
        <div>
          <p className="text-xs font-medium tracking-wider text-brand uppercase">
            {meet.eyebrow}
          </p>
          <h2
            id="meet-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          >
            {meet.heading}
          </h2>
          <p className="mt-3 text-muted-foreground">{meet.body}</p>
          <Reveal threshold={0.3} className="mt-6">
            <ol className="space-y-4">
              {meet.steps.map((step, i) => (
                <li
                  key={step.title}
                  style={stagger(i)}
                  className="reveal flex gap-3"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 font-mono text-sm text-brand tabular-nums"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium">{step.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
