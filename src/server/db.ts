import Database from 'better-sqlite3';
import path from 'node:path';

let db: Database.Database | null = null;

function getDbPath(): string {
  const configured = process.env.SHOWMATCH_SQLITE_PATH;
  if (configured && configured.trim()) return configured;
  // Dev-friendly default: store the sqlite file in the repo root.
  return path.join(process.cwd(), '.showmatch.sqlite');
}

export function getDb(): Database.Database {
  if (db) return db;

  db = new Database(getDbPath());

  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS groups (
      code TEXT PRIMARY KEY,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      code TEXT NOT NULL,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      servicesJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (code, userId),
      FOREIGN KEY (code) REFERENCES groups(code)
    );

    CREATE TABLE IF NOT EXISTS swipe_sessions (
      id TEXT PRIMARY KEY,
      groupCode TEXT NOT NULL,
      titleIdsJson TEXT NOT NULL,
      filtersJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (groupCode) REFERENCES groups(code)
    );

    CREATE TABLE IF NOT EXISTS swipe_votes (
      sessionId TEXT NOT NULL,
      voterUserId TEXT NOT NULL,
      titleId INTEGER NOT NULL,
      vote TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (sessionId, voterUserId, titleId),
      FOREIGN KEY (sessionId) REFERENCES swipe_sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_group_active ON swipe_sessions(groupCode, isActive);
    CREATE INDEX IF NOT EXISTS idx_votes_session ON swipe_votes(sessionId);
  `);

  return db;
}

