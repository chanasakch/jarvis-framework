import {
  ClipboardList,
  Cloud,
  FlaskConical,
  GitBranch,
  Layers,
  ListChecks,
  Microscope,
  Monitor,
  PackageCheck,
  PenTool,
  Ruler,
  Scale,
  Server,
  ShieldCheck,
  Telescope,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

import { getAgents, getCommands } from "@/lib/generated/loaders";
import type { Dictionary } from "@/lib/i18n";
import { ROLES, validateRoles, type RoleId } from "@/lib/sdlc/model";
import { cn } from "@/lib/utils";

const ICONS: Record<RoleId, LucideIcon> = {
  "product-owner": ClipboardList,
  "business-analyst": GitBranch,
  "ux-designer": PenTool,
  "solution-architect": Ruler,
  "tech-lead": ListChecks,
  "backend-developer": Server,
  "frontend-developer": Monitor,
  "full-stack-developer": Layers,
  "qa-engineer": FlaskConical,
  reviewers: ShieldCheck,
  "devops-engineer": Cloud,
  "release-manager": PackageCheck,
  investigator: Microscope,
  "staff-engineer": Telescope,
  "project-manager": Waypoints,
  gatekeeper: Scale,
};

const chip =
  "rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs break-all";

/**
 * The team you would hire, mapped to the Jarvis agent or command that covers each role.
 * The mapping is editorial (lib/sdlc/model.ts); `validateRoles` throws if it names an
 * agent or slash command the framework does not have, so this list cannot go stale.
 */
export function RoleMap({ dict }: { dict: Dictionary }) {
  const agents = getAgents();
  const commands = getCommands();
  validateRoles(agents, commands);
  const { roles } = dict.sdlc;

  return (
    <ul className="not-prose my-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {ROLES.map((role) => {
        const Icon = ICONS[role.id];
        const copy = roles.items[role.id];
        return (
          <li
            key={role.id}
            className="flex flex-col rounded-lg border border-border bg-card p-4 transition-colors duration-(--motion-fast) hover:border-brand"
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-brand"
              >
                <Icon className="size-4" />
              </span>
              <h3 className="text-sm font-semibold">{copy.name}</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{copy.note}</p>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
              {role.agents.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  {roles.noAgent}
                </span>
              )}
              {role.agents.map((a) => (
                <span key={a} className={chip}>
                  {a}
                </span>
              ))}
              {(role.commands ?? []).map((c) => (
                <span
                  key={c}
                  className={cn(chip, "border-dashed")}
                  title={roles.commandsLabel}
                >
                  /{c}
                </span>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
