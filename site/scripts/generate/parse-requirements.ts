import fs from "node:fs";
import { execFileSync } from "node:child_process";

import type { Requirement } from "@/lib/generated/schemas";

/** Real, from .jarvis/scripts/jarvis.js's own doctor() tool list — node/git gate every
 *  work type; the rest only matter for the shipped Go + React profile. Update this set
 *  if doctor() ever checks a tool outside that split. */
const ALWAYS_REQUIRED = new Set(["node", "git"]);

interface DoctorListJson {
  requirements: Array<{ id: string; label: string; profile: "always" | "go-react"; installHint?: string }>;
}

/**
 * Prefers `jarvis.js doctor --list --json` (a structured, stable interface) when it
 * exists; falls back to parsing doctor()'s own source for the `tool(name, cmd, hint)`
 * calls it currently makes. Both paths read real framework state — neither invents a
 * requirement. The CLI flag is pending a framework change gated behind JARVIS_DEV=1
 * (guard.js G1); see PROGRESS.md. Node's own minimum comes from .jarvis/package.json.
 */
export function parseRequirements(jarvisJsPath: string, jarvisPackageJsonPath: string, cwd: string): Requirement[] {
  const nodeEngine = JSON.parse(fs.readFileSync(jarvisPackageJsonPath, "utf8")).engines?.node as string | undefined;
  const requirements: Requirement[] = [];
  if (nodeEngine) {
    requirements.push({ id: "node-scripts", label: `Node.js ${nodeEngine} (runs .jarvis/scripts)`, profile: "always" });
  }

  const fromListFlag = tryDoctorListJson(jarvisJsPath, cwd);
  if (fromListFlag) {
    requirements.push(...fromListFlag.filter((r) => r.id !== "node")); // avoid duplicating the engines-derived entry
    return requirements;
  }

  requirements.push(...parseDoctorSource(jarvisJsPath));
  return requirements;
}

function tryDoctorListJson(jarvisJsPath: string, cwd: string): Requirement[] | null {
  try {
    const raw = execFileSync("node", [jarvisJsPath, "doctor", "--list", "--json"], { cwd, encoding: "utf8" });
    const data = JSON.parse(raw) as DoctorListJson;
    return data.requirements.map((r) => ({ id: r.id, label: r.label, profile: r.profile, installHint: r.installHint }));
  } catch {
    return null; // flag doesn't exist yet on this CLI version — fall back
  }
}

function parseDoctorSource(jarvisJsPath: string): Requirement[] {
  const src = fs.readFileSync(jarvisJsPath, "utf8");
  const doctorBody = src.match(/doctor\(root[^{]*\)\s*{([\s\S]*?)\n {2}},\n\n {2}\/\/ -{3,} human-only/);
  const scope = doctorBody?.[1] ?? src;

  const calls = [...scope.matchAll(/tool\(\s*'([^']+)'\s*,\s*'([^']+)'(?:\s*,\s*'([^']+)')?\s*\)/g)]
    .map((m) => ({ name: m[1], installHint: m[3] }))
    .filter((c): c is { name: string; installHint: string | undefined } => !!c.name && c.name !== "node"); // node covered by the engines-derived entry above

  return calls.map(({ name, installHint }) => ({
    id: name,
    label: name,
    profile: ALWAYS_REQUIRED.has(name) ? ("always" as const) : ("go-react" as const),
    installHint,
  }));
}
