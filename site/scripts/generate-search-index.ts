#!/usr/bin/env tsx
/**
 * Builds content/generated/search-index.<locale>.json — commands, CLI commands, agents
 * and workflows, one file per locale so the ⌘K palette (components/search/command-palette.tsx)
 * only ever downloads the language actually in use. Copied into public/ so the static
 * export serves it as a plain asset. Run after generate-content.ts (package.json build
 * script order).
 */
import fs from "node:fs";
import path from "node:path";

import type { Agent, CliCommand, SlashCommand, Workflow } from "../lib/generated/schemas";
import { translate } from "../lib/generated/translatable";
import type { SearchIndexItem } from "../lib/generated/schemas";
import { LOCALES, localizeHref, type Locale } from "../lib/i18n";

const SITE_ROOT = path.resolve(import.meta.dirname, "..");
const GENERATED = path.join(SITE_ROOT, "content", "generated");
const PUBLIC = path.join(SITE_ROOT, "public");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function buildIndex(locale: Locale, thDict: Record<string, string>): SearchIndexItem[] {
  const commands = readJson<SlashCommand[]>(path.join(GENERATED, "commands.json"));
  const cli = readJson<CliCommand[]>(path.join(GENERATED, "cli.json"));
  const agents = readJson<Agent[]>(path.join(GENERATED, "agents.json"));
  const workflows = readJson<Workflow[]>(path.join(GENERATED, "workflows.json"));

  const items: SearchIndexItem[] = [];
  const t = (key: string, en: string) => (locale === "en" ? en : translate(key, en, thDict).text);

  for (const c of commands) {
    items.push({
      id: `command:${c.name}`,
      title: c.id,
      group: "commands",
      href: localizeHref(locale, "/docs/commands"),
      keywords: [t(`command:${c.name}.description`, c.description)],
    });
  }
  for (const c of cli) {
    items.push({
      id: `cli:${c.id}`,
      title: c.usage,
      group: "commands",
      href: localizeHref(locale, "/docs/commands"),
      keywords: [t(`cli:${c.id}.description`, c.description)],
    });
  }
  for (const a of agents) {
    items.push({
      id: `agent:${a.id}`,
      title: a.id,
      group: "pages",
      href: localizeHref(locale, "/docs/agents"),
      keywords: [t(`agent:${a.id}.description`, a.description)],
    });
  }
  for (const w of workflows) {
    items.push({
      id: `workflow:${w.id}`,
      title: w.id,
      group: "pages",
      href: localizeHref(locale, "/docs/workflows"),
      keywords: [t(`workflow:${w.id}.description`, w.description)],
    });
  }

  return items;
}

function main() {
  const thDict = fs.existsSync(path.join(SITE_ROOT, "content", "i18n", "generated.th.json"))
    ? readJson<Record<string, string>>(path.join(SITE_ROOT, "content", "i18n", "generated.th.json"))
    : {};

  fs.mkdirSync(PUBLIC, { recursive: true });
  for (const locale of LOCALES) {
    const index = buildIndex(locale, thDict);
    fs.writeFileSync(path.join(PUBLIC, `search-index.${locale}.json`), JSON.stringify(index));
    console.log(`search-index.${locale}.json: ${index.length} items`);
  }
}

main();
