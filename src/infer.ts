import type { Claim, Corpus } from "./domain.js";
import type { InferenceStage } from "./spine.js";

const MIN_ITEMS_PER_PLATFORM = 2;
const SIMILARITY_FLOOR = 0.1;
const EVIDENCE_PER_SIDE = 3;

function tokenProfile(texts: string[]): Set<string> {
  const tokens = new Set<string>();
  for (const text of texts) {
    for (const token of text.toLowerCase().split(/[^a-z0-9]+/)) {
      if (token.length > 2) tokens.add(token);
    }
  }
  return tokens;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared += 1;
  }
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

export function personaInference(): InferenceStage {
  return {
    infer: async (corpus: Corpus): Promise<Claim[]> => {
      const byPlatform = new Map<string, Corpus["items"]>();
      for (const item of corpus.items) {
        const list = byPlatform.get(item.platform) ?? [];
        list.push(item);
        byPlatform.set(item.platform, list);
      }

      const substantial = [...byPlatform.entries()].filter(
        ([, items]) => items.length >= MIN_ITEMS_PER_PLATFORM,
      );
      if (substantial.length < 2) return [];

      const profiles = new Map(
        substantial.map(([platform, items]) => [
          platform,
          {
            profile: tokenProfile(items.map((item) => item.text ?? "")),
            pointers: items.map((item) => item.pointer),
          },
        ]),
      );

      const claims: Claim[] = [];
      const platforms = [...profiles.keys()];
      for (let i = 0; i < platforms.length; i++) {
        for (let j = i + 1; j < platforms.length; j++) {
          const left = platforms[i]!;
          const right = platforms[j]!;
          const leftData = profiles.get(left)!;
          const rightData = profiles.get(right)!;
          const similarity = jaccard(leftData.profile, rightData.profile);
          if (similarity >= SIMILARITY_FLOOR) continue;

          const confidence = Math.min(
            0.85,
            0.5 + (SIMILARITY_FLOOR - similarity),
          );
          const evidence = [
            ...leftData.pointers.slice(0, EVIDENCE_PER_SIDE),
            ...rightData.pointers.slice(0, EVIDENCE_PER_SIDE),
          ].map((pointer) => ({ pointer, confidence }));

          claims.push({
            assertion: `Presents differently across ${left} and ${right} (cross-platform content similarity ${(similarity * 100).toFixed(0)}%)`,
            layer: "relationalSignals",
            source: "inferred",
            evidence,
            confidence,
          });
        }
      }
      return claims;
    },
  };
}

export function compositeInference(stages: InferenceStage[]): InferenceStage {
  return {
    infer: async (corpus, extracted) => {
      const results = await Promise.all(
        stages.map((stage) => stage.infer(corpus, extracted)),
      );
      return results.flat();
    },
  };
}
