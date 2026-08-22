import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { main } from "./cli.js";
import sitesJson from "./data/sites.json" with { type: "json" };
import { RecordingGateway } from "./fixtures.js";
import type { SiteEntry } from "./identity.js";

const SITES: SiteEntry[] = sitesJson;

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

test("--quiz scores responses and persists a versioned self-Dossier", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "odm-quiz-"));
  const answers = path.join(dir, "answers.json");
  await writeFile(
    answers,
    JSON.stringify({
      profile: { displayName: "Sam", location: "Lagos" },
      responses: [3, 4, 2, 2, 3, 4, 5, 3, 2, 4],
    }),
  );
  const selfDir = path.join(dir, "self");

  const first = JSON.parse(
    await main(["--quiz", answers, "--self-dir", selfDir]),
  ) as { version: number; person: { displayName?: string } };
  const second = JSON.parse(
    await main(["--quiz", answers, "--self-dir", selfDir]),
  ) as { version: number };

  expect(first.version).toBe(1);
  expect(first.person.displayName).toBe("Sam");
  expect(second.version).toBe(2);
});

test("--fixtures resolves the Identity Graph with zero live calls", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "odm-cli-"));
  const recorder = new RecordingGateway({
    http: {
      get: async (url) => {
        if (url.includes("nexus.io")) return { status: 404, body: "" };
        if (url.includes("exist")) return { status: 200, body: "ok" };
        if (url.includes("avatar"))
          return { status: 200, body: "avatar-bytes-A" };
        return {
          status: 200,
          body: '<meta property="og:title" content="Rae Idris"><meta property="og:description" content="Beekeeper in Leeds"><meta property="og:image" content="https://shared.test/avatar.img">',
        };
      },
    },
    llm: { complete: async () => "" },
    browser: { visit: async () => "" },
  });
  const { resolveIdentityGraph } = await import("./identity.js");
  await resolveIdentityGraph("rae", recorder.ports, SITES);
  await recorder.saveTo(dir);

  const out = await main(["--fixtures", dir, "rae"]);
  const parsed = JSON.parse(out) as {
    identityGraph: { links: unknown[] };
  };
  expect(parsed.identityGraph.links.length).toBeGreaterThan(0);
});
