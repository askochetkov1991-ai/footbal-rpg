export type StandingStats = {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
};

export type Rankable = StandingStats & {
  id: string;
  nick: string;
  inMatch: boolean;
  playerScore: number;
  opponentScore: number;
};

export type Ranked<T extends Rankable> = T & { rank: number };

export function emptyStandings(): StandingStats {
  return {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    points: 0,
  };
}

export function applyMatchToStanding(
  stats: StandingStats,
  playerScore: number,
  opponentScore: number,
): StandingStats {
  const won = playerScore > opponentScore ? 1 : 0;
  const drawn = playerScore === opponentScore ? 1 : 0;
  const lost = playerScore < opponentScore ? 1 : 0;
  return {
    played: stats.played + 1,
    won: stats.won + won,
    drawn: stats.drawn + drawn,
    lost: stats.lost + lost,
    gf: stats.gf + playerScore,
    ga: stats.ga + opponentScore,
    points: stats.points + won * 3 + drawn,
  };
}

export function isOnBoard(fan: Pick<Rankable, "played" | "inMatch">): boolean {
  return fan.played > 0 || fan.inMatch;
}

export function compareBoard(a: Rankable, b: Rankable): number {
  const onA = isOnBoard(a) ? 1 : 0;
  const onB = isOnBoard(b) ? 1 : 0;
  if (onB !== onA) return onB - onA;
  if (b.points !== a.points) return b.points - a.points;
  const gdA = a.gf - a.ga;
  const gdB = b.gf - b.ga;
  if (gdB !== gdA) return gdB - gdA;
  if (b.gf !== a.gf) return b.gf - a.gf;
  const liveA = a.playerScore - a.opponentScore;
  const liveB = b.playerScore - b.opponentScore;
  if (liveB !== liveA) return liveB - liveA;
  if (b.playerScore !== a.playerScore) return b.playerScore - a.playerScore;
  return a.nick.localeCompare(b.nick, "ru");
}

export function withRanks<T extends Rankable>(fans: T[]): Ranked<T>[] {
  const sorted = fans.some(isOnBoard) ? [...fans].sort(compareBoard) : [...fans];
  return sorted.map((fan, index) => ({ ...fan, rank: index + 1 }));
}

export function podiumFans<T extends Rankable>(fans: T[], size = 3): Ranked<T>[] {
  return withRanks(fans).filter(isOnBoard).slice(0, size);
}

export function formatPlace(rank: number, fieldSize: number): string {
  return `${rank} из ${fieldSize}`;
}
