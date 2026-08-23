import { expect, test } from "vitest";
import type { ExternalPorts } from "./ports.js";
import {
  DEFAULT_SITES,
  resolveIdentityGraph,
} from "./identity.js";

const someoneOrigin: ExternalPorts = {
  http: {
    get: async (url) => {
      if (url.includes("nexus.io")) return { status: 404, body: "" };
      if (url.includes("exist")) return { status: 200, body: "ok" };
      if (url === "https://www.reddit.com/user/someone") {
        return {
          status: 200,
          body: page({ title: "Sam Okafor", bio: "Analog shooter", avatar: "https://shared.test/avatar-a" }),
        };
      }
      if (url === "https://api.github.com/users/someone/repos") {
        return { status: 200, body: JSON.stringify([]) };
      }
      if (url === "https://api.github.com/users/someone") {
        return {
          status: 200,
          body: JSON.stringify({ login: "someone", name: "Sam Okafor", bio: "Analog shooter" }),
        };
      }
      if (url === "https://github.com/someone") {
        return {
          status: 200,
          body: page({ title: "Sam Okafor", bio: "Analog shooter", avatar: "https://shared.test/avatar-a" }),
        };
      }
      if (url.includes("youtube.com")) {
        return {
          status: 200,
          body: page({ title: "Sam Okafor", bio: "Analog shooter", avatar: "https://shared.test/avatar-a" }),
        };
      }
      if (url.endsWith("/about.json")) {
        return {
          status: 200,
          body: JSON.stringify({
            data: { public_description: "Analog shooter" },
          }),
        };
      }
      if (url.includes("submitted.json") || url.includes("comments.json")) {
        return { status: 200, body: JSON.stringify({ data: { children: [] } }) };
      }
      if (url.includes("/avatar-a")) {
        return { status: 200, body: "avatar-bytes-A" };
      }
      if (url.includes("orbit.test/avatar")) {
        return { status: 200, body: "avatar-bytes-A" };
      }
      if (url.includes("chirp.test/avatar")) {
        return { status: 200, body: "avatar-bytes-A" };
      }
      if (url.includes("devlog.dev/avatar")) {
        return { status: 200, body: "avatar-bytes-B" };
      }
      if (url.startsWith("https://orbit.test/")) {
        return {
          status: 200,
          body: page({ title: "Sam Okafor", bio: "Photographer in Lagos", avatar: "https://orbit.test/avatar/someone.jpg" }),
        };
      }
      if (url.startsWith("https://chirp.test/")) {
        return {
          status: 200,
          body: page({ title: "Sam Okafor", bio: "Photographer based in Lagos", avatar: "https://chirp.test/avatar/someone.png" }),
        };
      }
      return {
        status: 200,
        body: page({ title: "someone_dev", bio: "Official devlog account for tools", avatar: "https://devlog.dev/avatar/someone" }),
      };
    },
  },
  llm: { complete: async () => "" },
  browser: { visit: async () => "" },
};

function page(person: { title: string; bio: string; avatar: string }): string {
  return [
    '<meta property="og:title" content="' + person.title + '">',
    '<meta property="og:description" content="' + person.bio + '">',
    '<meta property="og:image" content="' + person.avatar + '">',
  ].join("\n");
}

test("a known identity links corroborated accounts and excludes the same-name decoy", async () => {
  const graph = await resolveIdentityGraph("someone", someoneOrigin, DEFAULT_SITES);

  const byPlatform = new Map(graph.links.map((link) => [link.platform, link]));

  const orbit = byPlatform.get("Orbit");
  expect(orbit?.excluded).toBe(false);
  expect(orbit?.confidence).toBeGreaterThanOrEqual(0.6);

  const chirp = byPlatform.get("Chirp");
  expect(chirp?.excluded).toBe(false);
  expect(chirp?.confidence).toBeGreaterThanOrEqual(0.6);
  expect(chirp?.evidence.length).toBeGreaterThan(0);

  const decoy = byPlatform.get("Devlog");
  expect(decoy?.excluded).toBe(true);
  expect(decoy?.confidence).toBeLessThan(0.6);

  expect(byPlatform.has("Nexus")).toBe(false);
});

test("an impostor enumerated before the genuine accounts cannot poison attribution", async () => {
  const impostorFirst = [
    DEFAULT_SITES.find((site) => site.name === "Devlog"),
    ...DEFAULT_SITES.filter((site) => site.name !== "Devlog"),
  ].filter((site) => site !== undefined);

  const graph = await resolveIdentityGraph(
    "someone",
    someoneOrigin,
    impostorFirst,
  );

  const byPlatform = new Map(graph.links.map((link) => [link.platform, link]));
  expect(byPlatform.get("Orbit")?.excluded).toBe(false);
  expect(byPlatform.get("Chirp")?.excluded).toBe(false);
  expect(byPlatform.get("Devlog")?.excluded).toBe(true);
});

test("every included link carries evidence pointers and a confidence score", async () => {
  const graph = await resolveIdentityGraph("someone", someoneOrigin, DEFAULT_SITES);
  for (const link of graph.links.filter((l) => !l.excluded)) {
    expect(link.confidence).toBeGreaterThan(0);
    expect(link.evidence.length).toBeGreaterThan(0);
    for (const trace of link.evidence) {
      expect(trace.pointer).toBeTruthy();
    }
  }
});
