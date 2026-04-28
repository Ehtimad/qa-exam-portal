/**
 * Run: npx tsx scripts/seed-admin.ts
 * Creates the first admin user. Set DATABASE_URL env var first.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@exam.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@123";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, ADMIN_EMAIL))
    .limit(1);

  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await db.insert(schema.users).values({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashed,
    role: "admin",
    approved: true,
  });

  console.log(`Admin created: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  process.exit(0);
}

main().catch(console.error);
