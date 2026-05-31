import { Router, type Request, type Response } from 'express';
import { all } from '../db/index.js';
import {
  type TestMode,
  type AgeGroup,
  type LeaderboardEntry,
  type RatingResult,
  RATING_THRESHOLDS,
  RATING_META,
} from '../../shared/types.js';

const router = Router();

function getRating(mode: TestMode, avgTime: number): RatingResult {
  const t = RATING_THRESHOLDS[mode];
  let level: '闪电' | '极快' | '正常' | '偏慢';
  if (avgTime <= t.lightning) level = '闪电';
  else if (avgTime <= t.fast) level = '极快';
  else if (avgTime <= t.normal) level = '正常';
  else level = '偏慢';
  const meta = RATING_META[level];
  return { level, icon: meta.icon, color: meta.color };
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const mode = req.query.mode as TestMode;
    const ageGroup = req.query.ageGroup as AgeGroup | undefined;
    const region = req.query.region as string | undefined;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const validModes: TestMode[] = ['visual', 'audio', 'choice', 'inhibition'];
    if (!mode || !validModes.includes(mode)) {
      res.status(400).json({ success: false, error: '无效的测试模式' });
      return;
    }

    let sql = `
      SELECT
        u.id as user_id,
        u.nickname,
        u.region,
        u.age_group,
        ROUND(AVG(tr.reaction_time_ms), 1) as average_time,
        COUNT(DISTINCT tr.session_id) as test_count
      FROM test_records tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.mode = ? AND tr.is_foul = 0 AND tr.reaction_time_ms IS NOT NULL
    `;
    const params: unknown[] = [mode];

    if (ageGroup) {
      sql += ' AND u.age_group = ?';
      params.push(ageGroup);
    }
    if (region) {
      sql += ' AND u.region = ?';
      params.push(region);
    }

    sql += `
      GROUP BY tr.user_id
      HAVING average_time IS NOT NULL
      ORDER BY average_time ASC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const rows = await all<{
      user_id: number;
      nickname: string;
      region: string;
      age_group: string;
      average_time: number;
      test_count: number;
    }>(sql, params);

    const rankings: LeaderboardEntry[] = rows.map((row, idx) => ({
      rank: offset + idx + 1,
      userId: row.user_id,
      nickname: row.nickname,
      region: row.region,
      ageGroup: row.age_group as AgeGroup,
      averageTime: row.average_time,
      rating: getRating(mode, row.average_time),
      testCount: row.test_count,
    }));

    res.json({ success: true, data: { rankings } });
  } catch (err) {
    res.status(500).json({ success: false, error: '获取排行榜失败' });
  }
});

export default router;
