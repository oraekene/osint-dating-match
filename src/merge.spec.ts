import { expect, test } from "vitest";
import type { Corpus, IdentityGraph } from "./domain.js";
import { compositeAcquisition } from "./acquire.js";
import { assemblingDossierStage, emptyDossier } from "./skeleton.js";
import { activityInference } from "./activity.js";

function redditCorpus(): Corpus {
  return {
    items: [
      {
        accountHandle: "someone_r",
        platform: "Reddit",
        kind: "post",
        pointer: "https://www.reddit.com/r/AnalogCommunity/comments/abc1/",
        text: "Shot Portra all weekend.",
        timestamp: "2026-08-01T19:30:00Z",
      },
    ],
  };
}

function githubCorpus(): Corpus {
  return {
    items: [
      {
        accountHandle: "someone_dev",
        platform: "GitHub",
        kind: "repo",
        pointer: "https://github.com/someone_dev/film-scanner",
        text: "film-scanner: Scanner for film negatives",
        timestamp: "2026-08-01T19:45:00Z",
      },
    ],
  };
}

const multiPlatformGraph: IdentityGraph = {
  seedHandle: "someone",
  links: [],
};

test("composite acquisition merges every adapter's corpus", async () => {
  const adapters = [redditCorpus, githubCorpus].map((corpus) => ({
    collect: async () => corpus(),
  }));

  const merged = await compositeAcquisition(adapters).collect(
    multiPlatformGraph,
  );

  expect(merged.items).toHaveLength(2);
  expect(merged.items.map((item) => item.platform).sort()).toEqual([
    "GitHub",
    "Reddit",
  ]);
});

test("assembling dossiers merges duplicate cross-platform claims without losing evidence", async () => {
  const claims = [
    {
      assertion: "Shoots analog photography",
      layer: "interestLifestyle" as const,
      source: "inferred" as const,
      evidence: [
        { pointer: "https://www.reddit.com/r/AnalogCommunity/comments/abc1/", confidence: 0.8 },
      ],
      confidence: 0.8,
    },
    {
      assertion: "shoots analog photography",
      layer: "interestLifestyle" as const,
      source: "inferred" as const,
      evidence: [
        { pointer: "https://github.com/someone_dev/film-scanner", confidence: 0.7 },
      ],
      confidence: 0.7,
    },
  ];

  const dossier = await assemblingDossierStage.assemble("someone", claims);

  expect(dossier.layers.interestLifestyle).toHaveLength(1);
  const merged = dossier.layers.interestLifestyle[0];
  expect(merged?.confidence).toBe(0.8);
  expect(merged?.evidence).toHaveLength(2);
});

test("activity inference adds a cross-platform Logistics overlap signal", async () => {
  const corpus = {
    items: [...redditCorpus().items, ...githubCorpus().items],
  };

  const inferred = await activityInference().infer(corpus, []);

  expect(inferred).toHaveLength(1);
  const logistics = inferred[0];
  expect(logistics?.layer).toBe("logistics");
  expect(logistics?.assertion).toContain("UTC");
  expect(logistics?.assertion).toContain("across 2 platform(s)");
  expect(logistics?.evidence.length).toBe(2);
});

test("emptyDossier accepts an explicit profiling mode", () => {
  const deepDive = emptyDossier("someone", "deep-dive");
  expect(deepDive.mode).toBe("deep-dive");
});
