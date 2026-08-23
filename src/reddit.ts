import { PLATFORMS, type Corpus, type CorpusItem, type IdentityGraph } from "./domain.js";
import { attributedHandle, platformJson, textParts } from "./adapter-util.js";
import type { HttpPort } from "./ports.js";
import type { AcquisitionStage } from "./spine.js";

const REDDIT = "https://www.reddit.com";

interface ChildData {
  title?: string;
  selftext?: string;
  body?: string;
  permalink?: string;
}

async function fetchChildren(
  http: HttpPort,
  url: string,
): Promise<ChildData[]> {
  const response = await http.get(url);
  if (response.status !== 200) return [];
  const parsed = platformJson<{ data?: { children?: { data?: ChildData }[] } }>(
    response.body,
    url,
  );
  return (parsed.data?.children ?? [])
    .map((child) => child.data)
    .filter((data): data is ChildData => data !== undefined);
}

export function redditAcquisition(http: HttpPort): AcquisitionStage {
  return {
    collect: async (graph: IdentityGraph): Promise<Corpus> => {
      const handle = attributedHandle(graph, PLATFORMS.reddit);
      if (!handle) return { items: [] };

      const base = `${REDDIT}/user/${encodeURIComponent(handle)}`;
      const items: CorpusItem[] = [];

      const about = await http.get(`${base}/about.json`);
      if (about.status === 200) {
        const parsed = platformJson<{ data?: { public_description?: string } }>(
          about.body,
          `${base}/about.json`,
        );
        items.push({
          accountHandle: handle,
          platform: PLATFORMS.reddit,
          kind: "profile",
          pointer: base,
          text: parsed.data?.public_description ?? "",
        });
      }

      for (const child of await fetchChildren(http, `${base}/submitted.json`)) {
        items.push({
          accountHandle: handle,
          platform: PLATFORMS.reddit,
          kind: "post",
          pointer: `${REDDIT}${child.permalink ?? ""}`,
          text: textParts(child.title, child.selftext),
        });
      }

      for (const child of await fetchChildren(http, `${base}/comments.json`)) {
        items.push({
          accountHandle: handle,
          platform: PLATFORMS.reddit,
          kind: "comment",
          pointer: `${REDDIT}${child.permalink ?? ""}`,
          text: child.body ?? "",
        });
      }

      return { items };
    },
  };
}
