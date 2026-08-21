# 01 — Pipeline skeleton + fixture harness

**What to build:** The deterministic spine exists end-to-end as replaceable stage interfaces (intake → Identity Graph → acquisition → extraction → inference → Dossier assembly → matching → Verdict rendering), with the two confirmed seams: the pipeline boundary (handle + User context in, Match Verdict object out) and the matcher as a pure function. A fixture harness records and replays all external interactions (HTTP, browser sessions, LLM responses). Skeleton run: submit a handle, get a well-formed but empty Verdict whose data-quality disclosure reports every layer missing. This is the prefactoring ticket — it makes every later slice bolt onto proven joints.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Submitting a handle produces a well-formed Match Verdict: four-tier field, empty layer breakdown, disclosure stating all layers missing
- [ ] Every spine stage is a swappable interface wired in sequence; swapping one stage requires no changes to its neighbors
- [ ] Fixture harness records and replays external HTTP/browser/LLM interactions; CI makes zero live network calls
- [ ] Matcher seam exists as a pure function with typed inputs (Dossier pair, priorities, dealbreakers) and outputs (score breakdown, gate hits)
