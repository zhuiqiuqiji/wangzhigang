import { JudgeType } from '@/types/game';

const JUDGE_WINDOWS = {
  perfect: 50,
  great: 100,
  good: 150,
};

export function judgeNote(timeDiff: number): JudgeType {
  const absDiff = Math.abs(timeDiff);
  
  if (absDiff <= JUDGE_WINDOWS.perfect) {
    return 'perfect';
  } else if (absDiff <= JUDGE_WINDOWS.great) {
    return 'great';
  } else if (absDiff <= JUDGE_WINDOWS.good) {
    return 'good';
  } else {
    return 'miss';
  }
}

export function getJudgeColor(type: JudgeType): string {
  const colors: Record<JudgeType, string> = {
    perfect: '#ffd700',
    great: '#00ff88',
    good: '#00aaff',
    miss: '#ff4444',
  };
  return colors[type];
}

export function getJudgeText(type: JudgeType): string {
  const texts: Record<JudgeType, string> = {
    perfect: 'PERFECT',
    great: 'GREAT',
    good: 'GOOD',
    miss: 'MISS',
  };
  return texts[type];
}
