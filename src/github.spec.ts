import { expect, test } from "vitest";
import type { IdentityGraph } from "./domain.js";
import type { HttpPort } from "./ports.js";
import { githubAcquisition } from "./github.js";

const attributedGraph: IdentityGraph = {
  seedHandle: "someone",
  links: [
    {
      platform: "GitHub",
      handle: "someone_dev",
      confidence: 0.95,
      evidence: [],
      excluded: false,
    },
  ],
};

function githubOrigin(counts: Map<string, number>): HttpPort {
  return {
    get: async (url) => {
      counts.set(url, (counts.get(url) ?? 0) + 1);
      if (url.endsWith("/repos")) {
        return {
          status: 200,
          body: JSON.stringify([
            {
              name: "film-scanner",
              description: "Scanner for film negatives",
              language: "TypeScript",
              pushed_at: "2026-08-01T19:30:00Z",
              html_url: "https://github.com/someone_dev/film-scanner",
              topics: ["film", "photography"],
            },
          ]),
        };
      }
      return {
        status: 200,
        body: JSON.stringify({
          login: "someone_dev",
          name: "Sam Okafor",
          bio: "Analog shooter",
        }),
      };
    },
  };
}

test("the GitHub adapter collects profile and repository corpus items", async () => {
  const counts = new Map<string, number>();
  const corpus = await githubAcquisition(githubOrigin(counts)).collect(
    attributedGraph,
  );

  expect(corpus.items.length).toBeGreaterThanOrEqual(2);

  const profile = corpus.items.find((item) => item.kind === "profile");
  expect(profile?.text).toContain("Analog shooter");

  const repo = corpus.items.find((item) => item.kind === "repo");
  expect(repo?.pointer).toContain("film-scanner");
  expect(repo?.text).toContain("film negatives");
  expect(repo?.timestamp).toBe("2026-08-01T19:30:00Z");
});

test("an excluded GitHub link yields an empty corpus and zero fetches", async () => {
  const counts = new Map<string, number>();
  const graph: IdentityGraph = {
    seedHandle: "someone",
    links: [
      {
        platform: "GitHub",
        handle: "someone_dev",
        confidence: 0.3,
        evidence: [],
        excluded: true,
      },
    ],
  };

  const corpus = await githubAcquisition(githubOrigin(counts)).collect(graph);

  expect(corpus.items).toEqual([]);
  expect(counts.size).toBe(0);
});
