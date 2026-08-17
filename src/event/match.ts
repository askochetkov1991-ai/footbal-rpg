import { getOpponentForMatch } from "../data/leagues";
import { pickSituations, SITUATIONS_BY_ID } from "../data/situations";
import { SITUATIONS_PER_MATCH, type LeagueLevel, type SituationOutcome } from "../types";
import type { PublicSituation } from "./protocol";

export const EVENT_LEAGUE: LeagueLevel = 3;

export function pickEventMatch(round: number) {
  const opponent = getOpponentForMatch(EVENT_LEAGUE, Math.max(0, round - 1));
  const situations = pickSituations(SITUATIONS_PER_MATCH);
  return {
    opponentName: opponent.name,
    opponentStrength: opponent.fixedStrength,
    situationIds: situations.map((situation) => situation.id),
    correctChoiceIndices: situations.map((situation) => Math.floor(Math.random() * situation.choices.length)),
  };
}

export function publicSituation(id: string): PublicSituation | null {
  const situation = SITUATIONS_BY_ID[id];
  if (!situation) return null;
  return {
    id: situation.id,
    title: situation.title,
    description: situation.description,
    choices: [...situation.choices],
  };
}

export function timeoutOutcome(
  situationId: string,
  remaining: number,
  correctIndex: number,
): SituationOutcome {
  return {
    situationId,
    correctChoice: false,
    chosenIndex: -1,
    correctIndex,
    playerGoal: false,
    aiGoal: true,
    description:
      remaining >= 3
        ? "Время вышло. Недоигранное — 0:3."
        : `Время вышло. Недоигранные ситуации — гол соперника ×${remaining}.`,
  };
}
