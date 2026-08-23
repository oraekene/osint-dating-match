import { createHash } from "node:crypto";
import sitesJson from "./data/sites.json" with { type: "json" };
import type { AccountLink, EvidenceTrace, IdentityGraph } from "./domain.js";
import type { ExternalPorts } from "./ports.js";
import type { IdentityGraphStage } from "./spine.js";

export const EXCLUSION_THRESHOLD = 0.6;

export const DEFAULT_SITES: SiteEntry[] = sitesJson;

export interface SiteEntry {
  name: string;
  existenceUrl: string;
  profileUrl: string;
  hitStatus: number;
}

export function manifestIdentityGraph(
  ports: ExternalPorts,
  sites: readonly SiteEntry[] = DEFAULT_SITES,
): IdentityGraphStage {
  return {
    resolve: (handle) => resolveIdentityGraph(handle, ports, sites),
  };
}

interface ProfileSignals {
  displayName: string;
  bio: string;
  avatarHash: string | null;
}

function fill(url: string, account: string): string {
  return url.replaceAll("{account}", encodeURIComponent(account));
}

function metaContent(html: string, property: string): string {
  const match = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i",
  ).exec(html);
  if (match?.[1]) return match[1];
  const reverse = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`,
    "i",
  ).exec(html);
  return reverse?.[1] ?? "";
}

function hashOf(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 1),
  );
}

function jaccard(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  if (left.size === 0 && right.size === 0) return 0;
  let shared = 0;
  for (const token of left) {
    if (right.has(token)) shared += 1;
  }
  const union = left.size + right.size - shared;
  return union === 0 ? 0 : shared / union;
}

async function profileSignals(
  ports: ExternalPorts,
  profileUrl: string,
): Promise<ProfileSignals> {
  const response = await ports.http.get(profileUrl);
  if (response.status !== 200) {
    return { displayName: "", bio: "", avatarHash: null };
  }
  const avatarUrl = metaContent(response.body, "og:image");
  let avatarHash: string | null = null;
  if (avatarUrl) {
    const avatar = await ports.http.get(avatarUrl);
    if (avatar.status === 200) {
      avatarHash = hashOf(avatar.body);
    }
  }
  return {
    displayName: metaContent(response.body, "og:title"),
    bio: metaContent(response.body, "og:description"),
    avatarHash,
  };
}

function similarityEvidence(
  candidate: ProfileSignals,
  reference: ProfileSignals,
): { confidence: number; evidence: EvidenceTrace[] } {
  let confidence = 0.5;
  const evidence: EvidenceTrace[] = [];

  if (
    candidate.avatarHash !== null &&
    candidate.avatarHash === reference.avatarHash
  ) {
    confidence += 0.25;
    evidence.push({
      pointer: `avatar-bytes-hash:${candidate.avatarHash}`,
      confidence: 0.9,
    });
  }

  const nameSimilarity = jaccard(candidate.displayName, reference.displayName);
  if (nameSimilarity >= 0.5) {
    confidence += 0.15;
    evidence.push({
      pointer: `display-name-similarity:${nameSimilarity.toFixed(2)}`,
      confidence: nameSimilarity,
    });
  }

  const bioSimilarity = jaccard(candidate.bio, reference.bio);
  if (bioSimilarity >= 0.3) {
    confidence += 0.1;
    evidence.push({
      pointer: `bio-similarity:${bioSimilarity.toFixed(2)}`,
      confidence: bioSimilarity,
    });
  }

  return { confidence: Math.min(confidence, 0.95), evidence };
}

const AGREEMENT_WEIGHTS = {
  avatarMatch: 2,
  displayNameSimilarity: 1,
  bioSimilarity: 1,
} as const;

interface CandidateHit {
  site: SiteEntry;
  signals: ProfileSignals;
}

function agreement(a: ProfileSignals, b: ProfileSignals): number {
  let score = 0;
  if (a.avatarHash !== null && a.avatarHash === b.avatarHash) {
    score += AGREEMENT_WEIGHTS.avatarMatch;
  }
  score += AGREEMENT_WEIGHTS.displayNameSimilarity * jaccard(a.displayName, b.displayName);
  score += AGREEMENT_WEIGHTS.bioSimilarity * jaccard(a.bio, b.bio);
  return score;
}

function pickReference(hits: CandidateHit[]): CandidateHit | undefined {
  if (hits.length === 0) return undefined;
  if (hits.length === 1) return hits[0];

  let bestIndex = 0;
  let bestScore = -1;
  hits.forEach((hit, index) => {
    const total = hits.reduce(
      (sum, other) =>
        other.site.name === hit.site.name
          ? sum
          : sum + agreement(hit.signals, other.signals),
      0,
    );
    if (total > bestScore) {
      bestScore = total;
      bestIndex = index;
    }
  });
  return hits[bestIndex];
}

export async function resolveIdentityGraph(
  handle: string,
  ports: ExternalPorts,
  sites: readonly SiteEntry[],
): Promise<IdentityGraph> {
  const profiles = new Map<string, ProfileSignals>();
  const hits: CandidateHit[] = [];

  for (const site of sites) {
    const existence = await ports.http.get(fill(site.existenceUrl, handle));
    if (existence.status !== site.hitStatus) continue;
    const profileUrl = fill(site.profileUrl, handle);
    const signals = await profileSignals(ports, profileUrl);
    profiles.set(site.name, signals);
    hits.push({ site, signals });
  }

  const reference = pickReference(hits);
  if (!reference) {
    return { seedHandle: handle, links: [] };
  }

  const links: AccountLink[] = [];
  for (const hit of hits) {
    const isReference = hit.site.name === reference.site.name;
    const existenceEvidence: EvidenceTrace[] = [
      { pointer: fill(hit.site.existenceUrl, handle), confidence: 0.5 },
    ];
    if (isReference) {
      links.push({
        platform: hit.site.name,
        handle,
        confidence: 1,
        evidence: existenceEvidence,
        excluded: false,
      });
      continue;
    }
    const { confidence, evidence } = similarityEvidence(
      hit.signals,
      reference.signals,
    );
    links.push({
      platform: hit.site.name,
      handle,
      confidence,
      evidence: [...existenceEvidence, ...evidence],
      excluded: confidence < EXCLUSION_THRESHOLD,
    });
  }

  return { seedHandle: handle, links };
}
