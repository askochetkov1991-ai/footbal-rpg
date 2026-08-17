import type { AiClub } from "../types";

export const AI_CLUBS: AiClub[] = [
  { id: "l3-rubies", league: 3, name: "Рубиновые ребята", fixedStrength: 24, status: "boss" },
  { id: "l3-rays", league: 3, name: "Ростовские раки", fixedStrength: 21, status: "mid" },
  { id: "l3-seagulls", league: 3, name: "Брайтонские чайки", fixedStrength: 19, status: "mid" },
  { id: "l3-sailors", league: 3, name: "Гаврские морячки", fixedStrength: 17, status: "outsider" },
  { id: "l3-palms", league: 3, name: "Пальмовые ладошки", fixedStrength: 16, status: "outsider" },
  { id: "l2-bees", league: 2, name: "Дортмундские шмели", fixedStrength: 34, status: "boss" },
  { id: "l2-mattress", league: 2, name: "Атлетические матрасники", fixedStrength: 32, status: "boss" },
  { id: "l2-spurs", league: 2, name: "Тоттенхэмские шпоры", fixedStrength: 29, status: "mid" },
  { id: "l2-oranges", league: 2, name: "Валенсийские апельсины", fixedStrength: 27, status: "mid" },
  { id: "l2-princes", league: 2, name: "Монакские князья", fixedStrength: 25, status: "mid" },
  { id: "l2-pizzas", league: 2, name: "Неаполитанские пиццы", fixedStrength: 22, status: "outsider" },
  { id: "l1-reals", league: 1, name: "Мадридские реалы", fixedStrength: 40, status: "top" },
  { id: "l1-barca", league: 1, name: "Барселончики", fixedStrength: 40, status: "top" },
  { id: "l1-cats", league: 1, name: "Ливерные коты", fixedStrength: 38, status: "top" },
  { id: "l1-city", league: 1, name: "Городской Манчестер", fixedStrength: 36, status: "contender" },
  { id: "l1-bavaria", league: 1, name: "Мюнхенские ребята", fixedStrength: 33, status: "mid" },
  { id: "l1-buns", league: 1, name: "Парижские булки", fixedStrength: 30, status: "outsider" },
];

export function clubsInLeague(league: number) {
  return AI_CLUBS.filter((c) => c.league === league);
}

export function getOpponentForMatch(league: number, matchIndex: number) {
  const clubs = clubsInLeague(league);
  return clubs[matchIndex % clubs.length];
}
