import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { HttpPort, HttpResponseBody } from "./ports.js";

function isHttpResponseBody(value: unknown): value is HttpResponseBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<HttpResponseBody>;
  return (
    typeof candidate.status === "number" && typeof candidate.body === "string"
  );
}

function fileFor(dir: string, url: string): string {
  return path.join(
    dir,
    `${createHash("sha256").update(url).digest("hex").slice(0, 24)}.json`,
  );
}

export class CachingHttpPort implements HttpPort {
  constructor(
    private readonly origin: HttpPort,
    private readonly dir: string,
  ) {}

  async get(url: string): Promise<HttpResponseBody> {
    const cached = await this.#read(url);
    if (cached) return cached;

    const fresh = await this.origin.get(url);
    if (fresh.status >= 200 && fresh.status < 300) {
      await mkdir(this.dir, { recursive: true });
      await writeFile(fileFor(this.dir, url), JSON.stringify(fresh), "utf8");
    }
    return fresh;
  }

  async #read(url: string): Promise<HttpResponseBody | null> {
    let raw: string;
    try {
      raw = await readFile(fileFor(this.dir, url), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return null;
      throw error;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!isHttpResponseBody(parsed)) {
      throw new Error(`Corrupted cache entry for ${url}`);
    }
    return parsed;
  }
}
