#!/usr/bin/env tsx
/**
 * Walks the static export (out/) and verifies every internal href resolves to a real
 * file, accounting for basePath and trailingSlash. Run after `next build` (a separate
 * CI step, not part of the build script itself — see .github/workflows/site.yml, S8).
 * External links and #anchors within a page are out of scope here; a deeper pass
 * (anchor targets, external link status) is S7's job.
 */
import fs from "node:fs";
import path from "node:path";

const SITE_ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(SITE_ROOT, "out");
const basePath = process.env.SITE_BASE_PATH ?? "";

function walkHtml(dir: string, acc: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(full, acc);
    else if (e.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function resolveTarget(href: string): string | null {
  let p = href.split("#")[0]?.split("?")[0];
  if (!p) return null;
  if (basePath && p.startsWith(basePath)) p = p.slice(basePath.length) || "/";
  if (!p.startsWith("/")) return null; // not an internal absolute path
  const clean = p === "/" ? "/index.html" : p.endsWith("/") ? `${p}index.html` : p;
  return path.join(OUT_DIR, clean);
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error(`${path.relative(SITE_ROOT, OUT_DIR)} does not exist — run \`next build\` first.`);
    process.exit(2);
  }

  const files = walkHtml(OUT_DIR);
  const broken: { file: string; href: string }[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    for (const m of html.matchAll(/href="(\/[^"#]*)/g)) {
      const href = m[1];
      if (!href || seen.has(href)) continue;
      seen.add(href);
      const target = resolveTarget(href);
      if (target && !fs.existsSync(target)) {
        broken.push({ file: path.relative(OUT_DIR, file), href });
      }
    }
  }

  if (broken.length) {
    console.error(`Link check FAILED: ${broken.length} broken internal link(s).`);
    broken.forEach((b) => console.error(`  ${b.file} -> ${b.href}`));
    process.exit(1);
  }

  console.log(`Link check: OK (${files.length} pages, ${seen.size} unique internal hrefs checked).`);
}

main();
