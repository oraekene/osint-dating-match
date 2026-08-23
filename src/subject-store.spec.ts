import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import type { Dossier } from "./domain.js";
import {
  InMemorySubjectDossierStore,
  JsonSubjectDossierStore,
} from "./subject-store.js";

function dossierWithClaim(assertion: string): Dossier {
  return {
    person: { primaryHandle: "someone" },
    mode: "recon",
    version: 0,
    layers: {
      identityFacts: [],
      interestLifestyle: [
        {
          assertion,
          layer: "interestLifestyle",
          source: "inferred",
          evidence: [{ pointer: "https://fixture/post/1", confidence: 0.8 }],
          confidence: 0.8,
        },
      ],
      psychographics: [],
      relationalSignals: [],
      logistics: [],
    },
  };
}

test("saving the same content twice keeps the version stable", async () => {
  const store = new InMemorySubjectDossierStore();
  const first = await store.save(dossierWithClaim("Shoots analog photography"));
  const second = await store.save(dossierWithClaim("Shoots analog photography"));

  expect(first.version).toBe(1);
  expect(second.version).toBe(1);
});

test("new data produces a new version and latest wins", async () => {
  const store = new InMemorySubjectDossierStore();
  await store.save(dossierWithClaim("Shoots analog photography"));
  const updated = await store.save(
    dossierWithClaim("Shoots analog photography AND collects vintage cameras"),
  );

  expect(updated.version).toBe(2);

  const latest = await store.latestFor("someone");
  expect(latest?.version).toBe(2);
  expect(
    latest?.layers.interestLifestyle[0]?.assertion,
  ).toContain("vintage cameras");
});

test("the JSON store persists versions across instances immutably", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "odm-subjects-"));
  const first = new JsonSubjectDossierStore(dir);
  await first.save(dossierWithClaim("Shoots analog photography"));
  await first.save(dossierWithClaim("Changed claim about photography"));

  const reopened = new JsonSubjectDossierStore(dir);
  const latest = await reopened.latestFor("someone");
  expect(latest?.version).toBe(2);
});
