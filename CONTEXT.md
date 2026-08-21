# osint-dating-match

A portfolio-grade system that builds deep psychographic profiles of a User and of any social media account (the Subject) from open-source intelligence, then issues a compatibility verdict. Designed to showcase a complete end-to-end pipeline, with legal exposure annotated per component rather than designed away.

## Language

**User**:
The person who runs the tool and wants to know whether someone is a good romantic match for them. Owner of the reference profile.
_Avoid_: customer, dater, seeker

**Subject**:
The owner of the social media handle submitted by the User. Profiled by the system and evaluated for compatibility with the User.
_Avoid_: target, match candidate, prospect

**Recon**:
The unilateral profiling run on any submitted handle, built strictly from public-web data. The Subject does not know and has not consented.
_Avoid_: Mode A, public pass, shallow scan

**Deep Dive**:
The consent-gated profiling run, unlocked when the Subject connects their accounts or uploads their own platform data exports. The only legally clean path to non-public data.
_Avoid_: Mode B, consented pass, full scan

**Identity Graph**:
The set of accounts across platforms attributed to one real-world person (User or Subject). Every cross-platform link carries a confidence score; low-confidence links are excluded from profiling because wrong attribution in a dating context is a defamation-grade failure, not a data-quality bug.
_Avoid_: account cluster, identity resolution, sockpuppet map

**Session Browsing**:
Content acquisition on locked-down majors by driving the User's own logged-in sessions through browser automation — read-only, human-paced, public content only. Risk of platform enforcement lands on the User's own account, not on infrastructure.
_Avoid_: scraping pool, bot farm, API access

**Passive Observation**:
The read-only discipline governing Session Browsing: never like, comment, follow, or view stories. Any interaction leaves a trace the Subject can see (e.g., story viewer lists), turning surveillance into discovery.
_Avoid_: stealth mode, ghost browsing

**Dossier**:
The structured profile produced for a person (User or Subject), organized in five layers: Identity Facts, Interest & Lifestyle Graph, Psychographics, Relational Signals, Logistics. Built once per person and versioned as data changes.
_Avoid_: profile summary, persona, report

**Evidence Trace**:
The mandatory citation attached to every claim in a Dossier — a pointer to the specific post, photo, or datum that supports it, plus a confidence score. Claims without evidence are excluded, not guessed.
_Avoid_: source link, rationale

**Calibration Quiz**:
The short self-report psychometric instrument every User completes at intake. Anchors the inference engine against ground truth on a person where both inferred and self-reported traits exist, enabling measured accuracy claims instead of vibes.
_Avoid_: onboarding survey, personality test

**Match Score**:
Weighted similarity across Dossier layers, weighted by the User's stated priorities per dimension. Complementarity counts only on a few evidence-backed axes; everywhere else similarity is the signal.
_Avoid_: compatibility percentage, chemistry rating

**Dealbreaker**:
A User-declared veto condition evaluated before any scoring. A hit ends the evaluation with an explanation — it is a gate, never a point deduction.
_Avoid_: red flag (reserved for observed Relational Signals), disqualifier

**Match Verdict**:
The final output for a submitted handle: a four-tier headline (strong / promising / mixed / no), Match Score broken down by Dossier layer with priority weights visible, triggered Dealbreakers with receipts, top evidence-cited highlights, Relational-Signals risks, and a data-quality disclosure of which layers were thin because the run was Recon rather than Deep Dive.
_Avoid_: score, report, compatibility readout

**Legal Exposure Block**:
The structured annotation attached to every component: laws and precedents touched (GDPR Art. 6/9, CCPA/CPRA, CFAA, BIPA, platform ToS), a three-level severity rating (demo-only / needs-consent / production-blocked), and what would have to change for production. Aggregated into one master LEGAL-NOTES.md exposure map.
_Avoid_: compliance note, disclaimer

## Scope decisions

- Frame: portfolio / learning project. The design goal is a FULL end-to-end pipeline with every capability demonstrable. Legal exposure (GDPR, CCPA/CPRA, platform ToS, CFAA, BIPA) is annotated per component as side-notes describing what would have to change for a real consumer product — not used to cut capabilities.
- Demo-subject policy: every Subject shown in live or recorded demos is the User themself, a consenting friend (ideal for Deep Dive), or a public figure. No strangers. A production version would additionally need subject-notification rights.
