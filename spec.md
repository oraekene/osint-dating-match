# Spec: osint-dating-match

Status: ready-for-agent

## Problem Statement

When you're dating — especially online — you're choosing based on curated, self-reported marketing: three photos and a bio. The information that actually predicts whether two people work (values, lifestyle, media diet, how they talk about other people, red flags) is scattered across the person's public digital footprint. No dating product surfaces it. Today your options are: go in blind, or spend hours manually checking handles across a dozen platforms with no structure, no evidence trail, and no way to trust your own conclusions.

## Solution

osint-dating-match is a portfolio-grade system that turns "vetting a handle" into a rigorous, evidence-cited investigation. You submit any social media handle; the system resolves that person's Identity Graph across 3,000+ sites, acquires their public content (through your own logged-in sessions on locked-down majors, tiered scraping everywhere else), infers a five-layer Dossier in which every claim cites its evidence, builds your own Dossier symmetrically (anchored by a Calibration Quiz), and issues a Match Verdict: a four-tier headline, a score breakdown weighted by your stated priorities, Dealbreaker gates with receipts, Relational-Signals risks, and an honest data-quality disclosure.

Two modes: **Recon** (unilateral, public-web only — the OSINT showcase) and **Deep Dive** (a consenting Subject connects accounts or uploads data exports — the only production-clean path to depth). Every component carries a Legal Exposure Block stating exactly what would be production-blocked and why; the design goal is demonstrating every capability, not shipping.

## User Stories

1. As a User, I want to complete a short Calibration Quiz at intake, so that the engine's psychometric inferences can be validated against my own ground truth.
2. As a User, I want to connect my own accounts and upload my own platform data exports, so that my Dossier is as rich as any Deep Dive Subject's.
3. As a User, I want the same profiling pipeline run on my own handles as on any Subject, so that both sides of a match are built comparably.
4. As a User, I want to inspect my own Dossier, so that I can correct wrong inferences about myself before they poison my matches.
5. As a User, I want to submit any social media handle, so that I can evaluate a specific person I'm considering dating.
6. As a User, I want the system to discover the Subject's accounts on other platforms from one seed handle, so that the Dossier reflects their whole footprint rather than one site.
7. As a User, I want each cross-platform link to carry a confidence score, so that I know how solid each attribution is.
8. As a User, I want low-confidence account links excluded from profiling entirely, so that I'm never shown defamatory conclusions about the wrong person.
9. As a User, I want the Identity Graph presented with its corroborating evidence, so that I can spot a wrong attribution myself before reading further.
10. As a User, I want locked-down majors profiled through my own logged-in sessions via browser automation, so that acquisition works without maintaining scrapers or account pools.
11. As a User, I want Session Browsing to be strictly read-only — no likes, comments, follows, or story views — so that the Subject can never discover me through interaction traces.
12. As a User, I want browsing paced like a human, so that automation enforcement doesn't land on my own accounts.
13. As a User, I want public-friendly platforms (Reddit, GitHub, YouTube, interest sites) scraped for full content, so that psychographic inference has real text to work with.
14. As a User, I want long-tail sites checked for existence even where content isn't scraped, so that lifestyle signals (reading, fitness, film taste) still count toward the picture.
15. As a User, I want a five-layer Dossier — Identity Facts, Interest & Lifestyle Graph, Psychographics, Relational Signals, Logistics — so that compatibility is assessed across every dimension that matters.
16. As a User, I want every claim in a Dossier to cite the specific post, photo, or datum supporting it, so that I can verify anything myself.
17. As a User, I want confidence scores attached to claims, so that I can weigh thin evidence appropriately.
18. As a User, I want unsupported guesses excluded from the Dossier rather than guessed, so that it reads as evidence, not horoscope.
19. As a User, I want Relational Signals surfaced — how they talk about exes, friends, and family; conflict style; red flags — so that character risks are visible early.
20. As a User, I want cross-platform persona inconsistencies flagged, so that curated-vs-actual gaps are visible.
21. As a User, I want to declare priority weights per dimension, so that the Match Score reflects what I actually care about.
22. As a User, I want to declare Dealbreakers that act as veto gates, so that hard nos end the evaluation immediately with an explanation instead of diluting a score.
23. As a User, I want a four-tier headline verdict (strong / promising / mixed / no), so that the answer is legible at a glance.
24. As a User, I want the Match Score broken down by Dossier layer with my weights visible, so that I can audit why the number is what it is.
25. As a User, I want top evidence-cited highlights in the Verdict, so that "why" is always answered with receipts.
26. As a User, I want a data-quality disclosure distinguishing Recon-thin layers from Deep Dive-rich layers, so that I don't over-trust a shallow run.
27. As a Consenting Friend, I want to connect my accounts or exports for a Deep Dive, so that a match computed about me uses full-depth, consented data.
28. As a User, I want Recon hard-capped at public-web data, so that the unilateral mode stays within what is publicly observable.
29. As a portfolio reviewer, I want a Legal Exposure Block on every component — laws touched, severity rating, production remediation — so that I can see the author understands precisely what would be production-blocked and why.
30. As a portfolio reviewer, I want one master exposure map aggregating all Legal Exposure Blocks, so that total legal awareness is visible in a single page.
31. As a developer, I want a deterministic pipeline spine with LLMs confined to fixed nodes, so that runs are reproducible, cacheable, and debuggable by replay.
32. As a developer, I want all external calls in tests served from recorded fixtures, so that CI never touches live platforms or paid LLM APIs.
33. As a User, I want per-stage caching, so that re-runs after tweaks don't re-pay acquisition or inference costs.
34. As a demo presenter, I want demo Subjects restricted to self, consenting friends, and public figures, so that the demo itself is ethically presentable to reviewers.
35. As a User, I want engine accuracy reported as inferred-vs-self-report deltas from Calibration Quizzes, so that quality claims are measured, not vibes.

## Implementation Decisions

Decisions below are recorded in full (with rejected alternatives) as ADRs 0001–0009.

**Frame** (ADR-0001): portfolio/learning project; capabilities are never cut for legal reasons — legal consequences are annotated per component as Legal Exposure Blocks (laws touched, severity: demo-only / needs-consent / production-blocked, production remediation), aggregated into one master exposure map.

**Consent model** (ADR-0002): dual-mode. Recon profiles any submitted handle from public-web data only. Deep Dive requires Subject consent via connected accounts or uploaded data exports. Both ingestion paths feed one profiling core; the match engine tolerates the data-richness asymmetry between modes.

**Identity resolution** (ADR-0003): the submitted handle seeds cross-platform enumeration (same-username manifests across thousands of sites) corroborated by avatar perceptual hash, display-name/bio similarity, linked URLs, location, and email/phone existence checks. The result is an Identity Graph whose links carry confidence scores; low-confidence links are excluded from profiling. Precision matters more than recall — wrong attribution is a defamation-grade failure.

**Acquisition** (ADR-0004): majors (Instagram, TikTok, X) acquired by driving the User's own logged-in sessions through browser automation — Session Browsing — under strict Passive Observation discipline (read-only, human-paced, public content only). Everything else tiered by accessibility: full content scraping on public-friendly tiers (Reddit, GitHub, YouTube, interest sites), existence-only enumeration elsewhere, LinkedIn/Facebook skipped with annotations.

**Dossier structure** (ADR-0005): five layers — Identity Facts, Interest & Lifestyle Graph, Psychographics, Relational Signals, Logistics. Every claim is an (assertion, evidence pointer, confidence) triple; claims without citable evidence are excluded. Free-form LLM summaries are never final artifacts.

**Self-profiling** (ADR-0006): the User's Dossier is built with full symmetry plus a short self-report psychometric instrument (Calibration Quiz) at intake; inferred-vs-self-report deltas are reported as a standing engine-quality metric.

**Matching** (ADR-0007): weighted similarity across Dossier layers using User-declared priority weights; complementarity only on a few evidence-backed axes; Dealbreakers evaluated as pre-scoring veto gates that terminate evaluation with an explanation — never point deductions.

**Verdict shape**: four-tier headline (strong / promising / mixed / no) + per-layer score breakdown with visible weights + triggered Dealbreakers with receipts + top evidence-cited highlights + Relational-Signals risks + data-quality disclosure of mode asymmetry.

**Architecture** (ADR-0008): deterministic pipeline spine — intake → Identity Graph → acquisition → extraction → inference → Dossier assembly → matching → Verdict rendering. LLM calls confined to fixed nodes (extraction, psychometric inference, synthesis); Session Browsing is the sole agentic component. All stages cacheable and replayable.

**Build order** (ADR-0009): tracer bullet runs one handle end-to-end through the spine on public-friendly platforms only (enumeration → Reddit/GitHub/YouTube scraping → inference → Dossier → similarity vs quiz-anchored self-Dossier → Verdict page). Session Browsing connectors and Deep Dive export ingestion bolt onto proven joints afterward.

**Test seams** (confirmed during grilling): primary seam is the pipeline boundary (handle + User context in, Match Verdict object out); secondary pure-function seam is the matcher (Dossier pair + priorities + dealbreakers → score breakdown + gate hits). Acquisition adapters are exercised through the primary seam against recorded fixtures, never live.

## Testing Decisions

Good tests assert external behavior only — never implementation details. The system was explicitly shaped (ADR-0008) so that almost everything is testable at the highest seam:

- **Pipeline-boundary tests**: run the full spine against recorded fixtures — canned Identity Graph results, recorded platform HTTP/browser-session transcripts, canned LLM responses. Assert on the Match Verdict object: tier, layer breakdown, gate hits, evidence citations, disclosure fields. No test ever makes a live platform call or a paid LLM call.
- **Matcher unit tests**: the matcher is a pure function, so dealbreaker-gate semantics (veto ends evaluation; gates never deduct points), weight normalization, complementarity exceptions, and thin-dossier handling get exhaustive cheap coverage.
- **Evidence-trace integrity tests**: every claim in an assembled Dossier must resolve to a fixture evidence pointer with a confidence value; uncited claims are a test failure by construction.
- **Prior art**: none — this is a fresh repository. The tracer bullet establishes the fixture-recording convention; all later acquisition adapters follow it.

## Out of Scope

- Production deployment or consumer launch; GDPR/CCPA-compliant production posture (annotated, not implemented).
- Breach-data or dark-web acquisition of any kind.
- LinkedIn or Facebook content scraping (existence checks only, annotated).
- Continuous monitoring or scheduled re-profiling of Subjects — v1 runs are one-shot.
- Escalation/investigation agents beyond Session Browsing autonomy (deferred add-on).
- Messaging, matching feeds, or multi-user SaaS features — single-User tool.
- Native mobile apps.
- Session Browsing and Deep Dive ingestion inside the tracer slice (phase 2, behind proven joints).

## Further Notes

- The OSINT tooling landscape research underpinning acquisition choices (star counts, maintenance status, legal precedents: hiQ v. LinkedIn, Meta v. BrandTotal, Clearview/BIPA exposure) lives in `research/osint-landscape.md`. Key facts: username-enumeration tooling is healthy and massive; free Twitter scraping is dead; Instagram/TikTok open-source scrapers are broken or ban-prone; facial OSINT moved to commercial services; modern psychographic inference is LLM-based since IBM Watson Personality Insights sunset.
- Matching semantics are grounded in relationship science (similarity on values/attitudes predicts satisfaction; broad complementarity is largely debunked) rather than learned from speed-dating datasets, which measure short-run attraction in artificial settings.
- Repo is private until the demo and Legal Exposure Blocks are presentation-ready; demo-subject policy (self / consenting friends / public figures) is part of what reviewers judge.
