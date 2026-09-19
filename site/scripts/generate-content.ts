#!/usr/bin/env tsx
/**
 * Generates site/content/generated/*.json from the real framework source, per
 * SITE_SPEC.md's "Content accuracy (hard rule)". Run before dev and before build
 * (wired into package.json's "dev"/"build" scripts) — never hand-edit the output.
 *
 * Every writer validates with the zod schemas in lib/generated/schemas.ts and throws on
 * a shape mismatch: a build with bad reference content is worse than a failed build.
 */
import fs from "node:fs";
import path from "node:path";

import YAML from "yaml";

import {
  agentSchema,
  changelogEntrySchema,
  cliCommandSchema,
  configKeySchema,
  metaSchema,
  requirementSchema,
  slashCommandSchema,
  standardSchema,
  workflowSchema,
} from "../lib/generated/schemas";
import { parseAgents } from "./generate/parse-agents";
import { parseChangelog } from "./generate/parse-changelog";
import { parseCli } from "./generate/parse-cli";
import { parseCommands } from "./generate/parse-commands";
import { parseConfig } from "./generate/parse-config";
import { parseMeta } from "./generate/parse-meta";
import { parseRequirements } from "./generate/parse-requirements";
import { parseStandards } from "./generate/parse-standards";
import { parseWorkflows } from "./generate/parse-workflows";

const SITE_ROOT = path.resolve(import.meta.dirname, "..");
// Overridable so a fixture copy of the framework can be generated from (tests, and
// proving that newly added agents/workflows/standards surface with no site edit).
const REPO_ROOT = process.env.JARVIS_REPO_ROOT ? path.resolve(process.env.JARVIS_REPO_ROOT) : path.resolve(SITE_ROOT, "..");
const OUT_DIR = path.join(SITE_ROOT, "content", "generated");

function writeJson(name: string, data: unknown) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(data, null, 2) + "\n");
}

function main() {
  const report: string[] = [];

  // Commands
  const { commands: rawCommands, skipped: skippedCommands } = parseCommands(path.join(REPO_ROOT, ".claude/commands"));
  const commands = rawCommands.map((c) => slashCommandSchema.parse(c));
  writeJson("commands.json", commands);
  if (skippedCommands.length) report.push(`commands: skipped ${skippedCommands.join(", ")} (missing frontmatter)`);

  // CLI
  const { commands: rawCli, skipped: skippedCli } = parseCli(path.join(REPO_ROOT, ".jarvis/scripts/jarvis.js"), REPO_ROOT);
  const cli = rawCli.map((c) => cliCommandSchema.parse(c));
  writeJson("cli.json", cli);
  if (skippedCli.length) report.push(`cli: no description for ${skippedCli.join(", ")} (placeholder used)`);

  // Agents
  const { agents: rawAgents, skipped: skippedAgents } = parseAgents(path.join(REPO_ROOT, ".claude/agents"));
  const agents = rawAgents.map((a) => agentSchema.parse(a));
  writeJson("agents.json", agents);
  if (skippedAgents.length) report.push(`agents: skipped ${skippedAgents.join(", ")} (missing frontmatter or sections)`);

  // Workflows
  const jarvisConfig = YAML.parse(fs.readFileSync(path.join(REPO_ROOT, "jarvis.config.yaml"), "utf8"));
  const { workflows: rawWorkflows, skipped: skippedWorkflows } = parseWorkflows(
    path.join(REPO_ROOT, ".jarvis/core/workflows"),
    path.join(REPO_ROOT, ".jarvis/scripts/lib/workflow.js"),
    jarvisConfig,
    path.join(REPO_ROOT, ".jarvis/core/checklists"),
  );
  const workflows = rawWorkflows.map((w) => workflowSchema.parse(w));
  writeJson("workflows.json", workflows);
  if (skippedWorkflows.length) report.push(`workflows: skipped ${skippedWorkflows.join(", ")} (malformed YAML)`);

  // Config reference (from the shipped project template, not this repo's own config)
  const { keys: rawConfig, undocumented, stale } = parseConfig(
    path.join(REPO_ROOT, "jarvis-framework/project-templates/jarvis.config.yaml"),
  );
  if (undocumented.length) report.push(`config: no description for ${undocumented.join(", ")} (placeholder used)`);
  if (stale.length) report.push(`config: config-descriptions.ts documents removed keys: ${stale.join(", ")}`);
  const configKeys = rawConfig.map((k) => configKeySchema.parse(k));
  writeJson("config.json", configKeys);

  // Requirements
  const requirements = parseRequirements(
    path.join(REPO_ROOT, ".jarvis/scripts/jarvis.js"),
    path.join(REPO_ROOT, ".jarvis/package.json"),
    REPO_ROOT,
  ).map((r) => requirementSchema.parse(r));
  writeJson("requirements.json", requirements);

  // Standards
  const { standards: rawStandards, skipped: skippedStandards, unparsedRules } = parseStandards(path.join(REPO_ROOT, ".jarvis/standards"));
  const standards = rawStandards.map((s) => standardSchema.parse(s));
  writeJson("standards.json", standards);
  if (skippedStandards.length) report.push(`standards: skipped ${skippedStandards.join(", ")} (no title or no rule headings)`);
  if (unparsedRules.length) report.push(`standards: rule headings in an unrecognized format: ${unparsedRules.join("; ")}`);

  // Meta
  const meta = metaSchema.parse(parseMeta(path.join(REPO_ROOT, ".jarvis/VERSION")));
  writeJson("meta.json", meta);

  // Changelog
  const changelog = parseChangelog(path.join(REPO_ROOT, "CHANGELOG.md")).map((e) => changelogEntrySchema.parse(e));
  writeJson("changelog.json", changelog);

  console.log(`Generated content in ${path.relative(SITE_ROOT, OUT_DIR)}/:`);
  console.log(`  commands.json      ${commands.length} entries`);
  console.log(`  cli.json           ${cli.length} entries`);
  console.log(`  agents.json        ${agents.length} entries`);
  console.log(`  workflows.json     ${workflows.length} entries`);
  console.log(`  config.json        ${configKeys.length} entries`);
  console.log(`  requirements.json  ${requirements.length} entries`);
  console.log(`  standards.json     ${standards.length} entries`);
  console.log(`  meta.json          version ${meta.version}`);
  console.log(`  changelog.json     ${changelog.length} entries`);
  if (report.length) {
    console.log("\nNotes:");
    report.forEach((line) => console.log(`  - ${line}`));
  }
}

main();
