import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { CachingHttpPort } from "./cache.js";
import type { IdentityGraph } from "./domain.js";
import type { HttpPort } from "./ports.js";
import { redditAcquisition } from "./reddit.js";

const graph: IdentityGraph = {
  seedHandle: "someone",
  links: [
    {
      platform: "Reddit",
      handle: "someone_r",
      confidence: 0.95,
      evidence: [],
      excluded: false,
    },
  ],
};

test("a second collection is served from cache with zero new fetches", async () => {
  let fetches = 0;
  const countingOrigin: HttpPort = {
    get: async (url) => {
      fetches += 1;
      return {
        status: 200,
        body: JSON.stringify({ data: { children: [] }, url }),
      };
    },
  };

  const dir = await mkdtemp(path.join(tmpdir(), "odm-cache-"));
  const cached = new CachingHttpPort(countingOrigin, dir);
  const adapter = redditAcquisition(cached);

  await adapter.collect(graph);
  const afterFirst = fetches;
  expect(afterFirst).toBeGreaterThan(0);

  await adapter.collect(graph);
  expect(fetches).toBe(afterFirst);
});

test("a fresh cache instance over the same directory still skips the origin", async () => {
  let fetches = 0;
  const countingOrigin: HttpPort = {
    get: async () => {
      fetches += 1;
      return { status: 200, body: JSON.stringify({ data: {} }) };
    },
  };

  const dir = await mkdtemp(path.join(tmpdir(), "odm-cache-"));
  await new CachingHttpPort(countingOrigin, dir).get("https://example.test/x");
  expect(fetches).toBe(1);

  const reopened = new CachingHttpPort(countingOrigin, dir);
  const hit = await reopened.get("https://example.test/x");
  expect(fetches).toBe(1);
  expect(hit).toEqual({ status: 200, body: JSON.stringify({ data: {} }) });
});
