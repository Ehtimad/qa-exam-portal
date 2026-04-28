import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Use placeholder during build if DATABASE_URL is not set.
// Actual queries will fail at request time without the real URL.
const sql = neon(
  process.env.DATABASE_URL || "postgresql://build-placeholder:x@localhost/placeholder"
);

export const db = drizzle(sql, { schema });
