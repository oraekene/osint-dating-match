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
    const byKey = new Map<string, number>();
    for (const claim of claims) {
      const key = `${claim.layer}|${claim.assertion.trim().toLowerCase()}`;
      const existingIndex = byKey.get(key);
      if (existingIndex === undefined) {
        dossier.layers[claim.layer].push(claim);
        byKey.set(key, dossier.layers[claim.layer].length - 1);
        continue;
      }
      const existing = dossier.layers[claim.layer][existingIndex];
      if (!existing) continue;
      const seenPointers = new Set(existing.evidence.map((e) => e.pointer));
      existing.evidence.push(
        ...claim.evidence.filter((e) => !seenPointers.has(e.pointer)),
      );
      existing.confidence = Math.max(existing.confidence, claim.confidence);
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
