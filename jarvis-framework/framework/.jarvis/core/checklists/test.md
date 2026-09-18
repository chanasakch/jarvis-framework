# Test Checklist

<!-- {{name}}-gatekeeper runs this against test-plan.md and test-report.md, using stories.md as the upstream artifact. -->

## Blocking
- [ ] TST-01 (auto) every AC in stories.md has ≥ 1 TC in test-plan.md [TEST-09] — Evidence: Test Cases table `AC refs` column vs stories.md AC list
- [ ] TST-02 (auto) each TC ID appears in the test name or a comment in the test code [TEST-09] — Evidence: grep test files for `TC-\d+`
- [ ] TST-03 (auto) every TC in test-report.md Results table shows `result: pass` — Evidence: test-report.md Results table
- [ ] TST-04 (auto) measured coverage per touched layer ≥ `quality.coverage_min` [TEST-02] — Evidence: test-report.md Coverage table `pass` column
- [ ] TST-05 negative tests exist for validation, sanitization, authorization and error-code mapping [TEST-10] — Evidence: test-plan.md Test Cases table `steps`/`type` columns
- [ ] TST-06 production code was not modified by the tester; failures are recorded as `D-xxx` defects — Evidence: `git diff` scope vs test-report.md Defects table

### Mode-specific
- [ ] TST-07 [regression] the test is shown failing on the pre-fix commit, with the exact command and output — Evidence: test-report.md Regression Evidence block
- [ ] TST-08 [parity] before/after outputs are identical for the recorded input set — Evidence: test-report.md Parity Evidence table `match` column = yes
- [ ] TST-09 [benchmark] numbers are compared against the config budget [PERF-08] — Evidence: test-report.md Benchmarks table `budget`/`pass` columns
- [ ] TST-10 [exploit] the PoC reproduces before the fix and fails after — Evidence: test-report.md Exploit Evidence block
- [ ] TST-11 [migration] up, down, idempotency and a re-run on already-migrated data are all verified — Evidence: test-report.md Migration Evidence block

## Advisory
- [ ] TST-50 Test Data section fakes sensitive data (OTP/PII) rather than using real data — Evidence: test-plan.md Test Data section
- [ ] TST-51 [ADDED] Environment table lists every dependency and how it runs for this cycle — Evidence: test-plan.md Environment table
