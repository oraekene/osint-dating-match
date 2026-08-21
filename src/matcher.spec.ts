import { expect, test } from "vitest";
import { emptyDossier } from "./skeleton.js";
import { matchDossiers } from "./matcher.js";

test("the matcher seam is reserved and fails loudly until its ticket lands", () => {
  expect(() =>
    matchDossiers(emptyDossier("@me"), emptyDossier("@them"), {}, []),
  ).toThrow(/ticket 07/);
});
