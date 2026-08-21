import type {
  Dealbreaker,
  Dossier,
  MatchOutput,
  PriorityWeights,
} from "./domain.js";

export type { MatchOutput };

export function matchDossiers(
  self: Dossier,
  subject: Dossier,
  priorities: PriorityWeights,
  dealbreakers: Dealbreaker[],
): MatchOutput {
  void self;
  void subject;
  void priorities;
  void dealbreakers;
  throw new Error("matcher lands in ticket 07");
}
