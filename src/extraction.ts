import type { Claim, ClaimSource, Corpus, DossierLayerName } from "./domain.js";
import type { LlmPort } from "./ports.js";
import type { ExtractionStage } from "./spine.js";

const ALLOWED_LAYERS: readonly DossierLayerName[] = [
  "interestLifestyle",
  "psychographics",
];

interface RawClaim {
  assertion?: string;
  layer?: string;
  pointers?: string[];
  confidence?: number;
}

function extractionPrompt(corpus: Corpus): string {
  const items = corpus.items
    .map(
      (item) =>
        `[${item.pointer}]\n${(item.text ?? "").slice(0, 500)}`,
    )
    .join("\n\n");
  return [
    "You extract compatibility-relevant claims about a person from their public content.",
    "Every claim MUST cite the pointer of the specific item that supports it.",
    "Never invent pointers. Never make claims without a supporting item.",
    `Allowed layers: ${ALLOWED_LAYERS.join(", ")}.`,
    "Respond with strict JSON: [{assertion, layer, pointers, confidence}] with confidence in [0,1].",
    "Return [] when nothing is supported.",
    "Content:",
    items,
  ].join("\n");
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export function llmExtraction(llm: LlmPort): ExtractionStage {
  return {
    extract: async (corpus: Corpus): Promise<Claim[]> => {
      if (corpus.items.length === 0) return [];

      const response = await llm.complete(extractionPrompt(corpus));
      let parsed: unknown;
      try {
        parsed = JSON.parse(response);
      } catch {
        throw new Error("Malformed extraction response — expected JSON array");
      }
      if (!Array.isArray(parsed)) {
        throw new Error("Malformed extraction response — expected JSON array");
      }

      const knownPointers = new Set(corpus.items.map((item) => item.pointer));
      const allowedLayers = new Set<string>(ALLOWED_LAYERS);
      const claims: Claim[] = [];

      for (const raw of parsed as RawClaim[]) {
        const assertion = raw.assertion;
        const layer = raw.layer as DossierLayerName | undefined;
        const pointers = raw.pointers ?? [];
        if (!assertion || !layer || !allowedLayers.has(layer)) continue;
        if (pointers.length === 0) continue;
        if (raw.confidence === undefined || raw.confidence <= 0) continue;
        const cited = pointers.filter((pointer) => knownPointers.has(pointer));
        if (cited.length !== pointers.length) continue;

        const confidence = clamp01(raw.confidence);
        claims.push({
          assertion,
          layer,
          source: "inferred" satisfies ClaimSource,
          evidence: cited.map((pointer) => ({
            pointer,
            confidence,
          })),
          confidence,
        });
      }
      return claims;
    },
  };
}
