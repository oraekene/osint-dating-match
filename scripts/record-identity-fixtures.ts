import { mkdir } from "node:fs/promises";
import path from "node:path";
import { RecordingGateway } from "../src/fixtures.js";
import type { ExternalPorts } from "../src/ports.js";

function page(p: {
  title: string;
  bio: string;
  avatar: string;
}): string {
  return `<meta property="og:title" content="${p.title}">\n<meta property="og:description" content="${p.bio}">\n<meta property="og:image" content="${p.avatar}">`;
}

const liveOrigin: ExternalPorts = {
  http: {
    get: async (url) => {
      if (url.includes("nexus.io")) return { status: 404, body: "" };
      if (url.includes("/exist/")) return { status: 200, body: "ok" };
      if (url.includes("avatar-a.test"))
        return { status: 200, body: "avatar-bytes-A" };
      if (url.includes("avatar-c.test"))
        return { status: 200, body: "avatar-bytes-C" };
      if (url.startsWith("https://orbit.test/"))
        return {
          status: 200,
          body: page({
            title: "Sam Okafor",
            bio: "Photographer in Lagos",
            avatar: "https://cdn.shared.test/avatar-a.test",
          }),
        };
      if (url.startsWith("https://chirp.test/"))
        return {
          status: 200,
          body: page({
            title: "Sam Okafor",
            bio: "Photographer based in Lagos",
            avatar: "https://cdn.shared.test/avatar-a.test",
          }),
        };
      return {
        status: 200,
        body: page({
          title: "someone_dev",
          bio: "Official devlog account for release notes and tooling updates",
          avatar: "https://cdn.shared.test/avatar-c.test",
        }),
      };
    },
  },
  llm: { complete: async () => "" },
  browser: { visit: async () => "" },
};

const outDir = path.join("fixtures", "identity-known");
await mkdir(outDir, { recursive: true });
const recorder = new RecordingGateway(liveOrigin);
await recorder.ports.http.get("https://orbit.test/exist/someone");
console.log(
  `recorded ${recorder.captured.size} interactions — resolving to populate all entries`,
);

const { resolveIdentityGraph, DEFAULT_SITES } = await import(
  "../src/identity.js"
);
await resolveIdentityGraph("someone", recorder.ports, DEFAULT_SITES);
await recorder.saveTo(outDir);
console.log(`saved fixture set to ${outDir}`);
