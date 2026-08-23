import { expect, test } from "vitest";
import type { Corpus } from "./domain.js";
import type { LlmPort } from "./ports.js";
import { llmExtraction } from "./extraction.js";

const corpus: Corpus = {
  items: [
    {
      accountHandle: "someone_r",
      platform: "Reddit",
      kind: "post",
      pointer: "https://www.reddit.com/r/AnalogCommunity/comments/abc123/best/",
      text: "Best film cameras? I love shooting Portra 400.",
    },
    {
      accountHandle: "someone_r",
      platform: "Reddit",
      kind: "comment",
      pointer: "https://www.reddit.com/r/AnalogCommunity/comments/abc123/best/gx9",
      text: "Portra over Gold any day.",
    },
  ],
};

function llmReturning(payload: string): LlmPort {
  return { complete: async () => payload };
}

test("extraction keeps only evidence-cited claims in the allowed layers", async () => {
  const llm = llmReturning(
    JSON.stringify([
      {
        assertion: "Shoots analog photography",
        layer: "interestLifestyle",
        pointers: ["https://www.reddit.com/r/AnalogCommunity/comments/abc123/best/"],
        confidence: 0.8,
      },
      {
        assertion: "Prefers Portra 400 over cheaper stocks",
        layer: "psychographics",
        pointers: ["https://www.reddit.com/r/AnalogCommunity/comments/abc123/best/gx9"],
        confidence: 0.7,
      },
      {
        assertion: "Lives in Lagos",
        layer: "psychographics",
        pointers: ["https://hallucinated.example/post/1"],
        confidence: 0.9,
      },
      {
        assertion: "Owns a dog",
        layer: "relationalSignals",
        pointers: ["https://www.reddit.com/r/AnalogCommunity/comments/abc123/best/"],
        confidence: 0.6,
      },
      {
        assertion: "No evidence at all",
        layer: "interestLifestyle",
        pointers: [],
        confidence: 0.5,
      },
    ]),
  );

  const claims = await llmExtraction(llm).extract(corpus);

  expect(claims).toHaveLength(2);
  expect(claims[0]?.assertion).toBe("Shoots analog photography");
  expect(claims.every((claim) => claim.source === "inferred")).toBe(true);
  for (const claim of claims) {
    for (const trace of claim.evidence) {
      expect(
        corpus.items.some((item) => item.pointer === trace.pointer),
      ).toBe(true);
    }
  }
});

test("a malformed LLM response fails loudly instead of yielding silent emptiness", async () => {
  const llm = llmReturning("not json at all");
  await expect(llmExtraction(llm).extract(corpus)).rejects.toThrow(
    /malformed/i,
  );
});
