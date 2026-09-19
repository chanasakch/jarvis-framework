import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseConfig } from "../../scripts/generate/parse-config";

function writeTmpConfig(yaml: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jarvis-config-test-"));
  const file = path.join(dir, "jarvis.config.yaml");
  fs.writeFileSync(file, yaml);
  return file;
}

describe("parseConfig", () => {
  it("substitutes {{name}} so the template parses, and resolves real config-descriptions.ts entries", () => {
    const file = writeTmpConfig("jarvis:\n  name: {{name}}\n  version: 1.0.0\n");
    const { keys, undocumented } = parseConfig(file);
    expect(undocumented).toEqual([]);
    const byPath = Object.fromEntries(keys.map((k) => [k.path, k]));
    expect(byPath["jarvis.name"]?.default).toBe("jarvis");
    expect(byPath["jarvis.version"]?.default).toBe("1.0.0");
    expect(byPath["jarvis.name"]?.description).toMatch(/prefix/i);
  });

  it("reports a real config key with no description in config-descriptions.ts", () => {
    const file = writeTmpConfig("totally_new_section:\n  made_up_key: 1\n");
    const { undocumented } = parseConfig(file);
    expect(undocumented).toEqual(["totally_new_section.made_up_key"]);
  });

  it("treats configured group paths (e.g. commands.backend) as one leaf, not walked further", () => {
    const file = writeTmpConfig("commands:\n  backend:\n    format: gofmt\n    lint: golangci-lint\n");
    const { keys, undocumented } = parseConfig(file);
    expect(undocumented).toEqual([]);
    expect(keys.some((k) => k.path === "commands.backend")).toBe(true);
    expect(keys.some((k) => k.path === "commands.backend.format")).toBe(false);
  });

  it("falls back to the key's inline comment, then a placeholder, instead of failing", () => {
    const file = writeTmpConfig("new_section:\n  commented: 3   # retries before giving up\n  bare: true\n");
    const { keys, undocumented } = parseConfig(file);
    const byPath = Object.fromEntries(keys.map((k) => [k.path, k.description]));
    expect(byPath["new_section.commented"]).toBe("retries before giving up");
    expect(byPath["new_section.bare"]).toMatch(/No description yet/);
    expect(undocumented).toEqual(["new_section.bare"]);
  });
});
