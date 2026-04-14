export interface LevelInfo {
  level: number;
  title: string;
  nextLevelPoints: number | null;
}

export function getLevelFromPoints(points: number): LevelInfo {
  if (points >= 1000) return { level: 10, title: "전설", nextLevelPoints: null };
  if (points >= 500) return { level: 9, title: "영웅", nextLevelPoints: 1000 };
  if (points >= 200) return { level: 8, title: "고수", nextLevelPoints: 500 };
  if (points >= 100) return { level: 7, title: "숙련자", nextLevelPoints: 200 };
  if (points >= 50) return { level: 6, title: "중급자", nextLevelPoints: 100 };
  if (points >= 30) return { level: 5, title: "활동가", nextLevelPoints: 50 };
  if (points >= 20) return { level: 4, title: "참여자", nextLevelPoints: 30 };
  if (points >= 10) return { level: 3, title: "새싹", nextLevelPoints: 20 };
  if (points >= 5) return { level: 2, title: "입문자", nextLevelPoints: 10 };
  return { level: 1, title: "초보자", nextLevelPoints: 5 };
}
