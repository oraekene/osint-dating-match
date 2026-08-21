import { expect, test } from "vitest";
import { runPipeline } from "./pipeline.js";

const baseInput = {
  handle: "@someone",
  priorities: {},
  dealbreakers: [],
};

test("submitting a handle yields a well-formed but empty Match Verdict", async () => {
  const result = await runPipeline(baseInput);

  expect(result.verdict.tier).toBeNull();
  expect(result.verdict.scoreBreakdown).toEqual([]);
  expect(result.verdict.triggeredDealbreakers).toEqual([]);
  expect(result.verdict.highlights).toEqual([]);
  expect(result.verdict.risks).toEqual([]);
  expect(result.verdict.dataQuality.mode).toBe("recon");
  expect(result.verdict.dataQuality.missingLayers).toEqual([
    "identityFacts",
    "interestLifestyle",
    "psychographics",
    "relationalSignals",
    "logistics",
  ]);
});

test("a swapped-in Identity Graph stage flows through the pipeline untouched", async () => {
  const fakeGraph = {
    seedHandle: "@someone",
    links: [
      {
        platform: "reddit",
        handle: "someone_reddit",
        confidence: 0.9,
        evidence: [{ pointer: "fixture://avatar-hash", confidence: 0.9 }],
        excluded: false,
      },
    ],
  };

  const result = await runPipeline(baseInput, {
    identityGraph: { resolve: async () => fakeGraph },
  });

  expect(result.identityGraph).toEqual(fakeGraph);
});
