import fs from "node:fs";
import path from "node:path";

import type { Agent, ChangelogEntry, CliCommand, ConfigKey, Meta, Requirement, SlashCommand, Standard, Workflow } from "./schemas";

const GENERATED_DIR = path.join(process.cwd(), "content", "generated");

function read<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(GENERATED_DIR, file), "utf8")) as T;
}

// Server-only (fs access) — call from Server Components / generateStaticParams only.
// Each generated file is small; no caching needed beyond what the build process
// already does by running these functions once per static page render.
export const getCommands = () => read<SlashCommand[]>("commands.json");
export const getCli = () => read<CliCommand[]>("cli.json");
export const getAgents = () => read<Agent[]>("agents.json");
export const getWorkflows = () => read<Workflow[]>("workflows.json");
export const getConfigKeys = () => read<ConfigKey[]>("config.json");
export const getRequirements = () => read<Requirement[]>("requirements.json");
export const getMeta = () => read<Meta>("meta.json");
export const getChangelog = () => read<ChangelogEntry[]>("changelog.json");
export const getStandards = () => read<Standard[]>("standards.json");
