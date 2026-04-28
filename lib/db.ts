import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

function resolveDbUrl(): string {
  const raw = process.env.TURSO_DATABASE_URL ?? "";
  if (!raw) return "file:/tmp/local.db";
  // Redirect any non-/tmp file URL to /tmp for Vercel (read-only rootfs)
  if (raw.startsWith("file:") && !raw.startsWith("file:/tmp")) {
    return "file:/tmp/local.db";
  }
  return raw;
}

const client = createClient({
  url: resolveDbUrl(),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
