import { clubsInLeague } from "../data/leagues";
import {
  MATCHES_PER_SEASON,
  PLAYER_TEAM_NAME,
  SEASON_REWARDS,
  type LeagueLevel,
  type MatchResult,
  type SeasonSummary,
  type StandingRow,
} from "../types";
import { rollD6 } from "./dice";

export function emptyStandings(league: LeagueLevel): StandingRow[] {
  const rows: StandingRow[] = [
    {
      name: PLAYER_TEAM_NAME,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
      isPlayer: true,
    },
    ...clubsInLeague(league).map((club) => ({
      name: club.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
      isPlayer: false,
    })),
  ];
  return rows;
}

function applyResult(row: StandingRow, gf: number, ga: number): StandingRow {
  const won = gf > ga ? 1 : 0;
  const drawn = gf === ga ? 1 : 0;
  const lost = gf < ga ? 1 : 0;
  return {
    ...row,
    played: row.played + 1,
    won: row.won + won,
    drawn: row.drawn + drawn,
    lost: row.lost + lost,
    gf: row.gf + gf,
    ga: row.ga + ga,
    points: row.points + won * 3 + drawn,
  };
}

export function sortStandings(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

export function recordPlayerMatch(rows: StandingRow[], result: MatchResult): StandingRow[] {
  const next = rows.map((row) => {
    if (row.isPlayer) return applyResult(row, result.playerScore, result.opponentScore);
    if (row.name === result.opponentName) return applyResult(row, result.opponentScore, result.playerScore);
    return row;
  });
  return simulateAiRound(next, result.opponentName);
}

function simulateAiRound(rows: StandingRow[], skipName: string): StandingRow[] {
  const idle = rows.filter((row) => !row.isPlayer && row.name !== skipName);
  const next = [...rows];
  for (let i = 0; i + 1 < idle.length; i += 2) {
    const a = idle[i];
    const b = idle[i + 1];
    const aScore = rollD6(2).total % 4;
    const bScore = rollD6(2).total % 4;
    const idxA = next.findIndex((row) => row.name === a.name);
    const idxB = next.findIndex((row) => row.name === b.name);
    next[idxA] = applyResult(next[idxA], aScore, bScore);
    next[idxB] = applyResult(next[idxB], bScore, aScore);
  }
  return next;
}

export function seasonReward(league: LeagueLevel, place: number): number {
  const table = SEASON_REWARDS[league];
  if (place === 1) return table["1"];
  if (place === 2) return table["2"];
  return table["3-6"];
}

export function summarizeSeason(league: LeagueLevel, rows: StandingRow[]): SeasonSummary {
  const sorted = sortStandings(rows);
  const place = sorted.findIndex((row) => row.isPlayer) + 1;
  const promoted = place <= 2;
  return {
    league,
    place,
    reward: seasonReward(league, place),
    promoted,
  };
}

export function isSeasonOver(matchIndex: number): boolean {
  return matchIndex >= MATCHES_PER_SEASON;
}
