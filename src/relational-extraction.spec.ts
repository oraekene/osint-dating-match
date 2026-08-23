import { expect, test } from "vitest";
import type { Corpus } from "./domain.js";
import type { LlmPort } from "./ports.js";
import { llmExtraction } from "./extraction.js";

const corpus: Corpus = {
  items: [
    {
      accountHandle: "someone_r",
      platform: "Reddit",
      kind: "comment",
      pointer: "https://www.reddit.com/r/relationships/comments/xyz/",
      text: "My ex is crazy, all women are the same, nobody listens to me.",
    },
  ],
};

test("extraction surfaces Relational Signals from how they talk about others", async () => {
  const llm: LlmPort = {
    complete: async () =>
      JSON.stringify([
        {
          assertion:
            "Describes ex-partners with hostility and absolute generalizations",
          layer: "relationalSignals",
          pointers: ["https://www.reddit.com/r/relationships/comments/xyz/"],
          confidence: 0.75,
        },
      ]),
  };

  const claims = await llmExtraction(llm).extract(corpus);

  expect(claims).toHaveLength(1);
  expect(claims[0]?.layer).toBe("relationalSignals");
  expect(claims[0]?.evidence[0]?.pointer).toContain("/comments/xyz/");
});
