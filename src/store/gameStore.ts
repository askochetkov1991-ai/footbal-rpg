import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getPlayer } from "../data/players";
import { getOpponentForMatch } from "../data/leagues";
import { applyOutcome, resolveChoice, startMatch } from "../engine/match";
import {
  emptyStandings,
  isSeasonOver,
  recordPlayerMatch,
  sortStandings,
  summarizeSeason,
} from "../engine/season";
import {
  POSITIONS,
  STARTING_BUDGET,
  type ActiveMatch,
  type GamePhase,
  type LeagueLevel,
  type SeasonSummary,
  type Squad,
  type StandingRow,
  type Tab,
} from "../types";

type GameState = {
  budget: number;
  league: LeagueLevel;
  squad: Squad;
  ownedPlayerIds: string[];
  matchIndex: number;
  results: { opponentName: string; playerScore: number; opponentScore: number }[];
  standings: StandingRow[];
  phase: GamePhase;
  activeTab: Tab;
  activeMatch: ActiveMatch | null;
  seasonSummary: SeasonSummary | null;
  setActiveTab: (tab: Tab) => void;
  buyPlayer: (id: string) => void;
  sellPlayer: (id: string) => void;
  assignPlayer: (id: string) => void;
  startNextMatch: () => void;
  chooseAction: (index: number) => void;
  advanceSituation: () => void;
  finishMatch: () => void;
  continueAfterSeason: () => void;
  resetGame: () => void;
  squadComplete: () => boolean;
  getCurrentOpponentName: () => string;
};

function emptySquad(): Squad {
  return { GK: null, DEF: null, MID: null, FWD: null };
}

function initialState() {
  return {
    budget: STARTING_BUDGET,
    league: 3 as LeagueLevel,
    squad: emptySquad(),
    ownedPlayerIds: [] as string[],
    matchIndex: 0,
    results: [] as GameState["results"],
    standings: emptyStandings(3),
    phase: "transfer" as GamePhase,
    activeTab: "home" as Tab,
    activeMatch: null as ActiveMatch | null,
    seasonSummary: null as SeasonSummary | null,
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState(),
      setActiveTab: (tab) => set({ activeTab: tab }),
      squadComplete: () => POSITIONS.every((pos) => Boolean(get().squad[pos])),
      getCurrentOpponentName: () => {
        const { league, matchIndex } = get();
        return getOpponentForMatch(league, matchIndex)?.name ?? "—";
      },
      buyPlayer: (id) => {
        const player = getPlayer(id);
        if (!player) return;
        const { budget, ownedPlayerIds, squad, league } = get();
        if (ownedPlayerIds.includes(id)) return;
        if (player.secret && player.leagueRestricted && league > player.leagueRestricted) return;
        if (budget < player.cost) return;
        const nextSquad = { ...squad };
        if (!nextSquad[player.position]) nextSquad[player.position] = id;
        set({
          budget: budget - player.cost,
          ownedPlayerIds: [...ownedPlayerIds, id],
          squad: nextSquad,
        });
      },
      sellPlayer: (id) => {
        const player = getPlayer(id);
        if (!player) return;
        const { budget, ownedPlayerIds, squad } = get();
        if (!ownedPlayerIds.includes(id)) return;
        const nextSquad = { ...squad };
        if (nextSquad[player.position] === id) nextSquad[player.position] = null;
        set({
          budget: budget + player.cost,
          ownedPlayerIds: ownedPlayerIds.filter((owned) => owned !== id),
          squad: nextSquad,
        });
      },
      assignPlayer: (id) => {
        const player = getPlayer(id);
        if (!player) return;
        if (!get().ownedPlayerIds.includes(id)) return;
        set({ squad: { ...get().squad, [player.position]: id } });
      },
      startNextMatch: () => {
        const state = get();
        if (!POSITIONS.every((pos) => Boolean(state.squad[pos]))) return;
        if (state.phase === "game_won" || state.phase === "season_end") return;
        const match = startMatch(state.league, state.matchIndex, state.squad);
        set({ activeMatch: match, phase: "match", activeTab: "match" });
      },
      chooseAction: (index) => {
        const { activeMatch, squad, league } = get();
        if (!activeMatch || activeMatch.phase !== "choice") return;
        const situationId = activeMatch.situationIds[activeMatch.situationIndex];
        const correct = activeMatch.correctChoiceIndices[activeMatch.situationIndex];
        const outcome = resolveChoice(
          situationId,
          index,
          correct,
          squad,
          league,
          activeMatch.opponentStrength,
        );
        set({ activeMatch: applyOutcome(activeMatch, outcome) });
      },
      advanceSituation: () => {
        const { activeMatch } = get();
        if (!activeMatch || activeMatch.phase !== "result") return;
        set({
          activeMatch: {
            ...activeMatch,
            situationIndex: activeMatch.situationIndex + 1,
            lastOutcome: null,
            phase: "choice",
          },
        });
      },
      finishMatch: () => {
        const { activeMatch, standings, results, matchIndex, league } = get();
        if (!activeMatch || activeMatch.phase !== "final") return;
        const result = {
          opponentName: activeMatch.opponentName,
          playerScore: activeMatch.playerScore,
          opponentScore: activeMatch.opponentScore,
        };
        const nextStandings = recordPlayerMatch(standings, result);
        const nextIndex = matchIndex + 1;
        if (isSeasonOver(nextIndex)) {
          const summary = summarizeSeason(league, nextStandings);
          set({
            results: [...results, result],
            standings: nextStandings,
            matchIndex: nextIndex,
            activeMatch: null,
            seasonSummary: summary,
            phase: league === 1 && summary.place === 1 ? "game_won" : "season_end",
            activeTab: "table",
          });
          return;
        }
        set({
          results: [...results, result],
          standings: nextStandings,
          matchIndex: nextIndex,
          activeMatch: null,
          phase: "transfer",
          activeTab: "home",
        });
      },
      continueAfterSeason: () => {
        const { seasonSummary, budget, league } = get();
        if (!seasonSummary) return;
        if (league === 1 && seasonSummary.place === 1) {
          set({ phase: "game_won" });
          return;
        }
        const promoted = seasonSummary.promoted && league > 1;
        const nextLeague = (promoted ? ((league - 1) as LeagueLevel) : league);
        set({
          budget: budget + seasonSummary.reward,
          league: nextLeague,
          matchIndex: 0,
          results: [],
          standings: emptyStandings(nextLeague),
          seasonSummary: null,
          phase: "transfer",
          activeTab: "home",
        });
      },
      resetGame: () => set(initialState()),
    }),
    { name: "football-rpg-voice-save" },
  ),
);

export function ownedPlayers() {
  const ids = useGameStore.getState().ownedPlayerIds;
  return ids.map((id) => getPlayer(id)).filter(Boolean);
}
