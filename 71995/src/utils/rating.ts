import { RATING_THRESHOLDS, RATING_META, type TestMode, type RatingResult, type RatingLevel } from '@/../shared/types';

export function getRating(averageTime: number, mode: TestMode): RatingResult {
  const thresholds = RATING_THRESHOLDS[mode];
  let level: RatingLevel;

  if (averageTime <= thresholds.lightning) {
    level = '闪电';
  } else if (averageTime <= thresholds.fast) {
    level = '极快';
  } else if (averageTime <= thresholds.normal) {
    level = '正常';
  } else {
    level = '偏慢';
  }

  const meta = RATING_META[level];
  return { level, icon: meta.icon, color: meta.color };
}

export function getRatingForDisplay(averageTime: number, mode: TestMode): string {
  const result = getRating(averageTime, mode);
  return `${result.icon} ${result.level}`;
}
