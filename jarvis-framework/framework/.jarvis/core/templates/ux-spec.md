---
id: <PREFIX-NNN>
artifact: ux-spec
version: 1
status: draft
refs: [stories.md, business-flow.md]
---

# UX Spec — <short title>

## Screens <!-- required -->
<!-- One row per screen with its route and the stories it serves. -->
| ID | screen | route | stories |
|---|---|---|---|
| UX-001 | OTP Entry | /login/otp | US-001 |

## Component Tree <!-- required -->
<!-- One fenced tree per screen showing components reused from packages/ui vs new. -->
```
OtpEntryScreen
├─ packages/ui/TextField        (reused)
├─ packages/ui/Button           (reused)
└─ OtpCountdownTimer            (new)
```

## States per Screen <!-- required -->
<!-- One row per screen covering all five UI states. -->
| screen | loading | empty | error | success | disabled |
|---|---|---|---|---|---|
| OTP Entry | spinner on submit | code field blank on load | shows `bmsg_otp_invalid` | redirects to dashboard | submit disabled until 6 digits entered |

## Field Validation <!-- required -->
<!-- One row per input field with its rule, message key, and AC reference. -->
| screen | field | rule | message key | AC refs |
|---|---|---|---|---|
| OTP Entry | code | exactly 6 digits, numeric | bmsg_otp_format | [AC-001-02] |

## Error Display <!-- required -->
<!-- One row per public error key shown on this screen, and where it appears. -->
| public key | shown as | placement |
|---|---|---|
| bmsg_otp_invalid | inline banner | above the code field |

## Accessibility <!-- required -->
<!-- Checklist of WCAG 2.1 AA requirements this screen must meet. -->
- [ ] Code field has an associated `<label>` and `aria-describedby` for error text (WCAG 2.1 AA 4.1.2).

## Responsive Behavior <!-- required -->
<!-- One row per breakpoint describing the layout change. -->
| breakpoint | layout |
|---|---|
| < 480px | single-column, full-width inputs |
