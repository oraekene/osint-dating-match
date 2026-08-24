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
  skeletonRendering,
  skeletonVerdict,
} from "./skeleton.js";
import { matchDossiers } from "./matcher.js";
import { llmExtraction } from "./extraction.js";
import { manifestIdentityGraph } from "./identity.js";
import type { ExternalPorts } from "./ports.js";
import { compositeAcquisition } from "./acquire.js";
import { compositeInference, personaInference } from "./infer.js";
import { activityInference } from "./activity.js";
import {
  JsonSubjectDossierStore,
  versionedAssembly,
} from "./subject-store.js";
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

const dossierMatching: MatchingStage = {
  match: async (subject, input) => {
    if (!input.selfDossier) return null;
    return matchDossiers(
      input.selfDossier,
      subject,
      input.priorities,
      input.dealbreakers,
    );
  },
};

export function defaultSpine(
  ports?: ExternalPorts,
  options?: { cacheDir?: string; dossierDir?: string },
): Spine {
  const spine: Spine = {
    intake: skeletonIntake,
    identityGraph: skeletonIdentityGraph,
    acquisition: skeletonAcquisition,
    extraction: skeletonExtraction,
    inference: skeletonInference,
    assembly: skeletonAssembly,
    matching: dossierMatching,
    rendering: skeletonRendering,
  };
  if (!ports) return spine;

  const http = options?.cacheDir
    ? new CachingHttpPort(ports.http, options.cacheDir)
    : ports.http;
  const assembly = options?.dossierDir
    ? versionedAssembly(
        assemblingDossierStage,
        new JsonSubjectDossierStore(options.dossierDir),
      )
    : assemblingDossierStage;
  return {
    ...spine,
    identityGraph: manifestIdentityGraph(ports),
    acquisition: compositeAcquisition([
      redditAcquisition(http),
      githubAcquisition(http),
      youtubeAcquisition(http),
    ]),
    extraction: llmExtraction(ports.llm),
    inference: compositeInference([activityInference(), personaInference()]),
    assembly,
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
