import type { Claim, Corpus } from "./domain.js";
import type { InferenceStage } from "./spine.js";

const MIN_TIMESTAMPTED_ITEMS = 2;
const EVIDENCE_CAP = 10;

interface HourBucket {
  platforms: Set<string>;
  pointers: string[];
}

export function activityInference(): InferenceStage {
  return {
    infer: async (corpus: Corpus): Promise<Claim[]> => {
      const timestamped = corpus.items.filter(
        (item) => item.timestamp !== undefined,
      );
      if (timestamped.length < MIN_TIMESTAMPTED_ITEMS) return [];

      const byHour = new Map<number, HourBucket>();
      for (const item of timestamped) {
        const hour = new Date(item.timestamp!).getUTCHours();
        if (Number.isNaN(hour)) continue;
        const bucket = byHour.get(hour) ?? {
          platforms: new Set<string>(),
          pointers: [],
        };
        bucket.platforms.add(item.platform);
        bucket.pointers.push(item.pointer);
        byHour.set(hour, bucket);
      }
      if (byHour.size === 0) return [];

      const [peakHour, peak] = [...byHour.entries()].sort(
        (a, b) =>
          b[1].platforms.size * 1000 +
          b[1].pointers.length -
          (a[1].platforms.size * 1000 + a[1].pointers.length),
      )[0]!;

      const platformCount = peak.platforms.size;
      const evidence = peak.pointers.slice(0, EVIDENCE_CAP).map((pointer) => ({
        pointer,
        confidence: Math.min(0.9, 0.5 + 0.1 * (platformCount - 1)),
      }));

      const claim: Claim = {
        assertion: `Most active around ${String(peakHour).padStart(2, "0")}:00 UTC across ${platformCount} platform(s) (${timestamped.length} timestamped items)`,
        layer: "logistics",
        source: "inferred",
        evidence,
        confidence: Math.min(0.9, 0.3 + timestamped.length * 0.05),
      };
      return [claim];
    },
  };
}
