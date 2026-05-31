import { Router, type Request, type Response } from 'express';
import { all } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import type { TestMode } from '../../shared/types.js';

const router = Router();

router.get('/csv', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const mode = req.query.mode as TestMode | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    let sql = `
      SELECT
        tr.session_id,
        tr.mode,
        tr.round,
        tr.reaction_time_ms,
        tr.is_foul,
        tr.stimulus_detail,
        tr.created_at
      FROM test_records tr
      WHERE tr.user_id = ?
    `;
    const params: unknown[] = [userId];

    if (mode) {
      sql += ' AND tr.mode = ?';
      params.push(mode);
    }
    if (startDate) {
      sql += " AND tr.created_at >= ?";
      params.push(startDate);
    }
    if (endDate) {
      sql += " AND tr.created_at <= ?";
      params.push(endDate + ' 23:59:59');
    }

    sql += ' ORDER BY tr.created_at ASC';

    const rows = await all<{
      session_id: string;
      mode: string;
      round: number;
      reaction_time_ms: number | null;
      is_foul: number;
      stimulus_detail: string | null;
      created_at: string;
    }>(sql, params);

    const headers = [
      'Session ID',
      'Mode',
      'Round',
      'Reaction Time (ms)',
      'Is Foul',
      'Stimulus Detail',
      'Created At',
    ];

    const csvRows = [headers.join(',')];

    for (const row of rows) {
      const escape = (val: unknown): string => {
        const str = val === null || val === undefined ? '' : String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      csvRows.push([
        escape(row.session_id),
        escape(row.mode),
        escape(row.round),
        escape(row.reaction_time_ms),
        escape(row.is_foul ? 'Yes' : 'No'),
        escape(row.stimulus_detail),
        escape(row.created_at),
      ].join(','));
    }

    const csv = '\uFEFF' + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=reaction-test-data.csv',
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: '导出CSV失败' });
  }
});

export default router;
