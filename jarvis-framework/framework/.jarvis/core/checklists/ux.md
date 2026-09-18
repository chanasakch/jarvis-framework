# UX Checklist

<!-- Run by: {{name}}-ux / gatekeeper, against ux-spec.md (refs stories.md, business-flow.md), before architecture starts. -->

## Blocking
- [ ] UX-01 (auto) ux-spec.md exists with valid front matter and required headings — Evidence: `docs/work/<ID>-<slug>/ux-spec.md`
- [ ] UX-02 Every screen documents loading, empty, error, success and disabled states — Evidence: `## States per Screen` table has all five columns non-empty per screen row
- [ ] UX-03 Every input field has a validation rule mapped to an AC ID — Evidence: `## Field Validation` table row per field with non-empty `rule` and `AC refs` cells
- [ ] UX-04 Errors are displayed by public message key only — Evidence: `## Error Display` `public key` column values match `bmsg_*` registry format, no raw text
- [ ] UX-05 Accessibility section covers keyboard navigation, focus order, contrast and labels (WCAG 2.1 AA) — Evidence: `## Accessibility` checklist has one item per category, each citing a WCAG 2.1 AA success criterion
- [ ] UX-06 [ADDED] Every screen maps to ≥ 1 US — Evidence: `## Screens` table `stories` column non-empty per row
- [ ] UX-07 [ADDED] Component tree names the reused `packages/ui` components — Evidence: `## Component Tree` block marks each node `(reused)` with a `packages/ui/...` path or `(new)`
- [ ] UX-08 [ADDED] Responsive behavior defined for every declared breakpoint — Evidence: `## Responsive Behavior` table has one row per breakpoint referenced elsewhere in the spec
- [ ] UX-09 (auto) No `TBD`/`TODO`/`???` in the artifact — Evidence: full-text scan of ux-spec.md

## Advisory
- [ ] UX-50 Screen IDs (`UX-<NNN>`) are sequential and unique within the file — Evidence: `## Screens` `ID` column
- [ ] UX-51 Field Validation rules reference a concrete format/range, not free text — Evidence: `## Field Validation` `rule` column
