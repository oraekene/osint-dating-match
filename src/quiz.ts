import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  Claim,
  Dossier,
  DossierLayerName,
  EvidenceTrace,
  PersonRef,
} from "./domain.js";
import { emptyLayers } from "./domain.js";

export interface QuizProfile {
  displayName?: string;
  location?: string;
}

export interface CalibrationQuiz {
  profile: QuizProfile;
  responses: number[];
}

const TRAITS = [
  "Extraversion",
  "Agreeableness",
  "Conscientiousness",
  "Neuroticism",
  "Openness",
] as const;

type TraitName = (typeof TRAITS)[number];

interface QuizItem {
  trait: TraitName;
  reversed: boolean;
}

const BFI10_KEY: readonly QuizItem[] = [
  { trait: "Extraversion", reversed: true },
  { trait: "Agreeableness", reversed: false },
  { trait: "Conscientiousness", reversed: true },
  { trait: "Neuroticism", reversed: true },
  { trait: "Openness", reversed: true },
  { trait: "Extraversion", reversed: false },
  { trait: "Agreeableness", reversed: true },
  { trait: "Conscientiousness", reversed: false },
  { trait: "Neuroticism", reversed: false },
  { trait: "Openness", reversed: false },
];

function selfClaim(
  assertion: string,
  layer: DossierLayerName,
  pointers: string[],
  value?: number,
): Claim {
  const evidence: EvidenceTrace[] = pointers.map((pointer) => ({
    pointer,
    confidence: 1,
  }));
  return {
    assertion,
    layer,
    source: "self-report",
    evidence,
    confidence: 1,
    ...(value === undefined ? {} : { value }),
  };
}

function itemPointer(oneBasedIndex: number): string {
  return `calibration-quiz://responses/${oneBasedIndex}`;
}

export function scoreQuiz(quiz: CalibrationQuiz): Dossier {
  if (quiz.responses.length !== BFI10_KEY.length) {
    throw new Error(
      `Calibration Quiz expects ${BFI10_KEY.length} responses, got ${quiz.responses.length}`,
    );
  }

  const person: PersonRef = { primaryHandle: "user" };
  if (quiz.profile.displayName) {
    person.displayName = quiz.profile.displayName;
  }
  const dossier: Dossier = {
    person,
    mode: "deep-dive",
    version: 0,
    layers: emptyLayers(),
  };

  if (quiz.profile.displayName) {
    dossier.layers.identityFacts.push(
      selfClaim(`Display name: ${quiz.profile.displayName}`, "identityFacts", [
        "calibration-quiz://profile/displayName",
      ]),
    );
  }
  if (quiz.profile.location) {
    dossier.layers.identityFacts.push(
      selfClaim(`Location: ${quiz.profile.location}`, "identityFacts", [
        "calibration-quiz://profile/location",
      ]),
    );
  }

  for (const trait of TRAITS) {
    const scored: number[] = [];
    const pointers: string[] = [];
    BFI10_KEY.forEach((item, index) => {
      if (item.trait !== trait) return;
      const raw = quiz.responses[index] ?? 0;
      scored.push(item.reversed ? 6 - raw : raw);
      pointers.push(itemPointer(index + 1));
    });
    const mean = scored.reduce((sum, value) => sum + value, 0) / scored.length;
    dossier.layers.psychographics.push(
      selfClaim(
        `${trait}: ${mean.toFixed(1)} / 5`,
        "psychographics",
        pointers,
        mean,
      ),
    );
  }

  return dossier;
}

export interface SelfDossierStore {
  save(dossier: Dossier): Promise<Dossier>;
  latest(): Promise<Dossier | null>;
}

function nextVersion(dossier: Dossier, existingCount: number): Dossier {
  return { ...dossier, version: existingCount + 1 };
}

export class InMemorySelfDossierStore implements SelfDossierStore {
  #versions: Dossier[] = [];

  async save(dossier: Dossier): Promise<Dossier> {
    const versioned = nextVersion(dossier, this.#versions.length);
    this.#versions.push(versioned);
    return versioned;
  }

  async latest(): Promise<Dossier | null> {
    return this.#versions.at(-1) ?? null;
  }
}

export class JsonSelfDossierStore implements SelfDossierStore {
  constructor(private readonly dir: string) {}

  async save(dossier: Dossier): Promise<Dossier> {
    const versions = await this.#readAll();
    const versioned = nextVersion(dossier, versions.length);
    versions.push(versioned);
    await mkdir(this.dir, { recursive: true });
    await writeFile(
      path.join(this.dir, "self-dossiers.json"),
      JSON.stringify(versions, null, 2),
      "utf8",
    );
    return versioned;
  }

  async latest(): Promise<Dossier | null> {
    return (await this.#readAll()).at(-1) ?? null;
  }

  async #readAll(): Promise<Dossier[]> {
    try {
      const raw = await readFile(
        path.join(this.dir, "self-dossiers.json"),
        "utf8",
      );
      return JSON.parse(raw) as Dossier[];
    } catch {
      return [];
    }
  }
}

export interface TraitDelta {
  trait: TraitName;
  selfReported: number | null;
  inferred: number | null;
}

export interface DeltaReport {
  traits: TraitDelta[];
  note: string;
}

function claimValue(claim: Claim | undefined): number | null {
  if (!claim || claim.value === undefined) return null;
  return claim.value;
}

export function deltaReport(self: Dossier): DeltaReport {
  const traits: TraitDelta[] = TRAITS.map((trait) => {
    const claims = self.layers.psychographics.filter((claim) =>
      claim.assertion.startsWith(trait),
    );
    return {
      trait,
      selfReported: claimValue(
        claims.find((claim) => claim.source === "self-report"),
      ),
      inferred: claimValue(
        claims.find((claim) => claim.source === "inferred"),
      ),
    };
  });
  const anyInferred = traits.some((trait) => trait.inferred !== null);
  return {
    traits,
    note: anyInferred
      ? "inferred values compare engine output against the Calibration Quiz"
      : "no inferred traits yet — run Recon on a handle to populate engine inferences",
  };
}
