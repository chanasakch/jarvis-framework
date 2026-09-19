#!/usr/bin/env tsx
/**
 * Walks the static export (out/) and verifies every internal href resolves to a real
 * file — AND, when the href carries a `#fragment`, that the target page actually has an
 * element with that id — accounting for basePath and trailingSlash. Run after
 * `next build` (a separate CI step, not part of the build script itself — see
 * .github/workflows/site.yml, S8). External links are out of scope (no network calls
 * from a build script).
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

/** Strips a leading basePath (if configured) and resolves to the on-disk HTML file a
 *  path-only href (no fragment) would load. Returns null for anything not internal. */
function resolveFile(pathOnly: string): string | null {
  let p = pathOnly;
  if (basePath && p.startsWith(basePath)) p = p.slice(basePath.length) || "/";
  if (!p.startsWith("/")) return null;
  const clean = p === "/" ? "/index.html" : p.endsWith("/") ? `${p}index.html` : p;
  return path.join(OUT_DIR, clean);
}

const idCache = new Map<string, Set<string> | null>();
function idsIn(file: string): Set<string> | null {
  if (idCache.has(file)) return idCache.get(file) ?? null;
  if (!fs.existsSync(file)) {
    idCache.set(file, null);
    return null;
  }
  const html = fs.readFileSync(file, "utf8");
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).filter((id): id is string => !!id));
  idCache.set(file, ids);
  return ids;
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error(`${path.relative(SITE_ROOT, OUT_DIR)} does not exist — run \`next build\` first.`);
    process.exit(2);
  }
  if (basePath && !basePath.startsWith("/")) {
    console.error(`SITE_BASE_PATH must start with "/", got "${basePath}".`);
    process.exit(2);
  }

  const files = walkHtml(OUT_DIR);
  const brokenLinks: { file: string; href: string }[] = [];
  const brokenAnchors: { file: string; href: string }[] = [];
  const seen = new Set<string>();
  let anchorsChecked = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    // Matches both cross-page links ("/docs/gates#force...") and same-page anchors
    // ("#the-orchestrator", e.g. every DocsToc entry) — a same-page anchor has no path
    // component at all, only a fragment.
    for (const m of html.matchAll(/href="(\/[^"]*|#[^"]*)/g)) {
      const href = m[1];
      if (!href) continue;
      // A same-page anchor ("#overview") means something different on every page, so it
      // must be deduped per-file; a path-based href ("/docs/gates#force...") resolves
      // to the same target regardless of which page links to it, so a global key is fine.
      const dedupeKey = href.startsWith("#") ? `${file}${href}` : href;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const [pathOnly, fragment] = href.split("#");
      const cleanPath = pathOnly?.split("?")[0];

      const targetFile = cleanPath ? resolveFile(cleanPath) : file; // no path => same page
      if (!targetFile) continue;

      if (cleanPath && !fs.existsSync(targetFile)) {
        brokenLinks.push({ file: path.relative(OUT_DIR, file), href });
        continue;
      }

      if (fragment) {
        anchorsChecked++;
        const ids = idsIn(targetFile);
        // Next.js percent-encodes non-ASCII characters in the rendered href (e.g. a
        // Thai heading's slug), but the target element's raw `id="..."` attribute is
        // not encoded — decode before comparing, or every non-Latin heading id "fails."
        let decoded = fragment;
        try {
          decoded = decodeURIComponent(fragment);
        } catch {
          // malformed percent-encoding — compare as-is, will correctly fail below
        }
        if (!ids?.has(decoded)) {
          brokenAnchors.push({ file: path.relative(OUT_DIR, file), href });
        }
      }
    }
  }

  if (brokenLinks.length || brokenAnchors.length) {
    console.error(`Link check FAILED: ${brokenLinks.length} broken link(s), ${brokenAnchors.length} broken anchor(s).`);
    brokenLinks.forEach((b) => console.error(`  [missing file]   ${b.file} -> ${b.href}`));
    brokenAnchors.forEach((b) => console.error(`  [missing anchor] ${b.file} -> ${b.href}`));
    process.exit(1);
  }

  console.log(
    `Link check: OK (${files.length} pages, ${seen.size} unique internal hrefs, ${anchorsChecked} anchors checked` +
      `${basePath ? `, basePath=${basePath}` : ""}).`,
  );
}

main();
