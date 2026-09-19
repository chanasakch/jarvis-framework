import { Info, Lightbulb, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CalloutKind = "note" | "tip" | "warning" | "danger";

const META: Record<CalloutKind, { icon: LucideIcon; bg: string; border: string }> = {
  note: { icon: Info, bg: "var(--callout-note)", border: "var(--callout-note-border)" },
  tip: { icon: Lightbulb, bg: "var(--callout-tip)", border: "var(--callout-tip-border)" },
  warning: { icon: TriangleAlert, bg: "var(--callout-warning)", border: "var(--callout-warning-border)" },
  danger: { icon: OctagonAlert, bg: "var(--callout-danger)", border: "var(--callout-danger-border)" },
};

/** Used from MDX as <Callout kind="warning" title="...">...</Callout>. */
export function Callout({
  kind = "note",
  title,
  children,
  className,
}: {
  kind?: CalloutKind;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, bg, border } = META[kind];
  return (
    <div
      data-slot="callout"
      data-kind={kind}
      role={kind === "warning" || kind === "danger" ? "alert" : undefined}
      className={cn("my-4 flex gap-3 rounded-lg border p-4 text-sm", className)}
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="flex flex-col gap-1">
        {title && <p className="font-medium text-foreground">{title}</p>}
        <div className="text-foreground/90 [&_p]:m-0 [&_p+p]:mt-2">{children}</div>
      </div>
    </div>
  );
}
