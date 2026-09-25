/**
 * One phase moving through the gates, as a pure state machine. It follows the orchestrator's
 * Gate Protocol (.jarvis/core/rules/orchestration.md section 5): the agent returns DONE, the
 * script gate runs, then the gatekeeper agent; a failure sends the issues back to the same
 * agent and adds an attempt; at `gates.max_retries` attempts the orchestrator stops and prints
 * the Gate Failure Menu; a pass moves on to human approval when the phase needs one.
 *
 * Kept free of React so every transition can be unit-tested and the diagram cannot disagree
 * with the protocol without a test failing.
 */

export type GateNode = "agent" | "script" | "gatekeeper" | "approval" | "menu" | "next" | "parked";
export type GateStatus = "in_progress" | "gate_failed" | "passed" | "approved" | "forced" | "parked";
export type GateEvent = "done" | "pass" | "fail" | "approve" | "retry" | "force" | "park";
export type LogKey = "agentDone" | "scriptPass" | "scriptFail" | "gatePass" | "gateFail" | "approved" | "menu" | "retry" | "forced" | "parked";

export interface GateState {
  node: GateNode;
  status: GateStatus;
  attempts: number;
  /** The last failure sent issues back to the agent, which has not yet answered. */
  returned: boolean;
  /** Which gate failed last, so the menu can point at it. */
  failedAt?: "script" | "gatekeeper";
  needsApproval: boolean;
}

export interface GateLog {
  key: LogKey;
  attempt?: number;
}

export function initGate(needsApproval: boolean): GateState {
  return { node: "agent", status: "in_progress", attempts: 0, returned: false, needsApproval };
}

/** Which events are meaningful at a node: the buttons the diagram offers. */
export const ACTIONS: Record<GateNode, GateEvent[]> = {
  agent: ["done"],
  script: ["pass", "fail"],
  gatekeeper: ["pass", "fail"],
  approval: ["approve"],
  menu: ["retry", "force", "park"],
  next: [],
  parked: [],
};

export function stepGate(state: GateState, event: GateEvent, maxRetries: number): { state: GateState; log?: GateLog } {
  if (!ACTIONS[state.node].includes(event)) return { state };

  const fail = (from: "script" | "gatekeeper"): { state: GateState; log: GateLog } => {
    const attempts = state.attempts + 1;
    if (attempts >= maxRetries) {
      return {
        state: { ...state, node: "menu", status: "gate_failed", attempts, returned: false, failedAt: from },
        log: { key: "menu", attempt: attempts },
      };
    }
    return {
      state: { ...state, node: "agent", status: "gate_failed", attempts, returned: true, failedAt: from },
      log: { key: from === "script" ? "scriptFail" : "gateFail", attempt: attempts },
    };
  };

  switch (state.node) {
    case "agent":
      return { state: { ...state, node: "script", status: "in_progress", returned: false }, log: { key: "agentDone" } };
    case "script":
      return event === "pass"
        ? { state: { ...state, node: "gatekeeper" }, log: { key: "scriptPass" } }
        : fail("script");
    case "gatekeeper":
      if (event === "fail") return fail("gatekeeper");
      return {
        state: { ...state, node: state.needsApproval ? "approval" : "next", status: "passed", failedAt: undefined },
        log: { key: "gatePass" },
      };
    case "approval":
      return { state: { ...state, node: "next", status: "approved" }, log: { key: "approved" } };
    case "menu":
      if (event === "retry") {
        return { state: { ...state, node: "agent", status: "in_progress", attempts: 0, returned: false, failedAt: undefined }, log: { key: "retry" } };
      }
      if (event === "force") return { state: { ...state, node: "next", status: "forced" }, log: { key: "forced" } };
      return { state: { ...state, node: "parked", status: "parked" }, log: { key: "parked" } };
    default:
      return { state };
  }
}
