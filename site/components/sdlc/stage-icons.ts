import { FileText, Hammer, Rocket, Ruler, Search, ShieldCheck, type LucideIcon } from "lucide-react";

import type { StageId } from "@/lib/sdlc/model";

/** One icon per lifecycle stage, shared by every SDLC diagram so a stage looks the same
 *  wherever it appears. */
export const STAGE_ICONS: Record<StageId, LucideIcon> = {
  discover: Search,
  define: FileText,
  design: Ruler,
  build: Hammer,
  verify: ShieldCheck,
  ship: Rocket,
};
