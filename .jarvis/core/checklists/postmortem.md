# Postmortem Checklist

<!-- jarvis-gatekeeper runs this against postmortem.md, using runbook.md as the upstream artifact. -->

## Blocking
- [ ] PM-01 the Timeline has UTC timestamps and a source for every event — Evidence: postmortem.md Timeline table `time (UTC)`/`source` columns
- [ ] PM-02 Root Cause is a 5-whys chain ending in a systemic cause, not the symptom — Evidence: postmortem.md Root Cause ordered list
- [ ] PM-03 (auto) every action item is created as a real work item with an ID — Evidence: Action Items table `work item` column
- [ ] PM-04 wording is blameless: describes systems and decisions, never individuals — Evidence: Summary and What Went Badly sections
- [ ] PM-05 impact is quantified: users affected, duration, and data affected — Evidence: postmortem.md Impact table
- [ ] PM-06 [ADDED] detection time and time-to-mitigate are stated — Evidence: Timeline table events for detection and mitigation
- [ ] PM-07 [ADDED] at least one action item addresses detection, not only the fix — Evidence: Action Items table `action` column

## Advisory
- [ ] PM-50 What Went Well lists things that worked during detection or response — Evidence: postmortem.md What Went Well section
- [ ] PM-51 [ADDED] every action item has a due date — Evidence: Action Items table `due` column
