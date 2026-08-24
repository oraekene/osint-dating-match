import type {
  Dealbreaker,
  Dossier,
  DossierLayerName,
  LayerScore,
  MatchOutput,
  MatchTier,
  PriorityWeights,
} from "./domain.js";
import { DOSSIER_LAYERS } from "./domain.js";

export type { MatchOutput };

export const TIER_THRESHOLDS: readonly { min: number; tier: MatchTier }[] = [
  { min: 0.75, tier: "strong" },
  { min: 0.55, tier: "promising" },
  { min: 0.35, tier: "mixed" },
  { min: 0, tier: "no" },
];

const COMPLEMENTARY_TRAITS = new Set<string>(["Extraversion"]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 0),
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

function traitName(assertion: string): string {
  const colon = assertion.indexOf(":");
  if (colon === -1) return assertion.trim();
  return assertion.slice(0, colon).trim();
}

function numericValue(claim: { value?: number; assertion: string }): number | null {
  if (claim.value !== undefined) return claim.value;
  const match = /([\d.]+)\s*\/\s*5/.exec(claim.assertion);
  if (!match?.[1]) return null;
  const parsed = Number(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
}

export function matchDossiers(
  self: Dossier,
  subject: Dossier,
  priorities: PriorityWeights,
  dealbreakers: Dealbreaker[],
): MatchOutput {
  const triggered = evaluateGates(subject, dealbreakers);
  if (triggered.length > 0) {
    return {
      tier: "no",
      scoreBreakdown: [],
      triggeredDealbreakers: triggered,
    };
  }

  const breakdown: LayerScore[] = [];
  let totalWeight = 0;
  let weightedSum = 0;

  for (const layer of DOSSIER_LAYERS) {
    const weight = priorities[layer] ?? 1;
    const selfClaims = self.layers[layer];
    const subjectClaims = subject.layers[layer];

    if (selfClaims.length === 0 || subjectClaims.length === 0) {
      breakdown.push({ layer, weight, score: null });
      continue;
    }

    const score = scoreLayer(layer, selfClaims, subjectClaims);
    breakdown.push({ layer, weight, score });
    totalWeight += weight;
    weightedSum += weight * score;
  }

  if (totalWeight === 0) {
    return { tier: null, scoreBreakdown: breakdown, triggeredDealbreakers: [] };
  }

  const overall = weightedSum / totalWeight;
  const tier = tierFor(overall);

  return { tier, scoreBreakdown: breakdown, triggeredDealbreakers: [] };
}

function evaluateGates(
  subject: Dossier,
  dealbreakers: Dealbreaker[],
): MatchOutput["triggeredDealbreakers"] {
  const triggered: MatchOutput["triggeredDealbreakers"] = [];
  for (const dealbreaker of dealbreakers) {
    const layerClaims = subject.layers[dealbreaker.layer] ?? [];
    for (const claim of layerClaims) {
      const lower = claim.assertion.toLowerCase();
      const hit = dealbreaker.terms.some((term) =>
        lower.includes(term.toLowerCase()),
      );
      if (hit) {
        const pointer = claim.evidence[0]?.pointer ?? "no pointer";
        triggered.push({
          dealbreaker,
          receipt: `${claim.assertion} — ${pointer}`,
        });
        break;
      }
    }
  }
  return triggered;
}

function scoreLayer(
  layer: DossierLayerName,
  selfClaims: Dossier["layers"][DossierLayerName],
  subjectClaims: Dossier["layers"][DossierLayerName],
): number {
  if (layer === "psychographics") {
    return scorePsychographics(selfClaims, subjectClaims);
  }

  let sum = 0;
  for (const subj of subjectClaims) {
    let best = 0;
    for (const s of selfClaims) {
      const sim = jaccard(subj.assertion, s.assertion);
      if (sim > best) best = sim;
    }
    sum += best;
  }
  return sum / subjectClaims.length;
}

function scorePsychographics(
  selfClaims: Dossier["layers"][DossierLayerName],
  subjectClaims: Dossier["layers"][DossierLayerName],
): number {
  const selfByTrait = new Map<string, (typeof selfClaims)[number]>();
  for (const claim of selfClaims) {
    selfByTrait.set(traitName(claim.assertion).toLowerCase(), claim);
  }

  let sum = 0;
  let count = 0;
  for (const subj of subjectClaims) {
    const trait = traitName(subj.assertion).toLowerCase();
    const selfClaim = selfByTrait.get(trait);
    if (selfClaim && COMPLEMENTARY_TRAITS.has(capitalize(trait))) {
      const a = numericValue(selfClaim);
      const b = numericValue(subj);
      if (a !== null && b !== null) {
        sum += Math.abs(a - b) / 4;
        count += 1;
        continue;
      }
    }
    if (selfClaim) {
      sum += jaccard(subj.assertion, selfClaim.assertion);
    } else {
      let best = 0;
      for (const s of selfClaims) {
        const sim = jaccard(subj.assertion, s.assertion);
        if (sim > best) best = sim;
      }
      sum += best;
    }
    count += 1;
  }
  return count === 0 ? 0 : sum / count;
}

function capitalize(value: string): string {
  if (value.length === 0) return value;
  return value[0]!.toUpperCase() + value.slice(1).toLowerCase();
}

function tierFor(score: number): MatchTier {
  for (const entry of TIER_THRESHOLDS) {
    if (score >= entry.min) return entry.tier;
  }
  return "no";
}
