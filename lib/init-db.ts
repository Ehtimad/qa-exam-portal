import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified INTEGER,
  image TEXT,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS accounts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  session_token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers TEXT NOT NULL,
  score REAL NOT NULL,
  max_score REAL NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  duration INTEGER,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

let initialized = false;

export async function initDatabase() {
  if (initialized) return;

  const rawUrl = process.env.TURSO_DATABASE_URL ?? "";
  const url =
    !rawUrl || (rawUrl.startsWith("file:") && !rawUrl.startsWith("file:/tmp"))
      ? "file:/tmp/local.db"
      : rawUrl;

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  for (const stmt of CREATE_TABLES.split(";")
    .map((s) => s.trim())
    .filter(Boolean)) {
    await client.execute(stmt);
  }

  // Create default admin if none exists
  const res = await client.execute(
    "SELECT count(*) as c FROM users WHERE role='admin'"
  );
  if ((res.rows[0].c as number) === 0) {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(
      process.env.ADMIN_PASSWORD ?? "Admin@123",
      12
    );
    await client.execute({
      sql: `INSERT INTO users (id, name, email, password, role, approved)
            VALUES (?, ?, ?, ?, 'admin', 1)`,
      args: [
        id,
        process.env.ADMIN_NAME ?? "Admin",
        process.env.ADMIN_EMAIL ?? "admin@exam.local",
        hash,
      ],
    });
    console.log("[init-db] Admin user created: admin@exam.local / Admin@123");
  }

  initialized = true;
  console.log("[init-db] Database initialized");
}
