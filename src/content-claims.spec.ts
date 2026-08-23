import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { FixtureGateway, RecordingGateway } from "./fixtures.js";
import type { ExternalPorts } from "./ports.js";
import { defaultSpine, runPipeline } from "./pipeline.js";

const liveOrigin: ExternalPorts = {
  http: {
    get: async (url) => {
      if (url.includes("nexus.io")) return { status: 404, body: "" };
      if (url.includes("/exist/")) return { status: 200, body: "ok" };
      if (url.includes("avatar")) return { status: 200, body: "avatar-A" };
      if (url === "https://www.reddit.com/user/someone/about.json") {
        return {
          status: 200,
          body: JSON.stringify({ data: { public_description: "Analog shooter" } }),
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
        return { status: 200, body: JSON.stringify({ data: { children: [] } }) };
      }
      if (url === "https://api.github.com/users/someone") {
        return {
          status: 200,
          body: JSON.stringify({
            login: "someone",
            name: "Sam Okafor",
            bio: "Analog shooter",
          }),
        };
      }
      if (url === "https://api.github.com/users/someone/repos") {
        return {
          status: 200,
          body: JSON.stringify([
            {
              name: "film-scanner",
              description: "Scanner for film negatives",
              pushed_at: "2026-08-01T19:45:00Z",
              html_url: "https://github.com/someone/film-scanner",
            },
          ]),
        };
      }
      if (url === "https://www.youtube.com/@someone/videos") {
        return {
          status: 200,
          body: 'var data = [{"videoId":"abc123Video","title":{"runs":[{"text":"Darkroom tour"}]}}];',
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
          pointers: ["https://www.reddit.com/r/AnalogCommunity/comments/abc1/"],
          confidence: 0.8,
        },
        {
          assertion: "Builds film-scanning software",
          layer: "interestLifestyle",
          pointers: ["https://github.com/someone/film-scanner"],
          confidence: 0.75,
        },
        {
          assertion: "Publishes darkroom videos",
          layer: "psychographics",
          pointers: ["https://www.youtube.com/watch?v=abc123Video"],
          confidence: 0.7,
        },
      ]),
  },
  browser: { visit: async () => "" },
};

test("GitHub and YouTube claims flow through the same seam with platform citations", async () => {
  const fixtureDir = await mkdtemp(path.join(tmpdir(), "odm-content-"));
  const recorder = new RecordingGateway(liveOrigin);
  await runPipeline(
    { handle: "someone", priorities: {}, dealbreakers: [] },
    defaultSpine(recorder.ports),
  );
  await recorder.saveTo(fixtureDir);
  const replayed = (await FixtureGateway.fromDirectory(fixtureDir)).ports;

  const cacheDir = await mkdtemp(path.join(tmpdir(), "odm-content-cache-"));
  const result = await runPipeline(
    { handle: "someone", priorities: {}, dealbreakers: [] },
    defaultSpine(replayed, { cacheDir }),
  );

  const byPlatformOfFirstEvidence = new Map<string, string>();
  for (const claim of [
    ...result.dossier.layers.interestLifestyle,
    ...result.dossier.layers.psychographics,
  ]) {
    for (const trace of claim.evidence) {
      if (trace.pointer.includes("reddit.com")) {
        byPlatformOfFirstEvidence.set("Reddit", claim.assertion);
      }
      if (trace.pointer.includes("github.com")) {
        byPlatformOfFirstEvidence.set("GitHub", claim.assertion);
      }
      if (trace.pointer.includes("youtube.com")) {
        byPlatformOfFirstEvidence.set("YouTube", claim.assertion);
      }
    }
  }

  expect(byPlatformOfFirstEvidence.has("Reddit")).toBe(true);
  expect(byPlatformOfFirstEvidence.has("GitHub")).toBe(true);
  expect(byPlatformOfFirstEvidence.has("YouTube")).toBe(true);
});
