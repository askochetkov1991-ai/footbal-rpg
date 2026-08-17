import { SITUATIONS_BY_ID, pickSituations } from "../data/situations";
import { getPlayer } from "../data/players";
import { getOpponentForMatch } from "../data/leagues";
import {
  LEAGUE_BONUS,
  SITUATIONS_PER_MATCH,
  type ActiveMatch,
  type LeagueLevel,
  type Position,
  type SituationOutcome,
  type Squad,
} from "../types";
import { aiDiceCount, rollD6 } from "./dice";

export function resolveSituationPosition(situationId: string, squad: Squad): Position {
  const situation = SITUATIONS_BY_ID[situationId];
  if (!situation) return "MID";
  if (situation.position !== "random") return situation.position;

  const filled = (["GK", "DEF", "MID", "FWD"] as Position[]).filter((pos) => squad[pos]);
  if (filled.length === 0) return "MID";
  const attackers = filled.filter((pos) => pos === "FWD" || pos === "MID");
  const pool = situation.isDefensive
    ? filled.filter((pos) => pos === "GK" || pos === "DEF")
    : attackers.length > 0
      ? attackers
      : filled;
  const use = pool.length > 0 ? pool : filled;
  return use[Math.floor(Math.random() * use.length)] ?? "MID";
}

export function resolveChoice(
  situationId: string,
  chosenIndex: number,
  correctIndex: number,
  squad: Squad,
  league: LeagueLevel,
  opponentStrength: number,
): SituationOutcome {
  const situation = SITUATIONS_BY_ID[situationId];
  if (!situation) throw new Error(`Unknown situation: ${situationId}`);
  if (situation.choices[chosenIndex] === undefined) {
    throw new Error(`Invalid choice index: ${chosenIndex}`);
  }

  const position = resolveSituationPosition(situationId, squad);
  const playerId = squad[position];
  const player = playerId ? getPlayer(playerId) : undefined;

  if (chosenIndex === correctIndex) {
    if (situation.isDefensive) {
      return {
        situationId,
        correctChoice: true,
        chosenIndex,
        correctIndex,
        playerGoal: false,
        aiGoal: false,
        description: "Верное решение! Сейв — гол соперника не засчитан.",
      };
    }
    return {
      situationId,
      correctChoice: true,
      chosenIndex,
      correctIndex,
      playerGoal: true,
      aiGoal: false,
      description: "Верное решение! Гол вашей команды!",
    };
  }

  const playerDice = ((player?.cost ?? 3) + LEAGUE_BONUS[league]);
  const playerRoll = rollD6(playerDice);
  const aiRoll = rollD6(aiDiceCount(opponentStrength));
  const playerWins = playerRoll.total >= aiRoll.total;
  const name = player?.name ?? "Игрок";

  if (situation.isDefensive) {
    return playerWins
      ? {
          situationId,
          correctChoice: false,
          chosenIndex,
          correctIndex,
          playerRoll,
          aiRoll,
          playerGoal: false,
          aiGoal: false,
          description: `${name} отбил атаку! Сейв после броска кубиков.`,
        }
      : {
          situationId,
          correctChoice: false,
          chosenIndex,
          correctIndex,
          playerRoll,
          aiRoll,
          playerGoal: false,
          aiGoal: true,
          description: "Соперник пробил после броска кубиков. Гол!",
        };
  }

  return playerWins
    ? {
        situationId,
        correctChoice: false,
        chosenIndex,
        correctIndex,
        playerRoll,
        aiRoll,
        playerGoal: true,
        aiGoal: false,
        description: `${name} забил после броска кубиков!`,
      }
    : {
        situationId,
        correctChoice: false,
        chosenIndex,
        correctIndex,
        playerRoll,
        aiRoll,
        playerGoal: false,
        aiGoal: true,
        description: "Соперник забил после броска кубиков!",
      };
}

export function applyOutcome(match: ActiveMatch, outcome: SituationOutcome): ActiveMatch {
  return {
    ...match,
    playerScore: match.playerScore + (outcome.playerGoal ? 1 : 0),
    opponentScore: match.opponentScore + (outcome.aiGoal ? 1 : 0),
    lastOutcome: outcome,
    phase: match.situationIndex >= match.situationIds.length - 1 ? "final" : "result",
  };
}

export function startMatch(league: LeagueLevel, matchIndex: number, _squad: Squad): ActiveMatch {
  const opponent = getOpponentForMatch(league, matchIndex);
  const situations = pickSituations(SITUATIONS_PER_MATCH);
  return {
    opponentId: opponent.id,
    opponentName: opponent.name,
    opponentStrength: opponent.fixedStrength,
    situationIds: situations.map((s) => s.id),
    correctChoiceIndices: situations.map((s) => Math.floor(Math.random() * s.choices.length)),
    situationIndex: 0,
    playerScore: 0,
    opponentScore: 0,
    lastOutcome: null,
    phase: "choice",
  };
}
