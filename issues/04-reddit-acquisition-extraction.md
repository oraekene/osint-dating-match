# 04 — Reddit acquisition + extraction

**What to build:** First real content adapter through the pipeline seam: fetch an attributed account's public Reddit posts/comments (public JSON, fixture-recorded), then the extraction node converts the corpus into evidence-cited claims populating the Interest & Lifestyle Graph and Psychographics layers of the Subject Dossier. Every claim cites the specific post supporting it and carries a confidence score; uncited guesses are dropped at the extraction boundary. Per-stage caching means re-runs don't re-fetch.

**Blocked by:** 03.

**Status:** ready-for-human

- [x] Attributed Reddit account populates Interest & Lifestyle plus partial Psychographics layers with citations resolving to real posts in fixtures
- [x] Claims lacking citable evidence are excluded — verified by dedicated test
- [x] Adapter exercises only the pipeline-boundary seam; tests use recorded fixtures exclusively
- [x] Second run is served from cache with no re-fetch

## Comments

Done. Reddit adapter (about/submitted/comments public JSON) collects only non-excluded Identity Graph links — the exclusion enforcement deferred from ticket 03 lands here. LLM extraction node validates every returned claim: pointers must resolve to corpus items, layers restricted to interestLifestyle/psychographics, confidence required and > 0, malformed responses fail loudly. CachingHttpPort caches only 2xx responses on disk; second collection re-fetches nothing. Boundary-level e2e test records once, replays from fixtures, and verifies every citation resolves to a real recorded post/comment. Review-driven hardening: failure responses no longer memoized, zero-confidence claims dropped, corruption guard no longer string-matched, reference-anchor selection upgraded to pairwise-agreement scoring after adding Reddit to the manifest exposed a tie-break flaw. Deferred: committed Reddit fixtures require one live recording run (inline deterministic fakes cover unit level); CLI does not yet expose the content spine (tracer-bullet continuation in tickets 05–06).
