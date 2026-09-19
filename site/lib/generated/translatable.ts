import type { Agent, CliCommand, ConfigKey, Requirement, SlashCommand, Workflow } from "./schemas";

/**
 * One flat {key, en} pair per translatable string across all generated content.
 * `content/i18n/generated.th.json` maps these same keys to Thai text; a key missing
 * there falls back to the English value here (SITE_SPEC.md's "missing Thai content
 * falls back to English with a small notice"). IDs, paths, commands and code are never
 * in this list — only free-text description/role/label fields.
 */
export interface TranslatableItem {
  key: string;
  en: string;
}

export function extractTranslatable(data: {
  commands: SlashCommand[];
  cli: CliCommand[];
  agents: Agent[];
  workflows: Workflow[];
  config: ConfigKey[];
  requirements: Requirement[];
}): TranslatableItem[] {
  const items: TranslatableItem[] = [];

  for (const c of data.commands) {
    items.push({ key: `command:${c.name}.description`, en: c.description });
    items.push({ key: `command:${c.name}.bodyExcerpt`, en: c.bodyExcerpt });
  }
  for (const c of data.cli) {
    items.push({ key: `cli:${c.id}.description`, en: c.description });
  }
  for (const a of data.agents) {
    items.push({ key: `agent:${a.id}.description`, en: a.description });
    items.push({ key: `agent:${a.id}.role`, en: a.role });
  }
  for (const w of data.workflows) {
    items.push({ key: `workflow:${w.id}.description`, en: w.description });
  }
  for (const c of data.config) {
    items.push({ key: `config:${c.path}.description`, en: c.description });
  }
  for (const r of data.requirements) {
    items.push({ key: `requirement:${r.id}.label`, en: r.label });
  }

  return items;
}

/** `t(key, en, dict)` — Thai lookup with an English fallback; never throws on a
 *  missing key, matching the "fall back with a notice" behavior. The notice itself is
 *  rendered by the caller (reference components), keyed off `hasTranslation`. */
export function translate(key: string, en: string, thDict: Record<string, string>): { text: string; hasTranslation: boolean } {
  const th = thDict[key];
  return th ? { text: th, hasTranslation: true } : { text: en, hasTranslation: false };
}
