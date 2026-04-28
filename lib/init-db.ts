import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

let initialized = false;

export async function initDatabase() {
  if (initialized) return;
  initialized = true;

  const url = process.env.DATABASE_URL;
  if (!url) return;

  const sql = neon(url);

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      email_verified TIMESTAMPTZ,
      image TEXT,
      password TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      group_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // Migrate existing tables: add new columns if they don't exist
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS group_name TEXT`;

  await sql`
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
      session_state TEXT,
      PRIMARY KEY (provider, provider_account_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      session_token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMPTZ NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      expires TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (identifier, token)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS exam_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      answers TEXT NOT NULL,
      score DOUBLE PRECISION NOT NULL,
      max_score DOUBLE PRECISION NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      duration INTEGER,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const [row] = await sql`SELECT count(*)::int AS c FROM users WHERE role='admin'`;
  if ((row.c as number) === 0) {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "Admin@123", 12);
    await sql`
      INSERT INTO users (id, name, email, password, role, approved)
      VALUES (${id}, ${process.env.ADMIN_NAME ?? "Admin"}, ${process.env.ADMIN_EMAIL ?? "admin@exam.local"}, ${hash}, 'admin', true)
    `;
    console.log("[init-db] Admin yaradıldı: admin@exam.local / Admin@123");
  }

  console.log("[init-db] Verilənlər bazası hazırdır");
}
