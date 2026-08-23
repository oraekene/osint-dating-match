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

export function emptyDossier(
  handle: string,
  mode: Dossier["mode"] = "recon",
): Dossier {
  return {
    person: { primaryHandle: handle },
    mode,
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

export const assemblingDossierStage: DossierAssemblyStage = {
  assemble: async (handle, claims) => {
    const dossier = emptyDossier(handle);
    for (const claim of claims) {
      dossier.layers[claim.layer].push(claim);
    }
    return dossier;
  },
};

export const skeletonMatching: MatchingStage = {
  match: async () => null,
};

export const skeletonRendering: VerdictRenderingStage = {
  render: (verdict) => verdict,
};
