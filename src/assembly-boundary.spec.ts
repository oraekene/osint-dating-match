import { expect, test } from "vitest";
import type { Claim } from "./domain.js";
import { assemblingDossierStage } from "./skeleton.js";

function citedClaim(assertion: string, pointer: string): Claim {
  return {
    assertion,
    layer: "interestLifestyle",
    source: "inferred",
    evidence: [{ pointer, confidence: 0.8 }],
    confidence: 0.8,
  };
}

test("the assembly boundary drops claims without citable evidence", async () => {
  const uncited: Claim = {
    assertion: "Owns a dog",
    layer: "interestLifestyle",
    source: "inferred",
    evidence: [],
    confidence: 0.9,
  };

  const dossier = await assemblingDossierStage.assemble("someone", [
    citedClaim("Shoots analog photography", "https://fixture/post/1"),
    uncited,
  ]);

  const assertions = dossier.layers.interestLifestyle.map((c) => c.assertion);
  expect(assertions).toContain("Shoots analog photography");
  expect(assertions).not.toContain("Owns a dog");
});
