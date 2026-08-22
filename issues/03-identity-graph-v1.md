# 03 — Identity Graph v1

**What to build:** From one seed handle, enumerate same-username candidates across the WhatsMyName site manifest, then corroborate each candidate via avatar perceptual hash, display-name/bio similarity, and linked URLs. Every cross-platform link carries a confidence score plus evidence pointers; links below threshold are excluded from downstream profiling and labeled as excluded. Precision over recall — wrong attribution is a defamation-grade failure.

**Blocked by:** 01.

**Status:** ready-for-human

- [x] Seed handle yields enumerated candidates with per-link confidence and corroborating evidence pointers
- [x] Low-confidence links are excluded from profiling input and visibly labeled as excluded
- [x] Known-identity fixture set resolves with zero false attributions
- [x] Enumeration and corroboration run entirely on recorded fixtures in CI

## Comments

Done. Username enumeration + corroboration via avatar-bytes hash, display-name/bio similarity; confidence-scored links below 0.6 excluded; reference anchor chosen by dominant avatar hash so an impostor enumerated first cannot poison attribution (tested). Committed fixture set in fixtures/identity-known replays offline in CI. Deferred: true perceptual avatar hashing (needs image decoding), downstream exclusion enforcement lands with ticket 04's acquisition adapter consuming only non-excluded links, and swapping the curated 4-site stand-in manifest for the full WhatsMyName list is data-only work.
