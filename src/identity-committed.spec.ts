import { expect, test } from "vitest";
import { FixtureGateway } from "./fixtures.js";
import { DEFAULT_SITES, resolveIdentityGraph } from "./identity.js";

test("the committed known-identity fixture set resolves with zero false attributions", async () => {
  const gateway = await FixtureGateway.fromDirectory("fixtures/identity-known");
  const graph = await resolveIdentityGraph(
    "someone",
    gateway.ports,
    DEFAULT_SITES,
  );

  const byPlatform = new Map(graph.links.map((link) => [link.platform, link]));
  expect(byPlatform.get("Orbit")?.excluded).toBe(false);
  expect(byPlatform.get("Chirp")?.excluded).toBe(false);
  expect(byPlatform.get("Devlog")?.excluded).toBe(true);
  expect(byPlatform.has("Nexus")).toBe(false);
});
