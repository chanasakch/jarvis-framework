import fs from "node:fs";

import type { Meta } from "@/lib/generated/schemas";
import { siteConfig } from "@/site.config";

/** Version from .jarvis/VERSION, install command and repo URL from site.config.ts —
 *  the one hand-maintained source for org/repo (this repo has no git remote yet). */
export function parseMeta(versionFilePath: string): Meta {
  const version = fs.readFileSync(versionFilePath, "utf8").trim();
  return {
    version,
    installCommand: siteConfig.installCommand,
    repoUrl: siteConfig.githubUrl,
    frameworkName: "Jarvis",
  };
}
