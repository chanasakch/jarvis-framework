import { getConfigKeys } from "@/lib/generated/loaders";
import type { Dictionary } from "@/lib/i18n";

import { GateSimulatorClient } from "./gate-simulator-client";

/** Reads `gates.max_retries` from the generated config reference, so the simulator uses the
 *  framework's own default instead of a number typed here. */
export function GateSimulator({ dict }: { dict: Dictionary }) {
  const key = getConfigKeys().find((k) => k.path === "gates.max_retries");
  const max = Number.parseInt(key?.default ?? "", 10);
  if (!Number.isInteger(max) || max < 1) {
    throw new Error(`gates.max_retries has no usable default in the generated config (got ${JSON.stringify(key?.default)})`);
  }
  return <GateSimulatorClient dict={dict} maxRetries={max} />;
}
