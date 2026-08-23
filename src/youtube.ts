import { PLATFORMS, type Corpus, type CorpusItem, type IdentityGraph } from "./domain.js";
import { attributedHandle } from "./adapter-util.js";
import type { HttpPort } from "./ports.js";
import type { AcquisitionStage } from "./spine.js";

const VIDEO_PATTERN =
  /"videoId":"([\w-]{11})","title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/g;

function decodeJsonText(value: string): string {
  return value.replaceAll('\\"', '"').replaceAll("\\\\", "\\");
}

export function youtubeAcquisition(http: HttpPort): AcquisitionStage {
  return {
    collect: async (graph: IdentityGraph): Promise<Corpus> => {
      const handle = attributedHandle(graph, PLATFORMS.youtube);
      if (!handle) return { items: [] };

      const normalizedHandle = handle.startsWith("@") ? handle : `@${handle}`;
      const uploadsUrl = `https://www.youtube.com/${normalizedHandle}/videos`;
      const response = await http.get(uploadsUrl);
      if (response.status !== 200) return { items: [] };

      const items: CorpusItem[] = [];
      for (const match of response.body.matchAll(VIDEO_PATTERN)) {
        const videoId = match[1];
        if (!videoId) continue;
        items.push({
          accountHandle: normalizedHandle,
          platform: PLATFORMS.youtube,
          kind: "video",
          pointer: `https://www.youtube.com/watch?v=${videoId}`,
          text: decodeJsonText(match[2] ?? ""),
        });
      }
      return { items };
    },
  };
}
