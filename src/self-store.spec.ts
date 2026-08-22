import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import type { CalibrationQuiz } from "./quiz.js";
import { InMemorySelfDossierStore, JsonSelfDossierStore, scoreQuiz } from "./quiz.js";

const samQuiz: CalibrationQuiz = {
  profile: { displayName: "Sam", location: "Lagos" },
  responses: [3, 4, 2, 2, 3, 4, 5, 3, 2, 4],
};

const anaQuiz: CalibrationQuiz = {
  profile: { displayName: "Ana", location: "Abuja" },
  responses: [1, 2, 5, 1, 4, 2, 5, 4, 1, 5],
};

test("retaking the quiz increments the version and the latest response wins", async () => {
  const store = new InMemorySelfDossierStore();
  const first = await store.save(scoreQuiz(samQuiz));
  const second = await store.save(scoreQuiz(anaQuiz));

  expect(first.version).toBe(1);
  expect(second.version).toBe(2);

  const latest = await store.latest();
  expect(latest?.version).toBe(2);
  expect(
    latest?.layers.identityFacts.map((claim) => claim.assertion).join(" | "),
  ).toContain("Ana");
});

test("the JSON store persists self-Dossiers across instances", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "odm-self-"));
  const first = new JsonSelfDossierStore(dir);
  await first.save(scoreQuiz(samQuiz));

  const reopened = new JsonSelfDossierStore(dir);
  const latest = await reopened.latest();

  expect(latest?.version).toBe(1);
  expect(latest?.person.displayName).toBe("Sam");
});
