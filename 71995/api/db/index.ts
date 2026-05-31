import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'reaction.db');

let dbInstance: Database | null = null;

const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT NOT NULL,
    region TEXT DEFAULT 'unknown',
    age_group TEXT DEFAULT 'adult',
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS test_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('visual','audio','choice','inhibition')),
    session_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    reaction_time_ms INTEGER,
    is_foul BOOLEAN DEFAULT 0,
    stimulus_detail TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS training_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mode TEXT NOT NULL,
    current_level INTEGER DEFAULT 1,
    best_time INTEGER,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, mode)
  )`,
  `CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_key TEXT NOT NULL,
    unlocked_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, achievement_key)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_test_records_user ON test_records(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_test_records_mode ON test_records(mode)`,
  `CREATE INDEX IF NOT EXISTS idx_test_records_session ON test_records(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_test_records_created ON test_records(created_at)`,
];

const dbReady = (async (): Promise<Database> => {
  const SQL = await initSqlJs();

  let buffer: Buffer | undefined;
  if (fs.existsSync(DB_PATH)) {
    buffer = fs.readFileSync(DB_PATH);
  }

  const db = buffer ? new SQL.Database(buffer) : new SQL.Database();

  for (const sql of DDL) {
    db.run(sql);
  }

  dbInstance = db;
  saveDb();
  return db;
})();

function saveDb(): void {
  if (!dbInstance) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const data = dbInstance.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export async function getDb(): Promise<Database> {
  return dbReady;
}

export async function run(sql: string, params: unknown[] = []): Promise<void> {
  const db = await getDb();
  db.run(sql, params);
  saveDb();
}

export async function get<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const db = await getDb();
  const results = db.exec(sql, params);
  if (!results.length || !results[0].values.length) return undefined;
  const { columns, values } = results[0];
  const row = values[0];
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return obj as T;
}

export async function all<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = await getDb();
  const results = db.exec(sql, params);
  if (!results.length) return [];
  const { columns, values } = results[0];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}

export async function runBatch(
  statements: Array<{ sql: string; params?: unknown[] }>,
): Promise<void> {
  const db = await getDb();
  db.run('BEGIN TRANSACTION');
  try {
    for (const { sql, params = [] } of statements) {
      db.run(sql, params);
    }
    db.run('COMMIT');
    saveDb();
  } catch (err) {
    db.run('ROLLBACK');
    saveDb();
    throw err;
  }
}
