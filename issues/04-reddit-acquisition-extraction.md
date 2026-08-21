# 04 — Reddit acquisition + extraction

**What to build:** First real content adapter through the pipeline seam: fetch an attributed account's public Reddit posts/comments (public JSON, fixture-recorded), then the extraction node converts the corpus into evidence-cited claims populating the Interest & Lifestyle Graph and Psychographics layers of the Subject Dossier. Every claim cites the specific post supporting it and carries a confidence score; uncited guesses are dropped at the extraction boundary. Per-stage caching means re-runs don't re-fetch.

**Blocked by:** 03.

**Status:** ready-for-agent

- [ ] Attributed Reddit account populates Interest & Lifestyle plus partial Psychographics layers with citations resolving to real posts in fixtures
- [ ] Claims lacking citable evidence are excluded — verified by dedicated test
- [ ] Adapter exercises only the pipeline-boundary seam; tests use recorded fixtures exclusively
- [ ] Second run is served from cache with no re-fetch
