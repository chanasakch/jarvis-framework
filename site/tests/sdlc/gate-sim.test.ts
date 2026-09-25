import { describe, expect, it } from "vitest";

import { ACTIONS, initGate, stepGate, type GateEvent, type GateState } from "@/lib/viz/gate-sim";

const run = (state: GateState, events: GateEvent[], max = 3) => events.reduce((s, e) => stepGate(s, e, max).state, state);

describe("the gate protocol", () => {
  it("walks agent, script, gatekeeper, then stops for approval when the phase needs it", () => {
    const s = run(initGate(true), ["done", "pass", "pass"]);
    expect(s.node).toBe("approval");
    expect(s.status).toBe("passed");
  });

  it("goes straight to the next phase when no approval is needed", () => {
    const s = run(initGate(false), ["done", "pass", "pass"]);
    expect(s.node).toBe("next");
    expect(s.status).toBe("passed");
  });

  it("approval unlocks the next phase and is recorded as approved", () => {
    const s = run(initGate(true), ["done", "pass", "pass", "approve"]);
    expect(s).toMatchObject({ node: "next", status: "approved" });
  });

  it("a failed gate sends the issues back to the same agent and counts an attempt", () => {
    const { state, log } = stepGate(run(initGate(true), ["done"]), "fail", 3);
    expect(state).toMatchObject({ node: "agent", status: "gate_failed", attempts: 1, returned: true, failedAt: "script" });
    expect(log).toEqual({ key: "scriptFail", attempt: 1 });
  });

  it("the agent's next DONE clears the returned flag and runs the gates again", () => {
    const s = run(initGate(true), ["done", "fail", "done"]);
    expect(s).toMatchObject({ node: "script", status: "in_progress", returned: false, attempts: 1 });
  });

  it("a gatekeeper failure counts the same as a script failure", () => {
    const s = run(initGate(true), ["done", "pass", "fail"]);
    expect(s).toMatchObject({ node: "agent", attempts: 1, failedAt: "gatekeeper" });
  });

  it("stops at the Gate Failure Menu once attempts reach gates.max_retries", () => {
    const s = run(initGate(true), ["done", "fail", "done", "fail", "done", "fail"]);
    expect(s).toMatchObject({ node: "menu", status: "gate_failed", attempts: 3 });
  });

  it("honours a different max_retries", () => {
    const s = run(initGate(true), ["done", "fail", "done", "fail"], 2);
    expect(s.node).toBe("menu");
  });

  it("retry resets attempts and returns to the agent", () => {
    const menu = run(initGate(true), ["done", "fail", "done", "fail", "done", "fail"]);
    expect(stepGate(menu, "retry", 3).state).toMatchObject({ node: "agent", status: "in_progress", attempts: 0 });
  });

  it("force passes the phase as forced, and park stops the whole item", () => {
    const menu = run(initGate(true), ["done", "fail", "done", "fail", "done", "fail"]);
    expect(stepGate(menu, "force", 3).state).toMatchObject({ node: "next", status: "forced" });
    expect(stepGate(menu, "park", 3).state).toMatchObject({ node: "parked", status: "parked" });
  });

  it("ignores an event that makes no sense at the current node", () => {
    const start = initGate(true);
    expect(stepGate(start, "approve", 3).state).toBe(start);
    expect(stepGate(start, "force", 3).log).toBeUndefined();
  });

  it("offers no action at the end states, and force only at the menu", () => {
    expect(ACTIONS.next).toEqual([]);
    expect(ACTIONS.parked).toEqual([]);
    for (const [node, events] of Object.entries(ACTIONS)) {
      if (node !== "menu") expect(events).not.toContain("force");
    }
  });
});
