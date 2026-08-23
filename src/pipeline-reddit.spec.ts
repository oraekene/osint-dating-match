import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { FixtureGateway, RecordingGateway } from "./fixtures.js";
import type { ExternalPorts } from "./ports.js";
import { defaultSpine, runPipeline } from "./pipeline.js";

const liveOrigin: ExternalPorts = {
  http: {
    get: async (url) => {
      if (url.includes("api.github.com")) return { status: 404, body: "" };
      if (url.includes("youtube.com")) return { status: 404, body: "" };
      if (url.includes("exist")) return { status: 200, body: "ok" };
      if (url.includes("avatar")) return { status: 200, body: "avatar-A" };
      if (url.includes("/user/someone/about.json")) {
        return {
          status: 200,
          body: JSON.stringify({
            data: { public_description: "Analog shooter" },
          }),
        };
      }
      if (url.includes("/submitted.json")) {
        return {
          status: 200,
          body: JSON.stringify({
            data: {
              children: [
                {
                  data: {
                    title: "Best film cameras?",
                    selftext: "Shot Portra all weekend.",
                    permalink: "/r/AnalogCommunity/comments/abc1/",
                  },
                },
              ],
            },
          }),
        };
      }
      if (url.includes("/comments.json")) {
        return {
          status: 200,
          body: JSON.stringify({
            data: {
              children: [
                {
                  data: {
                    body: "Portra over Gold any day.",
                    permalink: "/r/AnalogCommunity/comments/abc1/gx9",
                  },
                },
              ],
            },
          }),
        };
      }
      return {
        status: 200,
        body: '<meta property="og:title" content="Sam Okafor"><meta property="og:description" content="Photographer"><meta property="og:image" content="https://cdn.test/a.img">',
      };
    },
  },
  llm: {
    complete: async () =>
      JSON.stringify([
        {
          assertion: "Shoots analog photography",
          layer: "interestLifestyle",
          pointers: [
            "https://www.reddit.com/r/AnalogCommunity/comments/abc1/",
          ],
          confidence: 0.8,
        },
        {
          assertion: "Prefers premium film stocks",
          layer: "psychographics",
          pointers: [
            "https://www.reddit.com/r/AnalogCommunity/comments/abc1/gx9",
          ],
          confidence: 0.7,
        },
      ]),
  },
  browser: { visit: async () => "" },
};

test("one handle through the pipeline populates the Subject Dossier's layers", async () => {
  const fixtureDir = await mkdtemp(path.join(tmpdir(), "odm-e2e-"));
  const recorder = new RecordingGateway(liveOrigin);
  await runPipeline(
    { handle: "someone", priorities: {}, dealbreakers: [] },
    defaultSpine(recorder.ports),
  );
  await recorder.saveTo(fixtureDir);
  const replayed = (await FixtureGateway.fromDirectory(fixtureDir)).ports;

  const cacheDir = await mkdtemp(path.join(tmpdir(), "odm-cache-"));
  const result = await runPipeline(
    { handle: "someone", priorities: {}, dealbreakers: [] },
    defaultSpine(replayed, { cacheDir }),
  );

  expect(result.identityGraph.links.length).toBeGreaterThan(0);
  expect(result.dossier.layers.interestLifestyle.length).toBeGreaterThan(0);
  expect(result.dossier.layers.psychographics.length).toBeGreaterThan(0);

  const manifest = JSON.parse(
    await readFile(path.join(fixtureDir, "manifest.json"), "utf8"),
  ) as Record<string, string>;
  const realPointers: string[] = [];
  for (const [id, file] of Object.entries(manifest)) {
    if (!id.includes("submitted.json") && !id.includes("comments.json")) {
      continue;
    }
    const response = JSON.parse(
      await readFile(path.join(fixtureDir, file), "utf8"),
    ) as { body: string };
    const children = (
      JSON.parse(response.body) as {
        data: { children: { data: { permalink: string } }[] };
      }
    ).data.children;
    for (const child of children) {
      realPointers.push(`https://www.reddit.com${child.data.permalink}`);
    }
  }

  for (const claim of [
    ...result.dossier.layers.interestLifestyle,
    ...result.dossier.layers.psychographics,
  ]) {
    expect(claim.source).toBe("inferred");
    expect(claim.confidence).toBeGreaterThan(0);
    expect(claim.evidence.length).toBeGreaterThan(0);
    for (const trace of claim.evidence) {
      expect(realPointers).toContain(trace.pointer);
    }
  }
});
