import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { FixtureGateway, RecordingGateway } from "./fixtures.js";
import {
  DEFAULT_SITES,
  manifestIdentityGraph,
  resolveIdentityGraph,
} from "./identity.js";
import type { ExternalPorts } from "./ports.js";
import { runPipeline } from "./pipeline.js";

const liveOrigin: ExternalPorts = {
  http: {
    get: async (url) => {
      if (url.includes("nexus.io")) return { status: 404, body: "" };
      if (url.includes("exist")) return { status: 200, body: "ok" };
      if (url.includes("avatar-a.test"))
        return { status: 200, body: "avatar-bytes-A" };
      if (url.startsWith("https://alpha.test/"))
        return {
          status: 200,
          body: '<meta property="og:title" content="Rae Idris"><meta property="og:description" content="Beekeeper in Leeds"><meta property="og:image" content="https://alpha.test/avatar-a.img">',
        };
      if (url.startsWith("https://beta.test/"))
        return {
          status: 200,
          body: '<meta property="og:title" content="Rae Idris"><meta property="og:description" content="Beekeeper near Leeds"><meta property="og:image" content="https://beta.test/avatar-b.img">',
        };
      if (url.includes("avatar-b.test"))
        return { status: 200, body: "avatar-bytes-A" };
      return { status: 404, body: "" };
    },
  },
  llm: { complete: async () => "" },
  browser: { visit: async () => "" },
};

test("a recorded Identity Graph run replays identically with no origin present", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "odm-identity-"));

  const recorder = new RecordingGateway(liveOrigin);
  const recorded = await resolveIdentityGraph(
    "rae",
    recorder.ports,
    DEFAULT_SITES,
  );
  await recorder.saveTo(dir);

  const replayed = (await FixtureGateway.fromDirectory(dir)).ports;
  const replayedGraph = await resolveIdentityGraph("rae", replayed, DEFAULT_SITES);

  expect(replayedGraph).toEqual(recorded);
});

test("the pipeline resolves the Identity Graph when given fixture ports", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "odm-identity-pipeline-"));
  const recorder = new RecordingGateway(liveOrigin);
  await resolveIdentityGraph("rae", recorder.ports, DEFAULT_SITES);
  await recorder.saveTo(dir);

  const replayed = (await FixtureGateway.fromDirectory(dir)).ports;
  const result = await runPipeline(
    { handle: "rae", priorities: {}, dealbreakers: [] },
    { identityGraph: manifestIdentityGraph(replayed, DEFAULT_SITES) },
  );

  expect(result.identityGraph.seedHandle).toBe("rae");
  expect(result.identityGraph.links.length).toBeGreaterThan(0);
});
