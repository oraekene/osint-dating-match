import { expect, test } from "vitest";
import { DOSSIER_LAYERS } from "./domain.js";
import { scoreQuiz } from "./quiz.js";

const samQuiz = {
  profile: { displayName: "Sam", location: "Lagos" },
  responses: [3, 4, 2, 2, 3, 4, 5, 3, 2, 4],
};

test("completing the Calibration Quiz yields a five-layer self-Dossier anchored to self-report", () => {
  const dossier = scoreQuiz(samQuiz);

  expect(Object.keys(dossier.layers)).toEqual([...DOSSIER_LAYERS]);
  expect(dossier.person.displayName).toBe("Sam");
  expect(dossier.mode).toBe("deep-dive");

  const psych = dossier.layers.psychographics;
  expect(psych).toHaveLength(5);
  for (const claim of psych) {
    expect(claim.source).toBe("self-report");
    expect(claim.confidence).toBe(1);
    expect(claim.evidence.length).toBeGreaterThan(0);
    expect(claim.layer).toBe("psychographics");
  }

  const facts = dossier.layers.identityFacts
    .map((claim) => claim.assertion)
    .join(" | ");
  expect(facts).toContain("Sam");
  expect(facts).toContain("Lagos");
});

test("trait scores follow the BFI-10 key with reversed items", () => {
  const dossier = scoreQuiz(samQuiz);
  const neuroticism = dossier.layers.psychographics.find((claim) =>
    claim.assertion.startsWith("Neuroticism"),
  );
  expect(neuroticism?.assertion).toContain("3.0");
  expect(neuroticism?.value).toBe(3);
});
