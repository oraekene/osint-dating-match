import type {
  Dossier,
  IdentityGraph,
  MatchVerdict,
  PipelineInput,
  PipelineResult,
} from "./domain.js";
import {
  skeletonAcquisition,
  skeletonAssembly,
  skeletonExtraction,
  skeletonIdentityGraph,
  skeletonInference,
  skeletonIntake,
  skeletonMatching,
  skeletonRendering,
  skeletonVerdict,
} from "./skeleton.js";
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

export interface Spine {
  intake: IntakeStage;
  identityGraph: IdentityGraphStage;
  acquisition: AcquisitionStage;
  extraction: ExtractionStage;
  inference: InferenceStage;
  assembly: DossierAssemblyStage;
  matching: MatchingStage;
  rendering: VerdictRenderingStage;
}

export function defaultSpine(): Spine {
  return {
    intake: skeletonIntake,
    identityGraph: skeletonIdentityGraph,
    acquisition: skeletonAcquisition,
    extraction: skeletonExtraction,
    inference: skeletonInference,
    assembly: skeletonAssembly,
    matching: skeletonMatching,
    rendering: skeletonRendering,
  };
}

export async function runPipeline(
  input: PipelineInput,
  overrides: Partial<Spine> = {},
): Promise<PipelineResult> {
  const spine: Spine = { ...defaultSpine(), ...overrides };
  await spine.intake.intake(input.handle);
  const identityGraph = await spine.identityGraph.resolve(input.handle);
  const corpus = await spine.acquisition.collect(identityGraph);
  const extracted = await spine.extraction.extract(corpus);
  const inferred = await spine.inference.infer(corpus, extracted);
  const dossier = await spine.assembly.assemble(
    input.handle,
    [...extracted, ...inferred],
  );
  const match = await spine.matching.match(dossier, input);
  const base = skeletonVerdict(dossier);
  const verdict = spine.rendering.render(match ? { ...base, ...match } : base);
  return { verdict, identityGraph, dossier };
}
