import { expect, test } from "vitest";
import type { IdentityGraph } from "./domain.js";
import type { HttpPort } from "./ports.js";
import { youtubeAcquisition } from "./youtube.js";

const attributedGraph: IdentityGraph = {
  seedHandle: "someone",
  links: [
    {
      platform: "YouTube",
      handle: "@someone_films",
      confidence: 0.9,
      evidence: [],
      excluded: false,
    },
  ],
};

const uploadsHtml = `
<html><head><title>@someone_films - YouTube</title></head>
<body><script>
var data = [{"videoId":"abc123Video","title":{"runs":[{"text":"Darkroom tour"}]}},
{"videoId":"def456Video","title":{"runs":[{"text":"Developing Tri-X at home"}]}}];
</script></body></html>`;

function youtubeOrigin(counts: Map<string, number>): HttpPort {
  return {
    get: async (url) => {
      counts.set(url, (counts.get(url) ?? 0) + 1);
      if (url.includes("/videos")) {
        return { status: 200, body: uploadsHtml };
      }
      return { status: 404, body: "" };
    },
  };
}

test("the YouTube adapter extracts video titles as corpus items", async () => {
  const counts = new Map<string, number>();
  const corpus = await youtubeAcquisition(youtubeOrigin(counts)).collect(
    attributedGraph,
  );

  expect(corpus.items.length).toBe(2);
  expect(corpus.items.every((item) => item.platform === "YouTube")).toBe(true);

  const first = corpus.items[0];
  expect(first?.kind).toBe("video");
  expect(first?.pointer).toBe("https://www.youtube.com/watch?v=abc123Video");
  expect(first?.text).toContain("Darkroom tour");

  const second = corpus.items[1];
  expect(second?.pointer).toContain("def456Video");
});

test("an excluded YouTube link yields an empty corpus and zero fetches", async () => {
  const counts = new Map<string, number>();
  const graph: IdentityGraph = {
    seedHandle: "someone",
    links: [
      {
        platform: "YouTube",
        handle: "@someone_films",
        confidence: 0.3,
        evidence: [],
        excluded: true,
      },
    ],
  };

  const corpus = await youtubeAcquisition(youtubeOrigin(counts)).collect(graph);

  expect(corpus.items).toEqual([]);
  expect(counts.size).toBe(0);
});
