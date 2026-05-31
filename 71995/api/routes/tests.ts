import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all, runBatch } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import {
  type TestMode,
  type TestRoundResult,
  type RatingResult,
  type StatsData,
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

router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { mode, rounds } = req.body as {
      mode: TestMode;
      rounds: TestRoundResult[];
    };

    const validModes: TestMode[] = ['visual', 'audio', 'choice', 'inhibition'];
    if (!mode || !validModes.includes(mode)) {
      res.status(400).json({ success: false, error: '无效的测试模式' });
      return;
    }

    if (!Array.isArray(rounds) || rounds.length === 0) {
      res.status(400).json({ success: false, error: '测试轮次数据不能为空' });
      return;
    }

    const sessionId = uuidv4();
    const userId = req.user!.id;

    const validRounds = rounds.filter(
      (r) => r.reactionTime != null && !r.isFoul,
    );
    const average =
      validRounds.length > 0
        ? Math.round(
            validRounds.reduce((sum, r) => sum + (r.reactionTime ?? 0), 0) /
              validRounds.length,
          )
        : null;

    const rating = average !== null ? getRating(mode, average) : null;

    const statements = rounds.map((r) => ({
      sql: 'INSERT INTO test_records (user_id, mode, session_id, round, reaction_time_ms, is_foul, stimulus_detail) VALUES (?, ?, ?, ?, ?, ?, ?)',
      params: [
        userId,
        mode,
        sessionId,
        r.round,
        r.reactionTime ?? null,
        r.isFoul ? 1 : 0,
        r.stimulusDetail ?? null,
      ],
    }));

    await runBatch(statements);

    res.status(201).json({
      success: true,
      data: { sessionId, average, rating },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: '提交测试结果失败' });
  }
});

router.get('/history', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const mode = req.query.mode as TestMode | undefined;
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    let countSql = 'SELECT COUNT(DISTINCT session_id) as total FROM test_records WHERE user_id = ?';
    let dataSql = 'SELECT session_id, mode, round, reaction_time_ms, is_foul, stimulus_detail, created_at FROM test_records WHERE user_id = ?';
    const countParams: unknown[] = [userId];
    const dataParams: unknown[] = [userId];

    if (mode) {
      countSql += ' AND mode = ?';
      dataSql += ' AND mode = ?';
      countParams.push(mode);
      dataParams.push(mode);
    }

    const countRow = await get<{ total: number }>(countSql, countParams);
    const total = countRow?.total ?? 0;

    dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    dataParams.push(limit, offset);

    const rows = await all<{
      session_id: string;
      mode: string;
      round: number;
      reaction_time_ms: number | null;
      is_foul: number;
      stimulus_detail: string | null;
      created_at: string;
    }>(dataSql, dataParams);

    const sessionMap = new Map<
      string,
      {
        sessionId: string;
        mode: string;
        rounds: TestRoundResult[];
        createdAt: string;
      }
    >();

    for (const row of rows) {
      const sid = row.session_id;
      if (!sessionMap.has(sid)) {
        sessionMap.set(sid, {
          sessionId: sid,
          mode: row.mode,
          rounds: [],
          createdAt: row.created_at,
        });
      }
      sessionMap.get(sid)!.rounds.push({
        round: row.round,
        reactionTime: row.reaction_time_ms,
        isFoul: row.is_foul === 1,
        stimulusDetail: row.stimulus_detail ?? undefined,
      });
    }

    const records = Array.from(sessionMap.values());
    res.json({ success: true, data: { records, total } });
  } catch (err) {
    res.status(500).json({ success: false, error: '获取历史记录失败' });
  }
});

router.get('/stats', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const mode = req.query.mode as TestMode | undefined;

    const modeCondition = mode ? ' AND mode = ?' : '';

    const distParams: unknown[] = [userId];
    if (mode) distParams.push(mode);

    const distributionRows = await all<{ bucket: string; count: number }>(
      `SELECT 
        CAST(reaction_time_ms / 50 * 50 AS TEXT) || '-' || CAST(reaction_time_ms / 50 * 50 + 49 AS TEXT) as bucket,
        COUNT(*) as count
      FROM test_records
      WHERE user_id = ?${modeCondition} AND is_foul = 0 AND reaction_time_ms IS NOT NULL
      GROUP BY reaction_time_ms / 50
      ORDER BY reaction_time_ms / 50`,
      distParams,
    );

    const trendParams: unknown[] = [userId];
    if (mode) trendParams.push(mode);

    const trendRows = await all<{ date: string; average: number }>(
      `SELECT 
        DATE(created_at) as date,
        ROUND(AVG(CASE WHEN is_foul = 0 THEN reaction_time_ms END), 1) as average
      FROM test_records
      WHERE user_id = ?${modeCondition} AND is_foul = 0 AND reaction_time_ms IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY date`,
      trendParams,
    );

    const avgParams: unknown[] = [userId];
    if (mode) avgParams.push(mode);

    let percentile = 50;
    const avgRow = await get<{ avg_time: number }>(
      `SELECT ROUND(AVG(reaction_time_ms), 1) as avg_time
       FROM test_records
       WHERE user_id = ?${modeCondition} AND is_foul = 0 AND reaction_time_ms IS NOT NULL`,
      avgParams,
    );

    if (avgRow && avgRow.avg_time != null) {
      const modeConditionPct = mode ? ' AND mode = ?' : '';
      const pctSubParams: unknown[] = [];
      if (mode) pctSubParams.push(mode);

      const pctParams: unknown[] = [];
      if (mode) pctParams.push(mode);
      pctParams.push(avgRow.avg_time);

      const pctRow = await get<{ percentile: number }>(
        `SELECT ROUND(
          (COUNT(*) - 1) * 100.0 / (SELECT COUNT(DISTINCT user_id) FROM test_records WHERE is_foul = 0 AND reaction_time_ms IS NOT NULL${modeConditionPct}),
          1
        ) AS percentile
        FROM test_records
        WHERE is_foul = 0 AND reaction_time_ms IS NOT NULL${modeConditionPct} AND reaction_time_ms > ?`,
        [...pctParams],
      );
      if (pctRow) percentile = pctRow.percentile;
    }

    const data: StatsData = {
      distribution: distributionRows,
      trend: trendRows,
      percentile,
    };

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

export default router;
