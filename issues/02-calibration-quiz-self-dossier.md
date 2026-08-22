# 02 — Calibration Quiz + self-Dossier seed

**What to build:** Intake flow where the User completes a short self-report psychometric instrument (Calibration Quiz, BFI-10-style). Responses persist and produce the User's own Dossier: Identity Facts from intake answers, Psychographics anchored with source=self-report at full confidence, rendered in the same five-layer shape as any Subject Dossier. The inferred-vs-self-report delta report structure exists (returning "no inferred traits yet" until acquisition lands).

**Blocked by:** 01.

**Status:** ready-for-human

- [x] Completing the quiz produces a persisted self-Dossier whose Psychographics carry source=self-report
- [x] Self-Dossier renders in the identical five-layer structure used for Subjects
- [x] Quiz is retakable; latest responses win; Dossier versions increment rather than mutate
- [x] Delta-report structure exists and degrades gracefully before any inference exists

## Comments

Done. `npm start -- --quiz answers.json --self-dir <dir>` scores a BFI-10-style instrument, persists versioned self-Dossiers (JSON store, latest-wins), and the delta report degrades to "no inferred traits yet". Trait values are typed on Claim.value (no string parsing). Deferred: concurrent-store write safety (single-user CLI; revisit if multi-process use appears), and inferred-trait population arrives with acquisition (ticket 04+).
