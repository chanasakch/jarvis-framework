import fs from "node:fs";

import YAML from "yaml";

import type { ConfigKey } from "@/lib/generated/schemas";

import { configDescriptions } from "./config-descriptions";

/** Object-valued keys documented as one group rather than walked leaf-by-leaf — see
 *  config-descriptions.ts. */
const GROUP_PATHS = new Set([
  "commands.backend",
  "commands.frontend",
  "quality.coverage_min",
  "quality.perf_budget",
  "models.overrides",
]);

function stringifyDefault(value: unknown): string {
  if (typeof value === "string") return value.includes("{{") ? value : value; // keep {{name}} visible as-is
  return JSON.stringify(value);
}

function walk(obj: Record<string, unknown>, prefix: string, out: ConfigKey[]): void {
  for (const [key, value] of Object.entries(obj)) {
    const configPath = prefix ? `${prefix}.${key}` : key;
    const isPlainObject = value !== null && typeof value === "object" && !Array.isArray(value);

    if (isPlainObject && !GROUP_PATHS.has(configPath)) {
      walk(value as Record<string, unknown>, configPath, out);
      continue;
    }

    out.push({ path: configPath, default: stringifyDefault(value), description: "" });
  }
}

/**
 * Walks jarvis-framework/project-templates/jarvis.config.yaml (the project-owned
 * template, not this repo's own already-customized jarvis.config.yaml — the template is
 * what every new install actually starts from) and cross-references every key against
 * config-descriptions.ts. A key with no description, or a description for a key that no
 * longer exists, is reported and excluded — see DECISIONS.md D-019.
 */
export function parseConfig(configPath: string): { keys: ConfigKey[]; undocumented: string[]; stale: string[] } {
  const raw = fs.readFileSync(configPath, "utf8");
  // The shipped template has {{name}} placeholders (substituted by `init` at install
  // time) in positions — like a bare YAML key — that aren't valid YAML on their own.
  // Substitute a real value purely so this parses; the actual installer does the same
  // kind of substitution for real, just with the user's chosen name.
  const doc = YAML.parse(raw.replace(/\{\{name\}\}/g, "jarvis")) as Record<string, unknown>;

  const found: ConfigKey[] = [];
  walk(doc, "", found);

  const foundPaths = new Set(found.map((k) => k.path));
  const undocumented = found.filter((k) => !configDescriptions[k.path]).map((k) => k.path);
  const stale = Object.keys(configDescriptions).filter((p) => !foundPaths.has(p));

  const keys: ConfigKey[] = found
    .filter((k) => configDescriptions[k.path])
    .map((k) => ({ ...k, description: configDescriptions[k.path] as string }));

  return { keys, undocumented, stale };
}
