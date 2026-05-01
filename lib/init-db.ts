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

  // Auto-verify only staff accounts (non-students) that predate verification requirement
  await sql`UPDATE users SET email_verified = created_at WHERE email_verified IS NULL AND role != 'student'`;

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
      explanation TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT`;

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
    CREATE TABLE IF NOT EXISTS question_groups (
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      PRIMARY KEY (question_id, group_id)
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
      elapsed_seconds INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'in_progress'
    )`;
  await sql`ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS elapsed_seconds INTEGER NOT NULL DEFAULT 0`;

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

  // ── LMS upgrade migrations ────────────────────────────────────────────
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_student BOOLEAN NOT NULL DEFAULT true`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason TEXT`;
  await sql`ALTER TABLE exams ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'all'`;

  // Sync is_student flag: non-student roles → false
  await sql`UPDATE users SET is_student = false WHERE role IN ('admin','manager','reporter','worker','teacher') AND is_student = true`;

  await sql`
    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content_url TEXT NOT NULL,
      group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
      start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      end_date TIMESTAMPTZ,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'all',
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS advertisements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'all',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      actor_email TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS notification_reads (
      notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (notification_id, user_id)
    )`;

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

  // ── Seed/sync all questions from lib/questions.ts (always upsert) ───
  {
    const { questions: qs } = await import("./questions");
    for (const q of qs) {
      await sql`
        INSERT INTO questions (id, lecture_id, text, type, options, correct_answers, difficulty, points)
        VALUES (
          ${q.id}, ${q.lecture}, ${q.text}, ${q.type},
          ${JSON.stringify(q.options)}, ${JSON.stringify(q.correctAnswers)},
          ${q.difficulty}, ${q.points}
        )
        ON CONFLICT (id) DO UPDATE SET
          lecture_id      = EXCLUDED.lecture_id,
          text            = EXCLUDED.text,
          type            = EXCLUDED.type,
          options         = EXCLUDED.options,
          correct_answers = EXCLUDED.correct_answers,
          difficulty      = EXCLUDED.difficulty,
          points          = EXCLUDED.points`;
    }
    console.log(`[init-db] ${qs.length} sual DB-yə yükləndi/yeniləndi`);

    // Create a default exam with all questions only if no exams exist
    const [examCount] = await sql`SELECT count(*)::int AS c FROM exams`;
    if ((examCount.c as number) === 0) {
      const examId = crypto.randomUUID();
      await sql`
        INSERT INTO exams (id, title, is_active, shuffle_questions, shuffle_options)
        VALUES (${examId}, 'QA ISTQB İmtahan', true, true, true)`;
      for (const q of qs) {
        await sql`INSERT INTO exam_questions (exam_id, question_id) VALUES (${examId}, ${q.id})`;
      }
      console.log("[init-db] Default imtahan yaradıldı");
    }
  }

  console.log("[init-db] Verilənlər bazası hazırdır");
}
