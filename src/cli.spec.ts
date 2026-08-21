import { expect, test } from "vitest";
import { main } from "./cli.js";

test("one command runs the skeleton pipeline for a handle", async () => {
  const out = await main(["@someone"]);
  const parsed = JSON.parse(out) as {
    verdict: { dataQuality: { missingLayers: string[] } };
  };
  expect(parsed.verdict.dataQuality.missingLayers).toHaveLength(5);
});

test("running without a handle explains the usage instead of failing obscurely", async () => {
  await expect(main([])).rejects.toThrow(/usage/i);
});
