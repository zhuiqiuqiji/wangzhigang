import { JudgeType, GameStatus, Rating } from '@/types/game';

const SCORE_VALUES: Record<JudgeType, number> = {
  perfect: 100,
  great: 70,
  good: 30,
  miss: 0,
};

export function calculateScore(judge: JudgeType, combo: number): number {
  const baseScore = SCORE_VALUES[judge];
  const comboBonus = 1 + Math.min(combo, 100) / 100;
  return Math.floor(baseScore * comboBonus);
}

export function calculateAccuracy(status: GameStatus): number {
  const total = status.perfect + status.great + status.good + status.miss;
  if (total === 0) return 0;
  
  const weighted = status.perfect * 100 + status.great * 70 + status.good * 30;
  return weighted / (total * 100);
}

export function calculateRating(accuracy: number): Rating {
  if (accuracy >= 0.95) return 'S';
  if (accuracy >= 0.85) return 'A';
  if (accuracy >= 0.70) return 'B';
  if (accuracy >= 0.50) return 'C';
  return 'D';
}

export function getRatingColor(rating: Rating): string {
  const colors: Record<Rating, string> = {
    S: '#ffd700',
    A: '#00ff88',
    B: '#00aaff',
    C: '#ffaa00',
    D: '#ff4444',
  };
  return colors[rating];
}

export function getMaxScore(totalNotes: number): number {
  let maxScore = 0;
  for (let i = 0; i < totalNotes; i++) {
    const comboBonus = 1 + Math.min(i, 100) / 100;
    maxScore += Math.floor(100 * comboBonus);
  }
  return maxScore;
}
