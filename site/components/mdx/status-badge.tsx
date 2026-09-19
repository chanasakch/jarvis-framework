import {
  Ban,
  BadgeCheck,
  Circle,
  CircleCheck,
  CirclePause,
  CircleX,
  Info,
  LoaderCircle,
  ShieldAlert,
  ShieldOff,
  SkipForward,
  TriangleAlert,
  User,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The one status-indicator component for the whole site: phase status (conventions.md
 * §6.3), review severity (conventions.md §4) and approval requirement. Every value pairs
 * an icon, a color and a caller-supplied label — color is never the only signal
 * (SITE_SPEC.md design direction; SYSTEM_DESIGN.md §1/§17.2). Labels come from the
 * caller (i18n dictionary), not hardcoded here — this component is presentation only.
 */

export type PhaseStatus =
  | "pending"
  | "in_progress"
  | "gate_failed"
  | "passed"
  | "approved"
  | "forced"
  | "skipped"
  | "blocked"
  | "parked";

export type Severity = "critical" | "major" | "minor" | "info";
export type Approval = "human" | "none";

type Kind =
  | { kind: "phase"; value: PhaseStatus }
  | { kind: "severity"; value: Severity }
  | { kind: "approval"; value: Approval };

const PHASE_META: Record<PhaseStatus, { icon: LucideIcon; color: string }> = {
  pending: { icon: Circle, color: "var(--phase-pending)" },
  in_progress: { icon: LoaderCircle, color: "var(--phase-in-progress)" },
  gate_failed: { icon: CircleX, color: "var(--phase-gate-failed)" },
  passed: { icon: CircleCheck, color: "var(--phase-passed)" },
  approved: { icon: BadgeCheck, color: "var(--phase-approved)" },
  forced: { icon: TriangleAlert, color: "var(--phase-forced)" },
  skipped: { icon: SkipForward, color: "var(--phase-skipped)" },
  blocked: { icon: Ban, color: "var(--phase-blocked)" },
  parked: { icon: CirclePause, color: "var(--phase-parked)" },
};

const SEVERITY_META: Record<Severity, { icon: LucideIcon; color: string }> = {
  critical: { icon: ShieldAlert, color: "var(--severity-critical)" },
  major: { icon: TriangleAlert, color: "var(--severity-major)" },
  minor: { icon: Info, color: "var(--severity-minor)" },
  info: { icon: Info, color: "var(--severity-info)" },
};

const APPROVAL_META: Record<Approval, { icon: LucideIcon; color: string }> = {
  human: { icon: User, color: "var(--approval-human)" },
  none: { icon: ShieldOff, color: "var(--approval-none)" },
};

function meta(props: Kind) {
  if (props.kind === "phase") return PHASE_META[props.value];
  if (props.kind === "severity") return SEVERITY_META[props.value];
  return APPROVAL_META[props.value];
}

export function StatusBadge({
  label,
  className,
  ...props
}: Kind & { label: string; className?: string }) {
  const { icon: Icon, color } = meta(props);
  return (
    <span
      data-slot="status-badge"
      data-kind={props.kind}
      data-value={props.value}
      // A fixed neutral background (--muted), not a tint derived from the indicator
      // color itself: an axe-core pass found the earlier self-referential
      // color-mix(color, transparent) background made contrast math circular — darkening
      // the foreground darkened its own background too, so several tokens stayed under
      // 4.5:1 no matter how far they were pushed. Every (foreground, --muted) pair is
      // now checked and passes with margin (>= 5.0:1) in both themes — see the token
      // comments in app/globals.css. This also matches the reference's own badge
      // pattern: colored icon + text on a stable neutral chip, not a colored fill.
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={{ color }}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}
