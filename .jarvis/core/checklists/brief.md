# Brief Checklist

<!-- Run by: jarvis-analyst / gatekeeper, against brief.md, before requirements starts. -->

## Blocking
- [ ] BRF-01 (auto) brief.md exists with valid front matter and refs `intake.md` — Evidence: `docs/work/<ID>-<slug>/brief.md` front matter
- [ ] BRF-02 Problem is stated with no proposed solution — Evidence: `## Problem` bullet names symptom/impact only, no "by doing X" clause
- [ ] BRF-03 At least one goal has a numeric target and a baseline — Evidence: `## Goals & Metrics` table row with non-empty `baseline` and `target` cells
- [ ] BRF-04 [ADDED] Stakeholders are named by role, not just "users" — Evidence: `## Users & Stakeholders` lists role names (e.g. "Support team", "Returning user")
- [ ] BRF-05 Impacted systems are listed with repo paths — Evidence: `## Impacted Systems` table `path` column is a real repo-relative path
- [ ] BRF-06 [ADDED] Every assumption is falsifiable (states a fact that could be checked and be wrong) — Evidence: `## Assumptions` bullets phrased as checkable facts, not opinions
- [ ] BRF-07 [ADDED] Constraints are separated from assumptions (no overlap) — Evidence: `## Constraints` bullets are hard limits (legal/technical/timeline/budget), none duplicated in `## Assumptions`
- [ ] BRF-08 (auto) No `TBD`/`TODO`/`???` in the artifact — Evidence: full-text scan of brief.md

## Advisory
- [ ] BRF-50 Open Questions carried from intake are still tracked — Evidence: `## Open Questions` includes any unresolved `Q-<NNN>` from intake.md
- [ ] BRF-51 [ADDED] Each impacted system names the nature of impact, not just the path — Evidence: `## Impacted Systems` `impact` column non-empty
