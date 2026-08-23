import type { Corpus, IdentityGraph } from "./domain.js";
import type { AcquisitionStage } from "./spine.js";

export function compositeAcquisition(
  adapters: AcquisitionStage[],
): AcquisitionStage {
  return {
    collect: async (graph: IdentityGraph): Promise<Corpus> => {
      const corpora = await Promise.all(
        adapters.map((adapter) => adapter.collect(graph)),
      );
      return {
        items: corpora.flatMap((corpus) => corpus.items),
      };
    },
  };
}
