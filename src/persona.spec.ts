import { expect, test } from "vitest";
import type { Corpus } from "./domain.js";
import { compositeInference, personaInference } from "./infer.js";

const conflictingCorpus: Corpus = {
  items: [
    {
      accountHandle: "someone",
      platform: "Reddit",
      kind: "profile",
      pointer: "https://www.reddit.com/user/someone",
      text: "Quiet homebody. I avoid people, stay in, read alone. Nobody knows me offline.",
    },
    {
      accountHandle: "someone",
      platform: "Reddit",
      kind: "post",
      pointer: "https://www.reddit.com/r/books/comments/a1/",
      text: "Solitude and books are all I need.",
    },
    {
      accountHandle: "someone",
      platform: "GitHub",
      kind: "profile",
      pointer: "https://github.com/someone",
      text: "Conference speaker. Community organizer. I love big crowds and public talks.",
    },
    {
      accountHandle: "someone",
      platform: "GitHub",
      kind: "repo",
      pointer: "https://github.com/someone/events-tool",
      text: "Event platform for organizing large community meetups.",
    },
  ],
};

test("persona inconsistency fires when platforms present opposite personas", async () => {
  const inferred = await personaInference().infer(conflictingCorpus, []);

  expect(inferred.length).toBeGreaterThan(0);
  const flag = inferred[0]!;
  expect(flag.layer).toBe("relationalSignals");
  expect(flag.assertion).toContain("Reddit");
  expect(flag.assertion).toContain("GitHub");
  const pointers = flag.evidence.map((trace) => trace.pointer);
  expect(pointers).toContain("https://www.reddit.com/user/someone");
  expect(pointers).toContain("https://github.com/someone");
});

test("consistent personas across substantial corpora raise no flag", async () => {
  const consistentCorpus: Corpus = {
    items: [
      {
        accountHandle: "someone",
        platform: "Reddit",
        kind: "profile",
        pointer: "https://www.reddit.com/user/someone",
        text: "Analog photographer, film lover, darkroom tinkerer.",
      },
      {
        accountHandle: "someone",
        platform: "Reddit",
        kind: "post",
        pointer: "https://www.reddit.com/r/AnalogCommunity/comments/a1/",
        text: "My darkroom setup for film photography.",
      },
      {
        accountHandle: "someone",
        platform: "GitHub",
        kind: "profile",
        pointer: "https://github.com/someone",
        text: "Film photography tools, analog camera software.",
      },
      {
        accountHandle: "someone",
        platform: "GitHub",
        kind: "repo",
        pointer: "https://github.com/someone/film-lab",
        text: "Software for darkroom film development calculations.",
      },
    ],
  };

  const inferred = await personaInference().infer(consistentCorpus, []);
  expect(inferred).toEqual([]);
});

test("composite inference runs every inference stage", async () => {
  const empty: Corpus = { items: [] };
  const stages = [
    { infer: async () => [{ assertion: "a", layer: "logistics" as const, source: "inferred" as const, evidence: [], confidence: 0.5 }] },
    { infer: async () => [] },
  ];
  const combined = await compositeInference(stages).infer(empty, []);
  expect(combined).toHaveLength(1);
});
