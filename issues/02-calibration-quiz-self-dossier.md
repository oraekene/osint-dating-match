# 02 — Calibration Quiz + self-Dossier seed

**What to build:** Intake flow where the User completes a short self-report psychometric instrument (Calibration Quiz, BFI-10-style). Responses persist and produce the User's own Dossier: Identity Facts from intake answers, Psychographics anchored with source=self-report at full confidence, rendered in the same five-layer shape as any Subject Dossier. The inferred-vs-self-report delta report structure exists (returning "no inferred traits yet" until acquisition lands).

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Completing the quiz produces a persisted self-Dossier whose Psychographics claims carry source=self-report
- [ ] Self-Dossier renders in the identical five-layer structure used for Subjects
- [ ] Quiz is retakable; latest responses win; Dossier versions increment rather than mutate
- [ ] Delta-report structure exists and degrades gracefully before any inference exists
