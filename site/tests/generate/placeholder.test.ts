import { describe, expect, it } from "vitest";

// Real parser/schema tests land in S4 (content generation). This keeps `npm test`
// green and the config exercised in the meantime.
describe("test runner", () => {
  it("is wired up", () => {
    expect(1 + 1).toBe(2);
  });
});
