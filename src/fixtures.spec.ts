import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { FixtureGateway, RecordingGateway } from "./fixtures.js";
import type { ExternalPorts } from "./ports.js";

async function tempDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "odm-fixtures-"));
}

const liveOrigin: ExternalPorts = {
  http: { get: async (url) => ({ status: 200, body: `body:${url}` }) },
  llm: { complete: async (prompt) => `completion:${prompt}` },
  browser: { visit: async (url) => `snapshot:${url}` },
};

test("interactions recorded against an origin replay identically with no origin present", async () => {
  const dir = await tempDir();
  const recorder = new RecordingGateway(liveOrigin);
  await recorder.ports.http.get("https://example.test/a");
  await recorder.ports.llm.complete("extract claims");
  await recorder.ports.browser.visit("https://example.test/profile");
  await recorder.saveTo(dir);

  const replayed = (await FixtureGateway.fromDirectory(dir)).ports;

  expect(await replayed.http.get("https://example.test/a")).toEqual({
    status: 200,
    body: "body:https://example.test/a",
  });
  expect(await replayed.llm.complete("extract claims")).toBe(
    "completion:extract claims",
  );
  expect(await replayed.browser.visit("https://example.test/profile")).toBe(
    "snapshot:https://example.test/profile",
  );
});

test("replaying an interaction that was never recorded fails loudly instead of going live", async () => {
  const dir = await tempDir();
  const recorder = new RecordingGateway(liveOrigin);
  await recorder.ports.http.get("https://example.test/a");
  await recorder.saveTo(dir);

  const replayed = (await FixtureGateway.fromDirectory(dir)).ports;

  await expect(replayed.http.get("https://example.test/never-recorded")).rejects.toThrow(
    /No fixture recorded/,
  );
});
