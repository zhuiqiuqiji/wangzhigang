import { Router, type Request, type Response } from 'express';
import { run, get, all } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import type { TestMode, TrainingStatus } from '../../shared/types.js';

const router = Router();

const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 500,
  2: 400,
  3: 300,
  4: 250,
  5: 200,
};

const ACHIEVEMENT_RULES: Array<{
  key: string;
  check: (stats: {
    totalTests: number;
    sub200: number;
    sub300: number;
    maxLevel: number;
  }) => boolean;
}> = [
  {
    key: 'first_test',
    check: (s) => s.totalTests >= 1,
  },
  {
    key: 'speed_demon',
    check: (s) => s.sub200 > 0,
  },
  {
    key: 'consistency',
    check: (s) => s.sub300 >= 5,
  },
  {
    key: 'marathon',
    check: (s) => s.totalTests >= 50,
  },
  {
    key: 'master',
    check: (s) => s.maxLevel >= 5,
  },
];

router.get('/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const progressRows = await all<{
      mode: string;
      current_level: number;
      best_time: number | null;
    }>(
      'SELECT mode, current_level, best_time FROM training_progress WHERE user_id = ?',
      [userId],
    );

    const achievementRows = await all<{ achievement_key: string }>(
      'SELECT achievement_key FROM achievements WHERE user_id = ?',
      [userId],
    );

    const achievements = achievementRows.map((r) => r.achievement_key);

    const progressMap = new Map(progressRows.map((r) => [r.mode, r]));

    const modes: TestMode[] = ['visual', 'audio', 'choice', 'inhibition'];
    const trainingStatus: TrainingStatus[] = modes.map((mode) => {
      const p = progressMap.get(mode);
      return {
        mode,
        currentLevel: p?.current_level ?? 1,
        bestTime: p?.best_time ?? null,
        achievements,
      };
    });

    const dailyChallenge = {
      mode: modes[Math.floor(Math.random() * modes.length)] as TestMode,
      targetTime: 300,
      completed: false,
    };

    res.json({
      success: true,
      data: { trainingStatus, achievements, dailyChallenge },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: '获取训练状态失败' });
  }
});

router.post('/complete', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { mode, level, results } = req.body as {
      mode: TestMode;
      level: number;
      results: Array<{ reactionTime: number | null; isFoul: boolean }>;
    };

    const validModes: TestMode[] = ['visual', 'audio', 'choice', 'inhibition'];
    if (!mode || !validModes.includes(mode)) {
      res.status(400).json({ success: false, error: '无效的测试模式' });
      return;
    }

    if (!level || level < 1) {
      res.status(400).json({ success: false, error: '无效的关卡等级' });
      return;
    }

    const validResults = results.filter(
      (r) => r.reactionTime != null && !r.isFoul,
    );
    const average =
      validResults.length > 0
        ? Math.round(
            validResults.reduce((sum, r) => sum + (r.reactionTime ?? 0), 0) /
              validResults.length,
          )
        : null;

    const threshold = LEVEL_THRESHOLDS[level] ?? 600;
    const passed = average !== null && average <= threshold;

    let newLevel = level;
    if (passed) {
      newLevel = level + 1;
    }

    const existing = await get<{ id: number; current_level: number; best_time: number | null }>(
      'SELECT id, current_level, best_time FROM training_progress WHERE user_id = ? AND mode = ?',
      [userId, mode],
    );

    if (existing) {
      const updateLevel = passed
        ? Math.max(newLevel, existing.current_level)
        : existing.current_level;
      const updateBest =
        average !== null &&
        (existing.best_time === null || average < existing.best_time)
          ? average
          : existing.best_time;

      await run(
        'UPDATE training_progress SET current_level = ?, best_time = ?, updated_at = datetime(\'now\') WHERE id = ?',
        [updateLevel, updateBest, existing.id],
      );
      newLevel = updateLevel;
    } else {
      const insertLevel = passed ? newLevel : 1;
      await run(
        'INSERT INTO training_progress (user_id, mode, current_level, best_time) VALUES (?, ?, ?, ?)',
        [userId, mode, insertLevel, average ?? null],
      );
      newLevel = insertLevel;
    }

    const totalTestsRow = await get<{ total: number }>(
      'SELECT COUNT(DISTINCT session_id) as total FROM test_records WHERE user_id = ?',
      [userId],
    );
    const totalTests = totalTestsRow?.total ?? 0;

    const sub200Row = await get<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM test_records WHERE user_id = ? AND is_foul = 0 AND reaction_time_ms IS NOT NULL AND reaction_time_ms <= 200",
      [userId],
    );
    const sub200 = sub200Row?.cnt ?? 0;

    const sub300Row = await get<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM test_records WHERE user_id = ? AND is_foul = 0 AND reaction_time_ms IS NOT NULL AND reaction_time_ms <= 300",
      [userId],
    );
    const sub300 = sub300Row?.cnt ?? 0;

    const maxLevelRow = await get<{ max_lvl: number }>(
      'SELECT MAX(current_level) as max_lvl FROM training_progress WHERE user_id = ?',
      [userId],
    );
    const maxLevel = maxLevelRow?.max_lvl ?? 1;

    const stats = { totalTests, sub200, sub300, maxLevel };

    const newAchievements: string[] = [];
    for (const rule of ACHIEVEMENT_RULES) {
      if (rule.check(stats)) {
        const existingAch = await get(
          'SELECT id FROM achievements WHERE user_id = ? AND achievement_key = ?',
          [userId, rule.key],
        );
        if (!existingAch) {
          await run(
            'INSERT INTO achievements (user_id, achievement_key) VALUES (?, ?)',
            [userId, rule.key],
          );
          newAchievements.push(rule.key);
        }
      }
    }

    res.json({
      success: true,
      data: { passed, newLevel, achievements: newAchievements },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: '完成训练失败' });
  }
});

export default router;
