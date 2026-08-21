# 03 — Identity Graph v1

**What to build:** From one seed handle, enumerate same-username candidates across the WhatsMyName site manifest, then corroborate each candidate via avatar perceptual hash, display-name/bio similarity, and linked URLs. Every cross-platform link carries a confidence score plus evidence pointers; links below threshold are excluded from downstream profiling and labeled as excluded. Precision over recall — wrong attribution is a defamation-grade failure.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Seed handle yields enumerated candidates with per-link confidence and corroborating evidence pointers
- [ ] Low-confidence links are excluded from profiling input and visibly labeled as excluded
- [ ] Known-identity fixture set resolves with zero false attributions
- [ ] Enumeration and corroboration run entirely on recorded fixtures in CI
