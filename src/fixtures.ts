import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ExternalPorts } from "./ports.js";

const MANIFEST_FILE = "manifest.json";

type PortName = keyof ExternalPorts;

const CALL: Record<PortName, (ports: ExternalPorts, key: string) => Promise<string>> = {
  http: (ports, key) => ports.http.get(key),
  llm: (ports, key) => ports.llm.complete(key),
  browser: (ports, key) => ports.browser.visit(key),
};

function entryId(port: PortName, key: string): string {
  return `${port}|${key}`;
}

function fileNameFor(id: string): string {
  return `${createHash("sha256").update(id).digest("hex").slice(0, 24)}.txt`;
}

export class RecordingGateway {
  readonly ports: ExternalPorts;
  readonly captured = new Map<string, string>();

  constructor(private readonly origin: ExternalPorts) {
    this.ports = replayPorts((port, key) =>
      this.through(port, key, () => CALL[port](origin, key)),
    );
  }

  private async through(
    port: PortName,
    key: string,
    call: () => Promise<string>,
  ): Promise<string> {
    const id = entryId(port, key);
    const existing = this.captured.get(id);
    if (existing !== undefined) return existing;
    const body = await call();
    this.captured.set(id, body);
    return body;
  }

  async saveTo(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
    const manifest: Record<string, string> = {};
    for (const [id, body] of this.captured) {
      const file = fileNameFor(id);
      await writeFile(path.join(dir, file), body, "utf8");
      manifest[id] = file;
    }
    await writeFile(
      path.join(dir, MANIFEST_FILE),
      JSON.stringify(manifest, null, 2),
      "utf8",
    );
  }
}

export class FixtureGateway {
  readonly ports: ExternalPorts;

  private constructor(
    private readonly manifest: Record<string, string>,
    private readonly dir: string,
  ) {
    this.ports = replayPorts((port, key) => this.replay(port, key));
  }

  static async fromDirectory(dir: string): Promise<FixtureGateway> {
    const raw = await readFile(path.join(dir, MANIFEST_FILE), "utf8");
    return new FixtureGateway(JSON.parse(raw) as Record<string, string>, dir);
  }

  private async replay(port: PortName, key: string): Promise<string> {
    const id = entryId(port, key);
    const file = this.manifest[id];
    if (!file) {
      throw new Error(
        `No fixture recorded for ${id} — record the interaction before running without live access`,
      );
    }
    return readFile(path.join(this.dir, file), "utf8");
  }
}

function replayPorts(
  perform: (port: PortName, key: string) => Promise<string>,
): ExternalPorts {
  return {
    http: { get: (key) => perform("http", key) },
    llm: { complete: (key) => perform("llm", key) },
    browser: { visit: (key) => perform("browser", key) },
  };
}
