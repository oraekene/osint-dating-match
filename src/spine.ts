import type {
  Claim,
  Corpus,
  Dossier,
  IdentityGraph,
  MatchOutput,
  MatchVerdict,
  PipelineInput,
} from "./domain.js";

export interface IntakeStage {
  intake(handle: string): Promise<{ handle: string }>;
}

export interface IdentityGraphStage {
  resolve(handle: string): Promise<IdentityGraph>;
}

export interface AcquisitionStage {
  collect(graph: IdentityGraph): Promise<Corpus>;
}

export interface ExtractionStage {
  extract(corpus: Corpus): Promise<Claim[]>;
}

export interface InferenceStage {
  infer(corpus: Corpus, extracted: Claim[]): Promise<Claim[]>;
}

export interface DossierAssemblyStage {
  assemble(
    handle: string,
    claims: Claim[],
  ): Promise<Dossier>;
}

export interface MatchingStage {
  match(subject: Dossier, input: PipelineInput): Promise<MatchOutput | null>;
}

export interface VerdictRenderingStage {
  render(verdict: MatchVerdict): MatchVerdict;
}
