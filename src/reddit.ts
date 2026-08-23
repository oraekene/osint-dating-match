import type { Corpus, CorpusItem, IdentityGraph } from "./domain.js";
import type { HttpPort } from "./ports.js";
import type { AcquisitionStage } from "./spine.js";

const REDDIT = "https://www.reddit.com";

interface ChildData {
  title?: string;
  selftext?: string;
  body?: string;
  subreddit?: string;
  permalink?: string;
}

function attributedRedditHandle(graph: IdentityGraph): string | null {
  const link = graph.links.find(
    (candidate) => candidate.platform === "Reddit" && !candidate.excluded,
  );
  return link?.handle ?? null;
}

async function fetchChildren(
  http: HttpPort,
  url: string,
): Promise<ChildData[]> {
  const response = await http.get(url);
  if (response.status !== 200) return [];
  try {
    const parsed = JSON.parse(response.body) as {
      data?: { children?: { data?: ChildData }[] };
    };
    return (parsed.data?.children ?? [])
      .map((child) => child.data)
      .filter((data): data is ChildData => data !== undefined);
  } catch {
    throw new Error(`Malformed Reddit JSON from ${url}`);
  }
}

export function redditAcquisition(http: HttpPort): AcquisitionStage {
  return {
    collect: async (graph: IdentityGraph): Promise<Corpus> => {
      const handle = attributedRedditHandle(graph);
      if (!handle) return { items: [] };

      const encoded = encodeURIComponent(handle);
      const base = `${REDDIT}/user/${encoded}`;
      const items: CorpusItem[] = [];

      const about = await http.get(`${base}/about.json`);
      if (about.status === 200) {
        try {
          const parsed = JSON.parse(about.body) as {
            data?: { public_description?: string };
          };
          items.push({
            accountHandle: handle,
            platform: "Reddit",
            kind: "profile",
            pointer: `${base}`,
            text: parsed.data?.public_description ?? "",
          });
        } catch {
          throw new Error(`Malformed Reddit JSON from ${base}/about.json`);
        }
      }

      for (const child of await fetchChildren(http, `${base}/submitted.json`)) {
        const textParts = [child.title, child.selftext].filter(
          (part): part is string => part !== undefined && part !== "",
        );
        items.push({
          accountHandle: handle,
          platform: "Reddit",
          kind: "post",
          pointer: `${REDDIT}${child.permalink ?? ""}`,
          text: textParts.join("\n"),
        });
      }

      for (const child of await fetchChildren(http, `${base}/comments.json`)) {
        items.push({
          accountHandle: handle,
          platform: "Reddit",
          kind: "comment",
          pointer: `${REDDIT}${child.permalink ?? ""}`,
          text: child.body ?? "",
        });
      }

      const corpus: Corpus = { items };
      return corpus;
    },
  };
}
