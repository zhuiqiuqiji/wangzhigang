import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import type { User, AuthResponse } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'reaction-test-secret-key';
const router = Router();

function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    email: row.email as string,
    nickname: row.nickname as string,
    region: row.region as string,
    ageGroup: row.age_group as User['ageGroup'],
    createdAt: row.created_at as string,
  };
}

function signToken(user: { id: number; email: string; nickname: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, nickname: user.nickname },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, nickname, region, ageGroup } = req.body;

    if (!email || !password || !nickname) {
      res.status(400).json({ success: false, error: '邮箱、密码和昵称不能为空' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: '密码至少6位' });
      return;
    }

    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      res.status(409).json({ success: false, error: '该邮箱已注册' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await run(
      'INSERT INTO users (email, password_hash, nickname, region, age_group) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, nickname, region || 'unknown', ageGroup || 'adult'],
    );

    const row = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!row) {
      res.status(500).json({ success: false, error: '创建用户失败' });
      return;
    }

    const user = mapUser(row);
    const token = signToken(user);

    const data: AuthResponse = { token, user };
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: '注册失败' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: '邮箱和密码不能为空' });
      return;
    }

    const row = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!row) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' });
      return;
    }

    const valid = await bcrypt.compare(password, row.password_hash as string);
    if (!valid) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' });
      return;
    }

    const user = mapUser(row);
    const token = signToken(user);

    const data: AuthResponse = { token, user };
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const row = await get('SELECT * FROM users WHERE id = ?', [req.user!.id]);
    if (!row) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }
    res.json({ success: true, data: { user: mapUser(row) } });
  } catch (err) {
    res.status(500).json({ success: false, error: '获取用户信息失败' });
  }
});

export default router;
