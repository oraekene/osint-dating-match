# OSINT Tool Landscape — Research for a Social-Media Profiling System

**Date:** 2026-08-14 · **Purpose:** design brainstorm input · **Method:** GitHub REST API (star counts / `pushed_at` verified live), project sites, primary docs, court-case records. Star counts are as of 2026-08-14. "Last commit" = repo `pushed_at`.

---

## 1. Username / social-account enumeration

Technique family: given a username (or email), probe profile URLs across hundreds of sites and detect existence via HTTP status / response content. No API keys, no login — pure web requests. The site lists are community-curated JSON manifests (WhatsMyName's manifest is the upstream source for several others).

| Tool | ★ Stars | Forks | Last commit | Coverage | Technique | Notes |
|---|---|---|---|---|---|---|
| [sherlock-project/sherlock](https://github.com/sherlock-project/sherlock) | **89,463** | 10.5k | 2026-08 (very active) | **400+ social networks** (README, v0.16.0) | HTTP GET on profile URL patterns; status/content match | The category king; MIT; CLI, CSV/XLSX/JSON output. De-facto standard. |
| [soxoj/maigret](https://github.com/soxoj/maigret) | **36,756** | 2.8k | 2026-08 (very active) | **3,000+ sites** (repo description) | Sherlock-style probing **+ profile-page parsing** (extracts IDs, links, names via socid-extractor); HTML/PDF dossier reports | The "dossier" upgrade over Sherlock — closest existing thing to a "profiling" pipeline. MIT. |
| [WebBreacher/WhatsMyName](https://github.com/WebBreacher/WhatsMyName) | 2,758 | 442 | 2026-08 (active) | **700+ sites** (repo description) | Not a scanner per se — the community-maintained **JSON dataset** that powers other tools | Use as data source, not as the engine. |
| [megadose/holehe](https://github.com/megadose/holehe) | 12,646 | 1.7k | 2024-09 (**stale ~11 mo**) | ~120 sites | **Email → account existence** via "forgot password" / registration endpoints | Unique angle (email pivot, incl. Twitter/Instagram). GPL-3.0. Maintenance decaying. |
| [p1ngul1n0/blackbird](https://github.com/p1ngul1n0/blackbird) | 7,528 | 850 | 2025-07 (**stale ~13 mo**) | ~600 platforms (per repo docs) | Username + email probing, WhatsMyName-derived data | Fast, AI-filter options; unmaintained lately, no license file. |
| [soxoj/socid-extractor](https://github.com/soxoj/socid-extractor) | 1,063 | 118 | 2026-08 (active) | 150+ sites | Parses a known profile URL → structured record (user IDs, emails, creation dates) | Library, not CLI — the extraction layer inside Maigret. |

**Blunt viability:** Fully viable and legal-low-risk (unauthenticated public pages, no ToS login breach) — this is the healthiest category. False positives/negatives drift as sites change markup; manifests need constant pruning (which is why active Sherlock/Maigret beat stale Blackbird).

---

## 2. Platform-specific scrapers / SOCMINT

| Tool | ★ Stars | Last commit | Platform | Technique | 2025/26 viability |
|---|---|---|---|---|---|
| [mxrch/GHunt](https://github.com/mxrch/GHunt) | 19,347 | 2026-04 (active) | Google | Email → Google account (name, photo, Maps reviews, YouTube) via internal APIs + cookies | **Viable.** One of the few person-level tools that still works well; needs a burner Google cookie. |
| [Datalux/Osintgram](https://github.com/Datalux/Osintgram) | 13,985 | 2025-08 (~1 yr stale; **883 open issues**) | Instagram | Interactive shell on Instagram's private mobile API; requires login | **Brittle.** Works only with a throwaway IG account; aggressive rate limits/429s and account bans; issue backlog shows constant breakage. |
| [instaloader/instaloader](https://github.com/instaloader/instaloader) | 13,120 | 2026-07 (active) | Instagram | Downloads posts/stories/metadata; anonymous for public profiles (limited), login for the rest | **Best-maintained IG option**, but Meta lockdown means login + IP throttling for anything beyond public post pulls. |
| [twintproject/twint](https://github.com/twintproject/twint) | 16,396 | 2023-02 · **ARCHIVED** | Twitter/X | Scraped without API via guest tokens | **Dead.** X killed guest/anonymous endpoints and paywalled the API in 2023. Historical reference only. |
| [JustAnotherArchivist/snscrape](https://github.com/JustAnotherArchivist/snscrape) | 5,439 | 2023-11 (stale) | Multi (X, Reddit, Telegram, etc.) | Unified scraper CLI | **X module dead**; a few other modules still limp along. Effectively unmaintained. |
| [drawrowfly/tiktok-scraper](https://github.com/drawrowfly/tiktok-scraper) | 5,166 | 2023-05 (**effectively dead**) | TikTok | Unsigned/unofficial API calls, video + metadata | **Broken** by TikTok's rotating request signatures (X-Bogus/msToken). Successors are yt-dlp (video) and paid scraping APIs. |
| [JosephLai241/URS](https://github.com/JosephLai241/URS) | 1,022 | 2026-07 (active) | Reddit | PRAW-based scraper/analytics CLI | **Viable within limits** — official Reddit API free tier (~100 req/min, non-commercial) since the June 2023 API crackdown; Pushshift remains moderator-only. |
| [joeyism/linkedin_scraper](https://github.com/joeyism/linkedin_scraper) | 4,415 | 2026-04 | LinkedIn | Selenium browser automation, **login required** | **High-risk.** Violates LinkedIn ToS; accounts get banned fast; see hiQ and Meta v. BrandTotal (§7). |

Platform lockdown summary: **X** = paid API only (free tier is write-only; Basic read ≈ $100→$200/mo after 2025 price rise; Pro ≈ $5k/mo). **Instagram/Facebook** = Graph API restricted since 2018; scraping is login-walled, rate-limited, ban-prone. **TikTok** = Research API (academics, region-limited); unofficial endpoints an arms race. **Reddit** = official API survived but paid/limited since 2023. **LinkedIn** = hardest target; everything useful is behind auth. **Google** = GHunt still leaks useful person data.

**Blunt viability:** The era of free anonymous scraping of the big-five platforms is over. 2025/26 reality = burner accounts, residential proxies, Selenium/Playwright, constant maintenance — or paid scraping APIs (Apify, Bright Data, ScraperAPI). Budget for account attrition.

---

## 3. General OSINT frameworks & aggregators

| Tool | ★ Stars | Last commit | Type | Notes |
|---|---|---|---|---|
| [jivoi/awesome-osint](https://github.com/jivoi/awesome-osint) | 28,075 | 2026-08 (active) | Curated list | The canonical awesome-list; good discovery layer for niche tools. |
| [smicallef/spiderfoot](https://github.com/smicallef/spiderfoot) | 20,812 | 2026-04 (active) | Automation framework | 200+ modules (DNS, breaches, emails, social), self-hosted, correlation engine + graphs. MIT. Commercial SaaS twin: SpiderFoot HX. |
| [laramies/theHarvester](https://github.com/laramies/theHarvester) | 17,049 | 2026-08 (very active) | Email/subdomain/name harvester | Pentest-recon staple; many sources now require API keys; person-level social data is thin. |
| [cipher387/osint_stuff_tool_collection](https://github.com/cipher387/osint_stuff_tool_collection) | 8,680 | 2026-05 (active) | Curated list | Several hundred tools, SOCMINT/GEOINT/HUMINT sections. |
| [lanmaster53/recon-ng](https://github.com/lanmaster53/recon-ng) | 5,851 | 2024-11 (stale) | Modular recon framework | Metasploit-style; marketplace churned and many modules rotted; declining mindshare. |
| [Maltego](https://www.maltego.com/) | — (commercial) | Active product line | Graph-based link analysis | Verified via maltego.com: product line = Graph, Search, Monitor, Evidence, Data, Hunchly; **200k+ users, 2k+ government orgs, 120+ data partners**, ISO 27001. Free Community Edition with limits; the industry-standard investigation GUI. |
| [OSINT Framework](https://osintframework.com/) ([lockfale/osint-framework](https://github.com/lockfale/osint-framework)) | — (site) | Live site | Web directory tree | Verified live; curated tree of free tools by input type (username/email/image…). A taxonomy to copy, not an engine. |

**Blunt viability:** Frameworks are infrastructure plays, not data sources — the hard part in 2026 is feeding them (API keys, paid data, scrapers). Maltego owns the professional-investigator niche; SpiderFoot is the best open-source automation spine; theHarvester is email/infra-flavored, not person-flavored.

---

## 4. Image & facial OSINT

| Tool / service | ★ Stars | Last commit / status | What it does | Notes |
|---|---|---|---|---|
| [exiftool/exiftool](https://github.com/exiftool/exiftool) | 4,952 | 2026-05 (active) | Reads/writes EXIF/IPTC/XMP metadata | Gold standard. Caveat: **all major social platforms strip EXIF on upload** — EXIF only pays off on original files (messaging apps, cloud links, blogs). |
| [ThoughtfulDev/EagleEye](https://github.com/ThoughtfulDev/EagleEye) | 5,189 | 2024-04 (stale) | Face photo → find IG/FB/Twitter profiles via reverse image search + face recognition | Largely broken by Google/SERP changes; concept still sound, implementation rotted. |
| [Greenwolf/social_mapper](https://github.com/Greenwolf/social_mapper) | 4,072 | 2022-02 (**dead**) | Names+photos → correlate accounts across FB/IG/LinkedIn/Twitter via face recognition | Killed by platform lockdowns/login walls; do not build on it. |
| **PimEyes** (pimeyes.com) | — commercial | Active | Face search across the **open web**; verified: explicitly **excludes social media & video platforms** | Freemium; paid tiers unblur results, add alerts ("Open Plus / PROtect / Advanced"). Strong for blogs/news/forums, useless for IG/FB by design. |
| **FaceCheck.id** | — commercial (Belize) | Active | Face search that **does** index social media, plus mugshots/sex-offender/news | Verified via site: credit-based pricing, sells a Face Search API, match-confidence bands (50–100). Closest legal-ish service to "photo → dating/social profiles". |
| Reverse-image classics | — | Active | Google Lens, Bing Visual Search, Yandex Images, TinEye | Yandex historically strongest on faces (captcha-prone); Google Lens best general. No API at scale — another paid-proxy problem. |

**Blunt viability:** Open-source facial-OSINT tooling is a graveyard (Social Mapper dead 2022, EagleEye stale) — the capability moved to commercial services (PimEyes, FaceCheck.id). Face recognition on non-consenting subjects is the single highest legal-exposure category: GDPR biometric provisions + Illinois BIPA (Clearview AI fined repeatedly by EU DPAs, incl. €30.5M by the Dutch DPA in 2024, and barred from selling to most US private entities after its 2022 BIPA settlement).

---

## 5. Graph / network analysis for investigations

| Tool | ★ Stars | Status | Role |
|---|---|---|---|
| Maltego (Graph) | commercial | Active | The reference link-analysis GUI: entities (person, email, handle, domain) + "transforms" from 120+ data partners; person-of-interest is a headline use case on maltego.com. |
| [gephi/gephi](https://github.com/gephi/gephi) | 6,611 | 2026-08 (active) | Open-source graph exploration/visualization (Java desktop); the standard free alternative once you have edge lists (follower graphs, co-interactions). |
| SpiderFoot | 20,812 (see §3) | Active | Built-in correlation graphing over its scan results — poor man's Maltego. |
| Custom stack | — | — | Common pro pattern: Neo4j/Memgraph + Python ETL; Linkurious/yFiles for commercial embeddable graph viz. |

**Blunt viability:** Graph tooling itself is a solved problem — the bottleneck is edge data (follower lists are exactly what platforms locked down). Design assumption: you'll build graphs from partial, API-sanctioned data, not complete social graphs.

---

## 6. Profiling / psychographic inference

| Item | Status | What it is |
|---|---|---|
| **Kosinski, Stillwell & Graepel (2013)**, *"Private traits and attributes are predictable from digital records of human behavior"*, PNAS 110(15):5802 | Verified via Semantic Scholar (2,650 citations) | Foundational result: Facebook Likes from **58,000 volunteers** predict sexuality (88% male gay/straight), ethnicity (95%), political affiliation (85%), and Big Five traits — Openness prediction ≈ test–retest reliability of a real psychometric test. The scientific basis for "likes → personality". |
| **myPersonality dataset** (Stillwell/Kosinski, Cambridge) | **Defunct** | Facebook-app dataset (active ~2007–2012, millions of psychometric+profile records, shared with ~280 researchers). Distribution halted in 2018 amid the Cambridge Analytica scandal; an improperly shared copy leaked publicly in 2018. Cautionary tale more than a resource. |
| **Cambridge Analytica (2018)** | Historical | Kogan's GSR app harvested ~87M FB profiles via friend-permissions → psychographic ad targeting. Direct cause of the 2018–2019 platform API lockdowns that shape everything in this document. |
| **IBM Watson Personality Insights** | **Discontinued** | Inferred Big Five + Needs + Values from text (LIWC/GloVe-based). Verified: IBM began sunsetting **2020-12-01**, end of service **2021-12-01** (IBM notice reproduced in watson-developer-cloud/node-red-node-watson#483). No 1:1 IBM replacement. |
| **Apply Magic Sauce** (applymagicsauce.com, Cambridge Psychometrics Centre) | **Live** (verified 2026) | The Kosinski-lineage academic successor: predicts psycho-demographic profile from **the subject's own** Facebook/X/LinkedIn GDPR data-export (parsed client-side) or pasted open text. Consent-based by design — works only on data the subject hands over. |
| Modern open-source practice | Active research area | No dominant maintained OSS repo. Practice has shifted to: (a) LIWC-22 (commercial desktop text analysis), (b) Hugging Face Big-Five/personality classifiers (small research-grade models), (c) **LLM inference** — e.g. Staab et al. 2023 ("Beyond Memorization: Violating Privacy via Inference with LLMs") showed GPT-4-class models infer location, income, sex etc. from Reddit posts at high accuracy. This is now the state of the art for text → demographics. |

**Blunt viability:** The science is real and strong (Kosinski: likes/text → Big Five at near-psychometric accuracy), but the *data* it fed on is gone — post-2018 you cannot pull a stranger's like-graph. 2025/26 working recipe: scraped posts/bios/comments → LLM-based trait & demographic inference. Doing this to identifiable non-consenting people sits squarely in GDPR "profiling" territory (Art. 22-adjacent) and would likely be an uninsurable product risk in the EU.

---

## 7. Cross-cutting viability & legal exposure

| Category | 2025/26 verdict (blunt) |
|---|---|
| Username enumeration | ✅ **Green.** Public unauthenticated pages; stable, legal-light, and the backbone any profiling system should be built on (Sherlock/Maigret + WhatsMyName manifest). |
| Email→account pivots | 🟡 Works (Holehe, GHunt) but module rot and anti-enumeration fixes by platforms; treat as best-effort enrichment. |
| Big-platform scraping | 🔴 Login-walled, rate-limited, ban-prone, ToS-violating. Twint is the tombstone. Either paid scraping APIs or burner-account infrastructure with ongoing maintenance cost. |
| General frameworks | 🟡 SpiderFoot/theHarvester fine as orchestration; they aggregate other sources rather than unlock social data themselves. |
| Facial OSINT | 🔴 Open-source dead; commercial only; highest legal exposure (biometric law: BIPA/GDPR; Clearview precedent). For a consumer product: do not touch. |
| Graph analysis | ✅ Solved tooling (Maltego/Gephi/Neo4j); constrained by data availability, not software. |
| Psychographic inference | 🟡 Science solid, models commoditized (LLMs), but input data restricted and EU profiling law is hostile. Consent-based (data-export-driven) is the only clean design — see Apply Magic Sauce. |

### Legal landmarks (verified)
- **hiQ Labs v. LinkedIn** (9th Cir. 2019; SCOTUS vacated & remanded 2021 post-*Van Buren*; 9th Cir. **reaffirmed Apr 2022**; N.D. Cal. **Nov 2022** found hiQ breached LinkedIn's User Agreement; settled): scraping *public, unauthenticated* data is likely **not a CFAA crime**, but **ToS/contract liability survives**. Net: public scraping is legally gray-tolerated; logged-in scraping is not.
- **Van Buren v. United States** (SCOTUS 2021): narrowed CFAA "exceeds authorized access" — the backdrop that keeps public-data scraping alive.
- **Meta v. BrandTotal** (9th Cir. 2024): Meta prevailed on contract/CFAA-adjacent claims against logged-in automated collection — reinforces the public-vs-authenticated line.
- **Clearview AI enforcement** (EU DPAs 2021–2024; IL BIPA settlement 2022): facial-recognition databases on scraped photos = regulatory radioactive.

---

## Design takeaways for a social-media profiling system
1. **Spine:** WhatsMyName manifest + Sherlock/Maigret-style probing for account discovery; socid-extractor-style parsing for per-profile enrichment.
2. **Depth comes from the long tail** (forums, GitHub, blogs, Strava, Keybase…) — the big five platforms are walled; design for partial data.
3. **Enrichment ladder:** username → email (Holehe-style) → Google (GHunt-style) → breach/paste (commercial) — each rung more fragile and more legally loaded than the last.
4. **Inference layer:** LLM over collected text (bios, posts, comments) for Big Five/demographics — the practical heir of Kosinski/Watson PI.
5. **Consent architecture:** the only clearly clean profiling pattern in 2026 is Apply-Magic-Sauce-style — analyze the subject's own GDPR data export with their participation.
6. **Avoid:** face recognition, logged-in scraping, and storing inferred sensitive traits (sexuality, politics, religion) — the three highest-severity legal risks (BIPA/GDPR, CFAA-adjacent contract law, GDPR Art. 9).

## Sources
- GitHub REST API repo records (stars, forks, `pushed_at`, archived flags) for all repos listed, fetched 2026-08-14.
- Sherlock README (400+ networks, v0.16.0): github.com/sherlock-project/sherlock
- osintframework.com (live; maintainer @jnordine; repo lockfale/osint-framework)
- maltego.com (product line, 200k+ users, 120+ data partners, ISO 27001, Frost & Sullivan 2025 award)
- pimeyes.com/en (open-web-only scope; paid tiers; alerts)
- facecheck.id (credit pricing, social-media indexing, API, Belize entity)
- applymagicsauce.com (Cambridge Psychometrics Centre; data-portability tool; PNAS-based method)
- Kosinski et al. 2013, PNAS 110(15):5802 — metadata & abstract via Semantic Scholar API (paper bfc1c08b…, 2,650 citations)
- IBM Watson Personality Insights sunset: IBM notice (sunset 2020-12-01, end of service 2021-12-01), reproduced in github.com/watson-developer-cloud/node-red-node-watson/issues/483
- hiQ Labs v. LinkedIn case history: en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn (938 F.3d 985; 141 S. Ct. 2752; 31 F.4th 1180; Nov 2022 N.D. Cal. ruling & settlement)
