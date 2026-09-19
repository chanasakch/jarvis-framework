#!/usr/bin/env tsx
/**
 * Every route under app/(en)/ must have a matching file under app/th/, and vice versa —
 * the guard for D-018's "two thin parallel route trees": since there's no shared
 * `[locale]` segment enforcing this structurally, a route added to one tree and
 * forgotten in the other would silently 404 for that locale. /dev/tokens lives outside
 * both trees entirely (app/dev/, its own layout) precisely so it never needs a Thai
 * counterpart — see app/dev/layout.tsx and DECISIONS.md.
 */
import fs from "node:fs";
import path from "node:path";

const SITE_ROOT = path.resolve(import.meta.dirname, "..");
const EN_DIR = path.join(SITE_ROOT, "app", "(en)");
const TH_DIR = path.join(SITE_ROOT, "app", "th");

function walk(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full, base) : [path.relative(base, full)];
  });
}

function main() {
  const en = new Set(walk(EN_DIR));
  const th = new Set(walk(TH_DIR));

  const onlyEn = [...en].filter((f) => !th.has(f));
  const onlyTh = [...th].filter((f) => !en.has(f));

  if (onlyEn.length || onlyTh.length) {
    console.error("Route parity FAILED between app/(en)/ and app/th/:");
    if (onlyEn.length) console.error(`  English only: ${onlyEn.join(", ")}`);
    if (onlyTh.length) console.error(`  Thai only: ${onlyTh.join(", ")}`);
    process.exit(1);
  }

  console.log(`Route parity: OK (${en.size} files in each locale tree).`);
}

main();
