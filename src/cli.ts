import { readFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { FixtureGateway } from "./fixtures.js";
import type { PipelineInput } from "./domain.js";
import { defaultSpine, runPipeline, type Spine } from "./pipeline.js";
import {
  JsonSelfDossierStore,
  scoreQuiz,
  type CalibrationQuiz,
} from "./quiz.js";

export async function main(args: string[]): Promise<string> {
  let fixturesDir: string | null = null;
  let quizFile: string | null = null;
  let selfDir = "self-dossiers";
  let dossierDir = "dossiers";
  let cacheDir = ".cache";
  const positional: string[] = [];
  const flags: Record<string, (value: string) => void> = {
    "--fixtures": (value) => (fixturesDir = value),
    "--cache-dir": (value) => (cacheDir = value),
    "--quiz": (value) => (quizFile = value),
    "--dossier-dir": (value) => (dossierDir = value),
    "--self-dir": (value) => (selfDir = value),
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] ?? "";
    const flag = flags[arg];
    if (flag) {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`usage: ${arg} requires a value argument`);
      }
      flag(value);
      i++;
      continue;
    }
    positional.push(arg);
  }

  if (quizFile) {
    const raw = await readFile(quizFile, "utf8");
    const quiz = JSON.parse(raw) as CalibrationQuiz;
    const store = new JsonSelfDossierStore(selfDir);
    return JSON.stringify(await store.save(scoreQuiz(quiz)), null, 2);
  }

  const handle = positional[0];
  if (!handle) {
    throw new Error(
      "usage: npm start -- [--fixtures <dir>] [--cache-dir <dir>] [--dossier-dir <dir>] [--quiz <answers.json>] [--self-dir <dir>] <handle>",
    );
  }

  let spineOverride: Partial<Spine> = {};
  if (fixturesDir) {
    const gateway = await FixtureGateway.fromDirectory(fixturesDir);
    spineOverride = defaultSpine(gateway.ports, {
      cacheDir,
      dossierDir,
    });
  }

  let selfDossier: PipelineInput["selfDossier"] = undefined;
  try {
    const store = new JsonSelfDossierStore(selfDir);
    const latest = await store.latest();
    if (latest) selfDossier = latest;
  } catch {
    // no self dossier available — run without it
  }

  const input: PipelineInput = {
    handle,
    priorities: {},
    dealbreakers: [],
    ...(selfDossier ? { selfDossier } : {}),
  };
  const result = await runPipeline(input, spineOverride);
  return JSON.stringify(result, null, 2);
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(realpathSync(entry)).href) {
  console.log(await main(process.argv.slice(2)));
}
