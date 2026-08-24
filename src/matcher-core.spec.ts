import { expect, test } from "vitest";
import type { Claim, Dossier, Dealbreaker, PriorityWeights } from "./domain.js";
import { matchDossiers, TIER_THRESHOLDS } from "./matcher.js";

function claim(
  layer: Dossier["layers"][keyof Dossier["layers"]][number]["layer"],
  assertion: string,
  value?: number,
): Claim {
  return {
    assertion,
    layer,
    source: "inferred",
    evidence: [{ pointer: `https://fixture/${assertion}`, confidence: 0.8 }],
    confidence: 0.8,
    ...(value === undefined ? {} : { value }),
  };
}

function dossier(
  layers: Partial<
    Record<
      "identityFacts" | "interestLifestyle" | "psychographics" | "relationalSignals" | "logistics",
      Claim[]
    >
  >,
): Dossier {
  return {
    person: { primaryHandle: "x" },
    mode: "recon",
    version: 1,
    layers: {
      identityFacts: [],
      interestLifestyle: [],
      psychographics: [],
      relationalSignals: [],
      logistics: [],
      ...layers,
    },
  };
}

const analogSelf = dossier({
  interestLifestyle: [claim("interestLifestyle", "Shoots analog photography")],
});
const analogSubject = dossier({
  interestLifestyle: [claim("interestLifestyle", "Shoots analog photography daily")],
});

test("identical interests across layers score maximally with weights visible", () => {
  const output = matchDossiers(
    analogSelf,
    analogSubject,
    { interestLifestyle: 3 } satisfies PriorityWeights,
    [],
  );

  const row = output.scoreBreakdown.find((r) => r.layer === "interestLifestyle");
  expect(row?.weight).toBe(3);
  expect(row?.score).toBeGreaterThan(0.5);
  expect(output.tier).toBe("strong");
});

test("missing layers are reported as null rows and excluded from the denominator", () => {
  const output = matchDossiers(
    analogSelf,
    analogSubject,
    { interestLifestyle: 2, logistics: 2 },
    [],
  );

  const logisticsRow = output.scoreBreakdown.find((r) => r.layer === "logistics");
  expect(logisticsRow?.weight).toBe(2);
  expect(logisticsRow?.score).toBeNull();
  expect(output.tier).toBe("strong");
});

test("a Dealbreaker hit vetoes with a receipt and computes no score", () => {
  const dealbreakers: Dealbreaker[] = [
    {
      description: "No smokers",
      layer: "interestLifestyle",
      terms: ["smok"],
    },
  ];
  const smoker = dossier({
    interestLifestyle: [
      claim("interestLifestyle", "Smokes while shooting film"),
    ],
  });

  const output = matchDossiers(analogSelf, smoker, {}, dealbreakers);

  expect(output.tier).toBe("no");
  expect(output.scoreBreakdown).toEqual([]);
  expect(output.triggeredDealbreakers).toHaveLength(1);
  expect(output.triggeredDealbreakers[0]?.dealbreaker.description).toBe(
    "No smokers",
  );
  expect(output.triggeredDealbreakers[0]?.receipt).toContain("Smokes");
});

test("a non-matching Dealbreaker leaves evaluation untouched", () => {
  const dealbreakers: Dealbreaker[] = [
    { description: "No hunters", layer: "interestLifestyle", terms: ["hunt"] },
  ];

  const output = matchDossiers(analogSelf, analogSubject, {}, dealbreakers);

  expect(output.tier).not.toBe("no");
  expect(output.triggeredDealbreakers).toEqual([]);
});

test("gates fire before scoring wherever they are placed", () => {
  const cases: { layer: Dealbreaker["layer"]; text: string }[] = [
    { layer: "psychographics", text: "Impatient with people" },
    { layer: "relationalSignals", text: "Hostile toward exes" },
    { layer: "logistics", text: "Heavy smoker" },
  ];
  for (const { layer, text } of cases) {
    const subject = dossier({ [layer]: [claim(layer, text)] });
    const output = matchDossiers(
      dossier({}),
      subject,
      {},
      [{ description: `veto ${layer}`, layer, terms: [text.split(" ")[0]!.toLowerCase()] }],
    );
    expect(output.tier, layer).toBe("no");
    expect(output.scoreBreakdown, layer).toEqual([]);
  }
});

test("complementarity counts only on the designated Extraversion axis", () => {
  const introvertSelf = dossier({
    psychographics: [claim("psychographics", "Extraversion: 1.5 / 5", 1.5)],
    interestLifestyle: [claim("interestLifestyle", "Shoots analog photography")],
  });
  const extravertSelf = dossier({
    psychographics: [claim("psychographics", "Extraversion: 4.5 / 5", 4.5)],
    interestLifestyle: [claim("interestLifestyle", "Shoots analog photography")],
  });
  const extravertSubject = dossier({
    psychographics: [claim("psychographics", "Extraversion: 4.5 / 5", 4.5)],
    interestLifestyle: [claim("interestLifestyle", "Shoots analog photography daily")],
  });

  const divergent = matchDossiers(introvertSelf, extravertSubject, {}, []);
  const identical = matchDossiers(extravertSelf, extravertSubject, {}, []);

  const divergentRow = divergent.scoreBreakdown.find(
    (r) => r.layer === "psychographics",
  );
  const identicalRow = identical.scoreBreakdown.find(
    (r) => r.layer === "psychographics",
  );
  expect(divergentRow!.score!).toBeGreaterThan(identicalRow!.score!);
});

test("non-designated traits still reward similarity, not divergence", () => {
  const opennessLow = dossier({
    psychographics: [claim("psychographics", "Openness: 1.5 / 5", 1.5)],
  });
  const opennessHigh = dossier({
    psychographics: [claim("psychographics", "Openness: 4.5 / 5", 4.5)],
  });

  const similar = matchDossiers(opennessLow, opennessLow, {}, []);
  const divergent = matchDossiers(opennessLow, opennessHigh, {}, []);

  const similarRow = similar.scoreBreakdown.find((r) => r.layer === "psychographics");
  const divergentRow = divergent.scoreBreakdown.find((r) => r.layer === "psychographics");
  expect(similarRow!.score!).toBeGreaterThan(divergentRow!.score!);
});

test("no overlapping layers at all yields an undecidable verdict", () => {
  const output = matchDossiers(dossier({}), analogSubject, {}, []);
  expect(output.tier).toBeNull();
});

test("tier thresholds map scores to the four-tier headline", () => {
  expect(TIER_THRESHOLDS).toEqual([
    { min: 0.75, tier: "strong" },
    { min: 0.55, tier: "promising" },
    { min: 0.35, tier: "mixed" },
    { min: 0, tier: "no" },
  ]);
});
