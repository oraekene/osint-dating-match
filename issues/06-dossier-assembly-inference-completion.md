# 06 — Dossier assembly + inference completion

**What to build:** The synthesis node completes the remaining Dossier layers from the accumulated corpus: Relational Signals (how they talk about exes/friends/family, conflict-style cues, red flags, cross-platform persona inconsistency) and Logistics. Confidence aggregates across claims; the assembled Dossier is a versioned artifact of (assertion, evidence pointer, confidence) triples — free-form LLM summaries are never the final output.

**Blocked by:** 05.

**Status:** ready-for-agent

- [ ] Submitted handle yields a complete five-layer Dossier where every claim carries citation + confidence
- [ ] Persona-inconsistency flags fire when fixture corpora conflict across platforms
- [ ] Re-runs after new data produce a new Dossier version, never an in-place mutation
- [ ] Uncited-claim exclusion enforced at the assembly boundary by test
