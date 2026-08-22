import { expect, test } from "vitest";
import { deltaReport, scoreQuiz } from "./quiz.js";

const samQuiz = {
  profile: { displayName: "Sam", location: "Lagos" },
  responses: [3, 4, 2, 2, 3, 4, 5, 3, 2, 4],
};

test("the delta report covers all five traits and degrades before inference exists", () => {
  const report = deltaReport(scoreQuiz(samQuiz));

  expect(report.traits).toHaveLength(5);
  for (const trait of report.traits) {
    expect(trait.selfReported).toBeGreaterThan(0);
    expect(trait.inferred).toBeNull();
  }
  expect(report.note).toMatch(/no inferred traits yet/i);
});
