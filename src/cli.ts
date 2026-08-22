import { readFile } from "node:fs/promises";
import path from "node:path";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { FixtureGateway } from "./fixtures.js";
import { manifestIdentityGraph } from "./identity.js";
import type { PipelineInput } from "./domain.js";
import { runPipeline, type Spine } from "./pipeline.js";
import {
  JsonSelfDossierStore,
  scoreQuiz,
  type CalibrationQuiz,
} from "./quiz.js";

export async function main(args: string[]): Promise<string> {
  let fixturesDir: string | null = null;
  let quizFile: string | null = null;
  let selfDir = "self-dossiers";
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--fixtures") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("usage: --fixtures requires a directory argument");
      }
      fixturesDir = value;
      i++;
      continue;
    }
    if (arg === "--quiz") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("usage: --quiz requires an answers file argument");
      }
      quizFile = value;
      i++;
      continue;
    }
    if (arg === "--self-dir") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("usage: --self-dir requires a directory argument");
      }
      selfDir = value;
      i++;
      continue;
    }
    positional.push(arg ?? "");
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
      "usage: npm start -- [--fixtures <dir>] [--quiz <answers.json>] <handle>",
    );
  }

  const overrides: Partial<Spine> = {};
  if (fixturesDir) {
    const gateway = await FixtureGateway.fromDirectory(fixturesDir);
    overrides.identityGraph = manifestIdentityGraph(gateway.ports);
  }

  const input: PipelineInput = { handle, priorities: {}, dealbreakers: [] };
  const result = await runPipeline(input, overrides);
  return JSON.stringify(result, null, 2);
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(realpathSync(entry)).href) {
  console.log(await main(process.argv.slice(2)));
}
