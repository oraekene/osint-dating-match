# 07 — Matcher (pure seam)

**What to build:** The matching core as a pure function: weighted similarity across Dossier layers using User-declared priority weights; complementarity contributing only on designated evidence-backed axes; Dealbreakers evaluated as pre-scoring veto gates that terminate evaluation with an explanation — never point deductions; thin/missing layers degrade score confidence rather than silently averaging. Exhaustive unit tests on veto semantics, weight normalization, and missing-layer handling.

**Blocked by:** 06.

**Status:** ready-for-agent

- [ ] A Dealbreaker hit terminates evaluation with an explanation and zero score dilution — verified exhaustively across gate placements
- [ ] Score breakdown attributes contribution per layer with weights visible in the output
- [ ] Complementarity contributes on designated axes only; similarity everywhere else
- [ ] Missing or thin layers lower score confidence explicitly instead of being averaged away
