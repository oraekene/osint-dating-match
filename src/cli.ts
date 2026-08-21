import path from "node:path";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { runPipeline } from "./pipeline.js";

export async function main(args: string[]): Promise<string> {
  const handle = args[0];
  if (!handle) {
    throw new Error("usage: npm start -- <handle>");
  }
  const result = await runPipeline({
    handle,
    priorities: {},
    dealbreakers: [],
  });
  return JSON.stringify(result, null, 2);
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(realpathSync(entry)).href) {
  console.log(await main(process.argv.slice(2)));
}
