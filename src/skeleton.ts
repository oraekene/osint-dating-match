import type {
  Corpus,
  Dossier,
  IdentityGraph,
  MatchVerdict,
} from "./domain.js";
import { DOSSIER_LAYERS, emptyLayers } from "./domain.js";
import type {
  AcquisitionStage,
  DossierAssemblyStage,
  ExtractionStage,
  IdentityGraphStage,
  InferenceStage,
  IntakeStage,
  MatchingStage,
  VerdictRenderingStage,
} from "./spine.js";

export function emptyDossier(handle: string): Dossier {
  return {
    person: { primaryHandle: handle },
    mode: "recon",
    version: 0,
    layers: emptyLayers(),
  };
}

export function skeletonVerdict(dossier: Dossier): MatchVerdict {
  const missingLayers = DOSSIER_LAYERS.filter(
    (layer) => dossier.layers[layer].length === 0,
  );
  return {
    tier: null,
    scoreBreakdown: [],
    triggeredDealbreakers: [],
    highlights: [],
    risks: [],
    dataQuality: { mode: dossier.mode, missingLayers },
  };
}

export const skeletonIntake: IntakeStage = {
  intake: async (handle) => ({ handle }),
};

export const skeletonIdentityGraph: IdentityGraphStage = {
  resolve: async (handle) => ({ seedHandle: handle, links: [] }),
};

export const skeletonAcquisition: AcquisitionStage = {
  collect: async () => ({ items: [] }),
};

export const skeletonExtraction: ExtractionStage = {
  extract: async () => [],
};

export const skeletonInference: InferenceStage = {
  infer: async () => [],
};

export const skeletonAssembly: DossierAssemblyStage = {
  assemble: async (handle) => emptyDossier(handle),
};

export const skeletonMatching: MatchingStage = {
  match: async () => null,
};

export const skeletonRendering: VerdictRenderingStage = {
  render: (verdict) => verdict,
};
