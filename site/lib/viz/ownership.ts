import fs from "node:fs";
import path from "node:path";

/**
 * Which files belong to the framework and which to the project, as `jarvis-framework upgrade`
 * treats them. The lists mirror FRAMEWORK and PROJECT in .jarvis/scripts/pack.js (the same
 * lists the installer copies), so a reader is told exactly what an upgrade replaces and what
 * it never touches. `validateOwnership` throws at build time if a listed path is gone from the
 * repo, so the diagram cannot describe files that no longer exist.
 */
export const OWNERSHIP = {
  framework: [".claude/agents", ".claude/commands", ".jarvis/core", ".jarvis/scripts", ".jarvis/package.json"],
  project: [
    "jarvis.config.yaml",
    "CLAUDE.md",
    ".jarvis/standards",
    ".jarvis/project/context.md",
    "packages/errors/registry.yaml",
    "docs/architecture/query-index-matrix.md",
    "docs/architecture/tech-debt.md",
  ],
  /** Created and grown by the CLI and the agents as work happens. Not checked for existence:
   *  git does not track an empty folder, so a fresh checkout has none of these yet. */
  runtime: [".jarvis/state", "docs/work", "docs/adr"],
} as const;

export type OwnedPath = (typeof OWNERSHIP)[keyof typeof OWNERSHIP][number];
export const ALL_OWNED: OwnedPath[] = [...OWNERSHIP.framework, ...OWNERSHIP.project, ...OWNERSHIP.runtime];

/** Throws if a framework-owned or project-owned path is missing from the repo checkout. */
export function validateOwnership(repoRoot: string = path.resolve(process.cwd(), "..")): void {
  for (const rel of [...OWNERSHIP.framework, ...OWNERSHIP.project]) {
    if (!fs.existsSync(path.join(repoRoot, rel))) {
      throw new Error(`the ownership map lists "${rel}", which is not in the repo at ${repoRoot}. Update lib/viz/ownership.ts.`);
    }
  }
}
