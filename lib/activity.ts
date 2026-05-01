import { db } from "./db";
import { activityLogs } from "./schema";

export async function logActivity(opts: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await db.insert(activityLogs).values({
      actorId:    opts.actorId ?? null,
      actorEmail: opts.actorEmail ?? null,
      action:     opts.action,
      targetType: opts.targetType ?? null,
      targetId:   opts.targetId ?? null,
      details:    opts.details ? JSON.stringify(opts.details) : null,
    });
  } catch {
    // logging must never break the main flow
  }
}
