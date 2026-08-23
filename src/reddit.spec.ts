import { expect, test } from "vitest";
import type { IdentityGraph } from "./domain.js";
import type { HttpPort } from "./ports.js";
import { redditAcquisition } from "./reddit.js";

const attributedGraph: IdentityGraph = {
  seedHandle: "someone",
  links: [
    {
      platform: "Reddit",
      handle: "someone_r",
      confidence: 0.95,
      evidence: [{ pointer: "fixture://reddit", confidence: 0.95 }],
      excluded: false,
    },
    {
      platform: "Devlog",
      handle: "someone",
      confidence: 0.4,
      evidence: [],
      excluded: true,
    },
  ],
};

function redditOrigin(counts: Map<string, number>): HttpPort {
  return {
    get: async (url) => {
      counts.set(url, (counts.get(url) ?? 0) + 1);
      if (url.endsWith("/about.json")) {
        return {
          status: 200,
          body: JSON.stringify({
            data: { name: "u/someone_r", public_description: "Analog shooter" },
          }),
        };
      }
      if (url.includes("/submitted.json")) {
        return {
          status: 200,
          body: JSON.stringify({
            data: {
              children: [
                {
                  data: {
                    title: "Best film cameras?",
                    selftext: "I love shooting Portra 400.",
                    subreddit: "AnalogCommunity",
                    permalink: "/r/AnalogCommunity/comments/abc123/best/",
                  },
                },
              ],
            },
          }),
        };
      }
      return {
        status: 200,
        body: JSON.stringify({
          data: {
            children: [
              {
                data: {
                  body: "Portra over Gold any day.",
                  subreddit: "AnalogCommunity",
                  permalink: "/r/AnalogCommunity/comments/abc123/best/gx9",
                },
              },
            ],
          },
        }),
      };
    },
  };
}

test("the Reddit adapter collects profile, posts, and comments for the attributed account", async () => {
  const counts = new Map<string, number>();
  const corpus = await redditAcquisition(redditOrigin(counts)).collect(
    attributedGraph,
  );

  expect(corpus.items.length).toBe(3);
  expect(corpus.items.every((item) => item.platform === "Reddit")).toBe(true);

  const post = corpus.items.find((item) => item.kind === "post");
  expect(post?.pointer).toContain("/comments/abc123/");
  expect(post?.text).toContain("Portra");

  const comment = corpus.items.find((item) => item.kind === "comment");
  expect(comment?.pointer).toContain("/gx9");

  const profile = corpus.items.find((item) => item.kind === "profile");
  expect(profile?.text).toContain("Analog shooter");
});

test("an excluded Reddit link yields an empty corpus and zero fetches", async () => {
  const counts = new Map<string, number>();
  const graph: IdentityGraph = {
    seedHandle: "someone",
    links: [
      {
        platform: "Reddit",
        handle: "someone_r",
        confidence: 0.3,
        evidence: [],
        excluded: true,
      },
    ],
  };

  const corpus = await redditAcquisition(redditOrigin(counts)).collect(graph);

  expect(corpus.items).toEqual([]);
  expect(counts.size).toBe(0);
});
