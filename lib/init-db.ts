import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

let initialized = false;

export async function initDatabase() {
  if (initialized) return;
  initialized = true;

  const url = process.env.DATABASE_URL;
  if (!url) return;

  const sql = neon(url);

  // ── Core NextAuth tables ─────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

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
    )`;

  // ── Migrate existing users: add new columns safely ───────────────────
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS group_id TEXT REFERENCES groups(id) ON DELETE SET NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ`;

  // Existing users (created before verification requirement) → auto-verify
  await sql`UPDATE users SET email_verified = created_at WHERE email_verified IS NULL`;

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
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      session_token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMPTZ NOT NULL
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      expires TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (identifier, token)
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS impersonation_tokens (
      token TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  // ── Questions & Exams ────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY,
      lecture_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      type TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answers TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      points INTEGER NOT NULL,
      image_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
      time_limit_minutes INTEGER,
      is_active BOOLEAN NOT NULL DEFAULT false,
      shuffle_questions BOOLEAN NOT NULL DEFAULT true,
      shuffle_options BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS exam_questions (
      exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      PRIMARY KEY (exam_id, question_id)
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS exam_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
      question_order TEXT NOT NULL,
      option_orders TEXT NOT NULL,
      answers TEXT NOT NULL DEFAULT '{}',
      tab_switches INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'in_progress'
    )`;

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
    )`;

  // Migrate exam_attempts: add new nullable columns
  await sql`ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS exam_id TEXT REFERENCES exams(id) ON DELETE SET NULL`;
  await sql`ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS tab_switches INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS question_order TEXT`;
  await sql`ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS option_orders TEXT`;

  // ── Seed admin ───────────────────────────────────────────────────────
  const [adminRow] = await sql`SELECT count(*)::int AS c FROM users WHERE role='admin'`;
  if ((adminRow.c as number) === 0) {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "Admin@123", 12);
    await sql`
      INSERT INTO users (id, name, email, password, role, email_verified)
      VALUES (${id}, ${process.env.ADMIN_NAME ?? "Admin"},
              ${process.env.ADMIN_EMAIL ?? "admin@exam.local"},
              ${hash}, 'admin', NOW())`;
    console.log("[init-db] Admin yaradıldı");
  }

  // ── Seed groups from existing unique group_name values ───────────────
  await sql`
    INSERT INTO groups (id, name, created_at)
    SELECT gen_random_uuid(), group_name, NOW()
    FROM (SELECT DISTINCT group_name FROM users WHERE group_name IS NOT NULL) g
    ON CONFLICT (name) DO NOTHING`;

  // Link existing users to their group_id if not already linked
  await sql`
    UPDATE users u
    SET group_id = g.id
    FROM groups g
    WHERE u.group_name = g.name AND u.group_id IS NULL`;

  // ── Seed questions from lib/questions.ts if table is empty ──────────
  const [qCount] = await sql`SELECT count(*)::int AS c FROM questions`;
  if ((qCount.c as number) === 0) {
    const { questions: qs } = await import("./questions");
    for (const q of qs) {
      await sql`
        INSERT INTO questions (id, lecture_id, text, type, options, correct_answers, difficulty, points)
        VALUES (
          ${q.id}, ${q.lecture}, ${q.text}, ${q.type},
          ${JSON.stringify(q.options)}, ${JSON.stringify(q.correctAnswers)},
          ${q.difficulty}, ${q.points}
        ) ON CONFLICT (id) DO NOTHING`;
    }
    console.log(`[init-db] ${qs.length} sual DB-yə yükləndi`);

    // Create a default exam with all questions (for backward compat)
    const examId = crypto.randomUUID();
    await sql`
      INSERT INTO exams (id, title, is_active, shuffle_questions, shuffle_options)
      VALUES (${examId}, 'QA ISTQB İmtahan', true, true, true)`;
    for (const q of qs) {
      await sql`INSERT INTO exam_questions (exam_id, question_id) VALUES (${examId}, ${q.id})`;
    }
    console.log("[init-db] Default imtahan yaradıldı");
  }

  console.log("[init-db] Verilənlər bazası hazırdır");
}
