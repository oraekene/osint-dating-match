import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Dossier } from "./domain.js";
import type { DossierAssemblyStage } from "./spine.js";
import { dedupKey, DOSSIER_LAYERS } from "./domain.js";

function contentKey(dossier: Dossier): string {
  const claims = DOSSIER_LAYERS.flatMap((layer) =>
    dossier.layers[layer].map(
      (claim) =>
        `${dedupKey(claim.layer, claim.assertion)}|${claim.evidence
          .map((e) => e.pointer)
          .sort()
          .join(",")}`,
    ),
  ).sort();
  return `${dossier.person.primaryHandle}::${claims.join("::")}`;
}

export interface SubjectDossierStore {
  save(dossier: Dossier): Promise<Dossier>;
  latestFor(handle: string): Promise<Dossier | null>;
}

function latestForHandle(versions: Dossier[], handle: string): Dossier | null {
  return versions.filter((v) => v.person.primaryHandle === handle).at(-1) ?? null;
}

export function versionedAssembly(
  inner: DossierAssemblyStage,
  store: SubjectDossierStore,
): DossierAssemblyStage {
  return {
    assemble: async (handle, claims) =>
      store.save(await inner.assemble(handle, claims)),
  };
}

async function saveInto(
  readAll: () => Promise<Dossier[]>,
  writeAll: (versions: Dossier[]) => Promise<void>,
  dossier: Dossier,
): Promise<Dossier> {
  const versions = await readAll();
  const existing = latestForHandle(versions, dossier.person.primaryHandle);
  if (existing && contentKey(existing) === contentKey(dossier)) {
    return existing;
  }
  const sameHandleCount = versions.filter(
    (version) => version.person.primaryHandle === dossier.person.primaryHandle,
  ).length;
  const versioned: Dossier = { ...dossier, version: sameHandleCount + 1 };
  versions.push(versioned);
  await writeAll(versions);
  return versioned;
}

export class InMemorySubjectDossierStore implements SubjectDossierStore {
  #versions: Dossier[] = [];

  save(dossier: Dossier): Promise<Dossier> {
    return saveInto(
      async () => [...this.#versions],
      async (versions) => {
        this.#versions = versions;
      },
      dossier,
    );
  }

  async latestFor(handle: string): Promise<Dossier | null> {
    return latestForHandle(this.#versions, handle);
  }
}

export class JsonSubjectDossierStore implements SubjectDossierStore {
  constructor(private readonly dir: string) {}

  save(dossier: Dossier): Promise<Dossier> {
    return saveInto(
      () => this.#readAll(),
      (versions) => this.#writeAll(versions),
      dossier,
    );
  }

  async latestFor(handle: string): Promise<Dossier | null> {
    return latestForHandle(await this.#readAll(), handle);
  }

  async #readAll(): Promise<Dossier[]> {
    try {
      const raw = await readFile(path.join(this.dir, "dossiers.json"), "utf8");
      return JSON.parse(raw) as Dossier[];
    } catch {
      return [];
    }
  }

  async #writeAll(versions: Dossier[]): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(
      path.join(this.dir, "dossiers.json"),
      JSON.stringify(versions, null, 2),
      "utf8",
    );
  }
}
