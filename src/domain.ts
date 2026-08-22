export type DossierLayerName =
  | "identityFacts"
  | "interestLifestyle"
  | "psychographics"
  | "relationalSignals"
  | "logistics";

export const DOSSIER_LAYERS: readonly DossierLayerName[] = [
  "identityFacts",
  "interestLifestyle",
  "psychographics",
  "relationalSignals",
  "logistics",
];

export type MatchTier = "strong" | "promising" | "mixed" | "no";

export type ProfilingMode = "recon" | "deep-dive";

export interface EvidenceTrace {
  pointer: string;
  confidence: number;
}

export type ClaimSource = "self-report" | "inferred";

export interface Claim {
  assertion: string;
  layer: DossierLayerName;
  source: ClaimSource;
  evidence: EvidenceTrace[];
  confidence: number;
  value?: number;
}

export function emptyLayers(): Record<DossierLayerName, Claim[]> {
  const layers = {} as Record<DossierLayerName, Claim[]>;
  for (const layer of DOSSIER_LAYERS) {
    layers[layer] = [];
  }
  return layers;
}

export interface PersonRef {
  primaryHandle: string;
  displayName?: string;
}

export interface Dossier {
  person: PersonRef;
  mode: ProfilingMode;
  version: number;
  layers: Record<DossierLayerName, Claim[]>;
}

export type PriorityWeights = Partial<Record<DossierLayerName, number>>;

export interface Dealbreaker {
  description: string;
}

export interface TriggeredDealbreaker {
  dealbreaker: Dealbreaker;
  receipt: string;
}

export interface LayerScore {
  layer: DossierLayerName;
  weight: number;
  score: number | null;
}

export interface RiskFlag {
  description: string;
  evidence: EvidenceTrace[];
}

export interface DataQualityDisclosure {
  mode: ProfilingMode;
  missingLayers: DossierLayerName[];
}

export interface MatchVerdict {
  tier: MatchTier | null;
  scoreBreakdown: LayerScore[];
  triggeredDealbreakers: TriggeredDealbreaker[];
  highlights: Claim[];
  risks: RiskFlag[];
  dataQuality: DataQualityDisclosure;
}

export interface PipelineInput {
  handle: string;
  priorities: PriorityWeights;
  dealbreakers: Dealbreaker[];
}

export interface MatchOutput {
  tier: MatchTier | null;
  scoreBreakdown: LayerScore[];
  triggeredDealbreakers: TriggeredDealbreaker[];
}

export interface PipelineResult {
  verdict: MatchVerdict;
  identityGraph: IdentityGraph;
  dossier: Dossier;
}

export interface AccountLink {
  platform: string;
  handle: string;
  confidence: number;
  evidence: EvidenceTrace[];
  excluded: boolean;
}

export interface IdentityGraph {
  seedHandle: string;
  links: AccountLink[];
}

export interface CorpusItem {
  accountHandle: string;
  platform: string;
  kind: "post" | "comment" | "profile" | "media";
  pointer: string;
  text?: string;
}

export interface Corpus {
  items: CorpusItem[];
}
