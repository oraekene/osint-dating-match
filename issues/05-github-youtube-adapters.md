# 05 — GitHub + YouTube adapters

**What to build:** Apply the adapter pattern established by the Reddit slice to two more public-friendly platforms: GitHub (public API: repos, languages, contribution rhythm) and YouTube (public data: subscriptions, likes, comment style). Claims enrich the same Dossier layers and add Logistics signals such as activity-time overlap. This ticket proves the adapter interface generalizes — a new platform is a new adapter, not a pipeline change.

**Blocked by:** 04.

**Status:** ready-for-human

- [x] Both platforms populate claims with citations through the same adapter interface the Reddit adapter uses
- [x] Cross-platform claims merge without duplication for the same Subject
- [x] Logistics layer gains activity-time overlap signals
- [x] All fixture-based; zero live calls in CI

## Comments

Done. GitHub adapter (profile + repos via public API) and YouTube adapter (public uploads page → video titles) implement the same AcquisitionStage as Reddit; compositeAcquisition fans out and merges corpora. Assembly dedupes claims on normalized assertion across platforms, merging evidence sets. activityInference buckets timestamped items by UTC hour, scores hours by distinct-platform coverage first (genuine cross-platform overlap), and emits a Logistics claim citing contributing items. Primary-seam test proves cited claims from all three platforms in one recorded run. Review-driven cleanup: shared attributedHandle/platformJson/textParts helpers replaced per-adapter duplication; PLATFORMS constants prevent manifest-name drift; dead branch removed; CLI gained --cache-dir and updated usage. Scope honesty: YouTube likes/subscriptions have been private platform-side for years — the adapter ingests what is genuinely public (uploads); YouTube scrape pattern is fixture-controlled and will need maintenance against real payloads; GitHub non-200 responses are skipped silently (auditability note for ticket 06+).
