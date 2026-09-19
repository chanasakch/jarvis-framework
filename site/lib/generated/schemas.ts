import { z } from "zod";

/**
 * Every generated content file has a schema here. `scripts/generate-content.ts` parses
 * it with `.parse()` (not `.safeParse()`) so a shape drift in the framework source fails
 * the build loudly instead of shipping bad reference docs — see SITE_SPEC.md's "Content
 * accuracy (hard rule)".
 */

export const slashCommandSchema = z.object({
  id: z.string(), // "/jarvis", "/jarvis-init", ...
  name: z.string(), // "jarvis", "jarvis-init", ...
  description: z.string(),
  argumentHint: z.string().optional(),
  bodyExcerpt: z.string(),
});
export type SlashCommand = z.infer<typeof slashCommandSchema>;

export const cliCommandSchema = z.object({
  id: z.string(), // "new", "approve", ...
  humanOnly: z.boolean(),
  usage: z.string(), // the syntax fragment, e.g. `new <type> "<title>" [--flags k=v,...]`
  description: z.string(),
});
export type CliCommand = z.infer<typeof cliCommandSchema>;

export const agentSchema = z.object({
  id: z.string(), // "jarvis-po"
  name: z.string(),
  description: z.string(),
  tools: z.array(z.string()),
  model: z.string(),
  role: z.string(),
  modes: z.array(z.string()).optional(),
  inputs: z.string(),
  outputs: z.string(),
});
export type Agent = z.infer<typeof agentSchema>;

export const workflowPhaseSchema = z.object({
  id: z.string(),
  agent: z.string().optional(),
  agents: z.union([z.array(z.string()), z.record(z.string(), z.string())]).optional(),
  owner: z.string().optional(),
  mode: z.string().optional(),
  approval: z.enum(["human", "none"]).optional(),
  optionalIfFalse: z.string().optional(),
});
export type WorkflowPhase = z.infer<typeof workflowPhaseSchema>;

export const workflowSchema = z.object({
  id: z.string(), // "feature"
  idPrefix: z.string(), // "FEAT"
  description: z.string(),
  phases: z.array(workflowPhaseSchema),
});
export type Workflow = z.infer<typeof workflowSchema>;

export const configKeySchema = z.object({
  path: z.string(), // "gates.max_retries"
  default: z.string(),
  description: z.string(),
});
export type ConfigKey = z.infer<typeof configKeySchema>;

export const requirementSchema = z.object({
  id: z.string(),
  label: z.string(),
  profile: z.enum(["always", "go-react"]),
  installHint: z.string().optional(),
});
export type Requirement = z.infer<typeof requirementSchema>;

export const metaSchema = z.object({
  version: z.string(),
  installCommand: z.string(),
  repoUrl: z.string(),
  frameworkName: z.string(),
});
export type Meta = z.infer<typeof metaSchema>;

export const searchIndexItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  group: z.enum(["pages", "commands"]),
  href: z.string(),
  keywords: z.array(z.string()).optional(),
});
export type SearchIndexItem = z.infer<typeof searchIndexItemSchema>;
