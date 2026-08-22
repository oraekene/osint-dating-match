# osint-dating-match

An OSINT-powered compatibility profiler: submit a social media handle, get a five-layer psychographic Dossier of that person and of you, and a Match Verdict with receipts.

**This is a portfolio-grade design study, not a shippable product.** Components that would skirt GDPR/CCPA/platform ToS in production carry explicit Legal Exposure Blocks instead of being designed out. Demo subjects are limited to self, consenting friends, and public figures.

| Document | Contents |
| --- | --- |
| [spec.md](spec.md) | The spec (problem, solution, user stories, implementation/testing decisions) |
| [CONTEXT.md](CONTEXT.md) | Domain glossary — canonical terms |
| [docs/adr/](docs/adr/) | Decision records 0001–0009 |
| [research/osint-landscape.md](research/osint-landscape.md) | Verified OSINT tooling landscape (2026) |

Status: tracer bullet in progress — tickets 01–03 done.

## Implementation notes

- `src/data/sites.json` is a curated 4-site stand-in for the [WhatsMyName](https://github.com/C3Group/WhatsMyName) manifest (schema-compatible: existence/profile URL templates + hit status). Swapping in the full ~700-site manifest is a data change, not a code change.
- Avatar corroboration currently hashes the avatar response bytes exactly (sha256, truncated). True perceptual hashing (survives re-encoding/compression) lands when image decoding is introduced.
- Recorded fixtures for CI live in `fixtures/` — regenerate with `npx tsx scripts/record-identity-fixtures.ts`. Tests never touch the network; `npm start -- --fixtures fixtures/identity-known <handle>` demos offline.
