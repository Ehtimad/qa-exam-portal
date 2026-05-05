import { neon } from "@neondatabase/serverless";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 10;

function getSQL() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}

export async function checkLoginRateLimit(
  email: string
): Promise<{ blocked: boolean; attemptsLeft: number }> {
  const sql = getSQL();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  // Upsert: reset window if expired, otherwise increment counter
  const rows = await sql`
    INSERT INTO login_rate_limits (email, attempts, window_start)
    VALUES (${email.toLowerCase()}, 1, NOW())
    ON CONFLICT (email) DO UPDATE SET
      attempts     = CASE
                       WHEN login_rate_limits.window_start < ${windowStart}::timestamptz THEN 1
                       ELSE login_rate_limits.attempts + 1
                     END,
      window_start = CASE
                       WHEN login_rate_limits.window_start < ${windowStart}::timestamptz THEN NOW()
                       ELSE login_rate_limits.window_start
                     END
    RETURNING attempts
  `;

  const attempts = (rows[0]?.attempts as number) ?? 1;
  return {
    blocked: attempts > MAX_ATTEMPTS,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
  };
}

export async function resetLoginRateLimit(email: string): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM login_rate_limits WHERE email = ${email.toLowerCase()}`;
}
