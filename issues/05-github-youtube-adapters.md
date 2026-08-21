# 05 — GitHub + YouTube adapters

**What to build:** Apply the adapter pattern established by the Reddit slice to two more public-friendly platforms: GitHub (public API: repos, languages, contribution rhythm) and YouTube (public data: subscriptions, likes, comment style). Claims enrich the same Dossier layers and add Logistics signals such as activity-time overlap. This ticket proves the adapter interface generalizes — a new platform is a new adapter, not a pipeline change.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] Both platforms populate claims with citations through the same adapter interface the Reddit adapter uses
- [ ] Cross-platform claims merge without duplication for the same Subject
- [ ] Logistics layer gains activity-time overlap signals
- [ ] All fixture-based; zero live calls in CI
