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

export const UNDOCUMENTED_CONFIG_DESCRIPTION = "No description yet — see the comments in jarvis.config.yaml.";

/** Inline `# comment` on each scalar/sequence key, keyed by dotted path. */
function inlineComments(text: string): Map<string, string> {
  const out = new Map<string, string>();
  const visit = (node: unknown, prefix: string) => {
    if (!YAML.isMap(node)) return;
    for (const pair of node.items) {
      const key = YAML.isScalar(pair.key) ? String(pair.key.value) : String(pair.key);
      const p = prefix ? `${prefix}.${key}` : key;
      const value = pair.value;
      if (YAML.isMap(value)) {
        visit(value, p);
      } else if ((YAML.isScalar(value) || YAML.isSeq(value)) && value.comment) {
        out.set(p, value.comment.trim());
      }
    }
  };
  visit(YAML.parseDocument(text).contents, "");
  return out;
}

/**
 * Walks jarvis-framework/project-templates/jarvis.config.yaml (the template every new
 * install starts from). Description priority: config-descriptions.ts, then the key's own
 * inline `# comment` in the template, then a generic placeholder. A key added to the
 * framework later therefore appears on the site without a site edit; `undocumented`
 * (placeholder used) and `stale` (description for a removed key) are reported, not fatal.
 */
export function parseConfig(configPath: string): { keys: ConfigKey[]; undocumented: string[]; stale: string[] } {
  // The shipped template has {{name}} placeholders (substituted by `init` at install
  // time) in positions — like a bare YAML key — that aren't valid YAML on their own.
  const text = fs.readFileSync(configPath, "utf8").replace(/\{\{name\}\}/g, "jarvis");
  const doc = YAML.parse(text) as Record<string, unknown>;
  const comments = inlineComments(text);

  const found: ConfigKey[] = [];
  walk(doc, "", found);

  const foundPaths = new Set(found.map((k) => k.path));
  const undocumented: string[] = [];
  const stale = Object.keys(configDescriptions).filter((p) => !foundPaths.has(p));

  const keys: ConfigKey[] = found.map((k) => {
    const description = configDescriptions[k.path] ?? comments.get(k.path);
    if (!description) undocumented.push(k.path);
    return { ...k, description: description ?? UNDOCUMENTED_CONFIG_DESCRIPTION };
  });

  return { keys, undocumented, stale };
}
