#!/usr/bin/env tsx
/**
 * Two checks, per SITE_SPEC.md's i18n requirements:
 *  1. Generated-content translations: every key extractTranslatable() produces for the
 *     current EN content should have a Thai entry in content/i18n/generated.th.json.
 *     A missing one is NOT a build failure (it falls back to English with a notice,
 *     by design) — this check reports it, for CI to surface, not to block on.
 *  2. Hand-written MDX parity: every file under content/en/docs/** has a same-named
 *     file under content/th/docs/**, and vice versa.
 *
 * Exit code 0 always for check 1 (report-only); exit 1 if check 2 finds a mismatch,
 * since a missing MDX file is a real 404, not a graceful fallback.
 */
import fs from "node:fs";
import path from "node:path";

import { extractTranslatable } from "../lib/generated/translatable";
import type { Agent, CliCommand, ConfigKey, Requirement, SlashCommand, Standard, Workflow } from "../lib/generated/schemas";

const SITE_ROOT = path.resolve(import.meta.dirname, "..");
const GENERATED = path.join(SITE_ROOT, "content", "generated");
const I18N = path.join(SITE_ROOT, "content", "i18n");

function readJson<T>(file: string, fallback: T): T {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback;
}

function checkGeneratedTranslations(): { missing: string[]; stale: string[]; total: number } {
  const data = {
    commands: readJson<SlashCommand[]>(path.join(GENERATED, "commands.json"), []),
    cli: readJson<CliCommand[]>(path.join(GENERATED, "cli.json"), []),
    agents: readJson<Agent[]>(path.join(GENERATED, "agents.json"), []),
    workflows: readJson<Workflow[]>(path.join(GENERATED, "workflows.json"), []),
    config: readJson<ConfigKey[]>(path.join(GENERATED, "config.json"), []),
    requirements: readJson<Requirement[]>(path.join(GENERATED, "requirements.json"), []),
    standards: readJson<Standard[]>(path.join(GENERATED, "standards.json"), []),
  };
  const expected = extractTranslatable(data);
  const th = readJson<Record<string, string>>(path.join(I18N, "generated.th.json"), {});

  const expectedKeys = new Set(expected.map((i) => i.key));
  const missing = expected.filter((i) => !th[i.key]).map((i) => i.key);
  const stale = Object.keys(th).filter((k) => !expectedKeys.has(k));

  fs.mkdirSync(I18N, { recursive: true });
  fs.writeFileSync(
    path.join(GENERATED, "i18n-report.json"),
    JSON.stringify({ total: expected.length, translated: expected.length - missing.length, missing, stale }, null, 2) + "\n",
  );

  return { missing, stale, total: expected.length };
}

function walkFiles(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walkFiles(full, base) : [path.relative(base, full)];
  });
}

function checkMdxParity(): { onlyEn: string[]; onlyTh: string[] } {
  const enDir = path.join(SITE_ROOT, "content", "en", "docs");
  const thDir = path.join(SITE_ROOT, "content", "th", "docs");
  const en = new Set(walkFiles(enDir));
  const th = new Set(walkFiles(thDir));
  return {
    onlyEn: [...en].filter((f) => !th.has(f)),
    onlyTh: [...th].filter((f) => !en.has(f)),
  };
}

function main() {
  const gen = checkGeneratedTranslations();
  console.log(`Generated content i18n: ${gen.total - gen.missing.length}/${gen.total} keys translated.`);
  if (gen.missing.length) {
    console.log(`  Missing (falls back to English): ${gen.missing.slice(0, 10).join(", ")}${gen.missing.length > 10 ? ` … +${gen.missing.length - 10}` : ""}`);
  }
  if (gen.stale.length) {
    console.log(`  Stale (in generated.th.json but no longer generated): ${gen.stale.join(", ")}`);
  }

  const mdx = checkMdxParity();
  if (mdx.onlyEn.length || mdx.onlyTh.length) {
    console.error("\nMDX parity FAILED:");
    if (mdx.onlyEn.length) console.error(`  English only, no Thai file: ${mdx.onlyEn.join(", ")}`);
    if (mdx.onlyTh.length) console.error(`  Thai only, no English file: ${mdx.onlyTh.join(", ")}`);
    process.exit(1);
  }
  console.log("MDX parity: OK (content/en/docs and content/th/docs have identical file trees).");
}

main();
