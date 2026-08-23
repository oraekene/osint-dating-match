import type {
  Dossier,
  IdentityGraph,
  PipelineInput,
  PipelineResult,
} from "./domain.js";
import {
  assemblingDossierStage,
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
import { llmExtraction } from "./extraction.js";
import { manifestIdentityGraph } from "./identity.js";
import type { ExternalPorts } from "./ports.js";
import { compositeAcquisition } from "./acquire.js";
import { activityInference } from "./activity.js";
import { CachingHttpPort } from "./cache.js";
import { githubAcquisition } from "./github.js";
import { redditAcquisition } from "./reddit.js";
import { youtubeAcquisition } from "./youtube.js";
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

export function defaultSpine(
  ports?: ExternalPorts,
  options?: { cacheDir?: string },
): Spine {
  const spine: Spine = {
    intake: skeletonIntake,
    identityGraph: skeletonIdentityGraph,
    acquisition: skeletonAcquisition,
    extraction: skeletonExtraction,
    inference: skeletonInference,
    assembly: skeletonAssembly,
    matching: skeletonMatching,
    rendering: skeletonRendering,
  };
  if (!ports) return spine;

  const http = options?.cacheDir
    ? new CachingHttpPort(ports.http, options.cacheDir)
    : ports.http;
  return {
    ...spine,
    identityGraph: manifestIdentityGraph(ports),
    acquisition: compositeAcquisition([
      redditAcquisition(http),
      githubAcquisition(http),
      youtubeAcquisition(http),
    ]),
    extraction: llmExtraction(ports.llm),
    inference: activityInference(),
    assembly: assemblingDossierStage,
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
