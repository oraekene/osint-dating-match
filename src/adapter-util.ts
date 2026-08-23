import type { IdentityGraph } from "./domain.js";

export function attributedHandle(
  graph: IdentityGraph,
  platform: string,
): string | null {
  const link = graph.links.find(
    (candidate) => candidate.platform === platform && !candidate.excluded,
  );
  return link?.handle ?? null;
}

export function platformJson<T>(body: string, url: string): T {
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(`Malformed JSON from ${url}`);
  }
}

export function textParts(...parts: (string | undefined)[]): string {
  return parts
    .filter((part): part is string => part !== undefined && part !== "")
    .join("\n");
}
