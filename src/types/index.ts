export type Position = "GK" | "DEF" | "MID" | "FWD";
export type PositionOrRandom = Position | "random";
export type LeagueLevel = 1 | 2 | 3;
export type GamePhase = "transfer" | "match" | "season_end" | "game_won";
export type Tab = "home" | "squad" | "transfers" | "match" | "table";
export type ClubStatus = "boss" | "mid" | "outsider" | "top" | "contender";

export type Player = {
  id: string;
  name: string;
  club: string;
  fifa: number;
  cost: number;
  position: Position;
  secret?: boolean;
  leagueRestricted?: LeagueLevel;
};

export type Situation = {
  id: string;
  title: string;
  description: string;
  position: PositionOrRandom;
  isDefensive: boolean;
  choices: [string, string, string] | string[];
};

export type AiClub = {
  id: string;
  league: LeagueLevel | number;
  name: string;
  fixedStrength: number;
  status: ClubStatus | string;
};

export type Squad = Record<Position, string | null>;

export type DiceResult = {
  rolls: number[];
  total: number;
};

export type SituationOutcome = {
  situationId: string;
  correctChoice: boolean;
  chosenIndex: number;
  correctIndex: number;
  playerGoal: boolean;
  aiGoal: boolean;
  description: string;
  playerRoll?: DiceResult;
  aiRoll?: DiceResult;
};

export type ActiveMatch = {
  opponentId: string;
  opponentName: string;
  opponentStrength: number;
  situationIds: string[];
  correctChoiceIndices: number[];
  situationIndex: number;
  playerScore: number;
  opponentScore: number;
  lastOutcome: SituationOutcome | null;
  phase: "choice" | "result" | "final";
};

export type MatchResult = {
  opponentName: string;
  playerScore: number;
  opponentScore: number;
};

export type StandingRow = {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
  isPlayer: boolean;
};

export type SeasonSummary = {
  league: LeagueLevel;
  place: number;
  reward: number;
  promoted: boolean;
};

export const POSITIONS: Position[] = ["GK", "DEF", "MID", "FWD"];

export const POSITION_LABEL: Record<Position, string> = {
  GK: "Вратарь",
  DEF: "Защитник",
  MID: "Полузащитник",
  FWD: "Нападающий",
};

export const LEAGUE_LABEL: Record<LeagueLevel, string> = {
  3: "3-я лига",
  2: "2-я лига",
  1: "1-я лига (Высшая)",
};

export const LEAGUE_BONUS: Record<LeagueLevel, number> = {
  3: 2,
  2: 1,
  1: 0,
};

export const SEASON_REWARDS: Record<LeagueLevel, Record<string, number>> = {
  3: { "1": 5, "2": 4, "3-6": 3 },
  2: { "1": 6, "2": 5, "3-6": 4 },
  1: { "1": 7, "2": 6, "3-6": 5 },
};

export const STARTING_BUDGET = 20;
export const MATCHES_PER_SEASON = 5;
export const SITUATIONS_PER_MATCH = 3;
export const PLAYER_TEAM_NAME = "Ваша команда";
