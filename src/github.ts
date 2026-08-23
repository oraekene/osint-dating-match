import {
  PLATFORMS,
  type Corpus,
  type CorpusItem,
  type IdentityGraph,
} from "./domain.js";
import { attributedHandle, platformJson, textParts } from "./adapter-util.js";
import type { HttpPort } from "./ports.js";
import type { AcquisitionStage } from "./spine.js";

const GITHUB_API = "https://api.github.com";

interface RepoPayload {
  name?: string;
  description?: string;
  language?: string;
  pushed_at?: string;
  html_url?: string;
  topics?: string[];
}

export function githubAcquisition(http: HttpPort): AcquisitionStage {
  return {
    collect: async (graph: IdentityGraph): Promise<Corpus> => {
      const handle = attributedHandle(graph, PLATFORMS.github);
      if (!handle) return { items: [] };

      const base = `${GITHUB_API}/users/${encodeURIComponent(handle)}`;
      const items: CorpusItem[] = [];

      const profile = await http.get(base);
      if (profile.status === 200) {
        const parsed = platformJson<{ bio?: string; name?: string }>(
          profile.body,
          base,
        );
        items.push({
          accountHandle: handle,
          platform: PLATFORMS.github,
          kind: "profile",
          pointer: `https://github.com/${handle}`,
          text: textParts(parsed.name, parsed.bio),
        });
      }

      const reposResponse = await http.get(`${base}/repos`);
      if (reposResponse.status === 200) {
        const repos = platformJson<RepoPayload[]>(reposResponse.body, `${base}/repos`);
        for (const repo of repos) {
          if (!repo.html_url) continue;
          items.push({
            accountHandle: handle,
            platform: PLATFORMS.github,
            kind: "repo",
            pointer: repo.html_url,
            text: textParts(
              repo.name,
              repo.description,
              repo.language,
              ...(repo.topics ?? []),
            ),
            ...(repo.pushed_at ? { timestamp: repo.pushed_at } : {}),
          });
        }
      }

      return { items };
    },
  };
}
