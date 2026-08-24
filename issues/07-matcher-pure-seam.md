# 07 — Matcher (pure seam)

**What to build:** The matching core as a pure function: weighted similarity across Dossier layers using User-declared priority weights; complementarity contributing only on designated evidence-backed axes; Dealbreakers evaluated as pre-scoring veto gates that terminate evaluation with an explanation — never point deductions; thin/missing layers degrade score confidence rather than silently averaging. Exhaustive unit tests on veto semantics, weight normalization, and missing-layer handling.

**Blocked by:** 06.

**Status:** ready-for-human

- [x] A Dealbreaker hit terminates evaluation with an explanation and zero score dilution — verified exhaustively across gate placements
- [x] Score breakdown attributes contribution per layer with weights visible in the output
- [x] Complementarity contributes on designated axes only; similarity everywhere else
- [x] Missing or thin layers lower score confidence explicitly instead of being averaged away

## Comments

Implemented as pure function `matchDossiers(self, subject, priorities, dealbreakers)` with TIER_THRESHOLDS (strong 0.75, promising 0.55, mixed 0.35, no 0). Dealbreakers are serializable `{description, layer, terms}` evaluated case-insensitive substring on Subject assertions with receipt `${assertion} — ${pointer}`; hit vetoes scoring with empty breakdown (zero dilution) and tier "no". Weighted similarity per layer uses best-match Jaccard averaging; missing layers produce null rows excluded from denominator; no overlap yields tier null. Extraversion is designated complementary: |a-b|/4 replaces similarity for that trait; other traits reward similarity. CLI now loads latest self dossier for end-to-end runs; `dossierMatching` stage wires pure function into pipeline. 52 tests passing, typecheck clean.
