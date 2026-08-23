# 06 — Dossier assembly + inference completion

**What to build:** The synthesis node completes the remaining Dossier layers from the accumulated corpus: Relational Signals (how they talk about exes/friends/family, conflict-style cues, red flags, cross-platform persona inconsistency) and Logistics. Confidence aggregates across claims; the assembled Dossier is a versioned artifact of (assertion, evidence pointer, confidence) triples — free-form LLM summaries are never the final output.

**Blocked by:** 05.

**Status:** ready-for-human

- [x] Submitted handle yields a complete five-layer Dossier where every claim carries citation + confidence
- [x] Persona-inconsistency flags fire when fixture corpora conflict across platforms
- [x] Re-runs after new data produce a new Dossier version, never an in-place mutation
- [x] Uncited-claim exclusion enforced at the assembly boundary by test

## Comments

Done. Relational Signals now extractable (extraction node + prompt guidance for how they talk about exes/friends/others); personaInference compares per-platform token profiles and flags divergence below a similarity floor, citing items from both sides; compositeInference runs activity + persona stages; SubjectDossierStore (in-memory + JSON) versions dossiers per handle — identical content re-saves return the same version, new data increments, artifacts immutable. Assembly enforces uncited-claim exclusion at the boundary and aggregates confidence via noisy-OR on merge. Boundary e2e asserts all five layers with every claim cited + confident. Review-driven fixes: noisy-OR replaced max-only aggregation, dedup key unified between assembly and store contentKey, glossary "Persona" avoid-term removed from assertions, threshold renamed to similarity-floor semantics, CLI flag parsing table-driven. Deferred: JSON stores are whole-file read-modify-write (single-user fine, not concurrency-safe); persona heuristic detects vocabulary divergence — true contradiction detection deferred until Deep Dive data lands; identityFacts for Subjects relies on extraction citing profile items.
