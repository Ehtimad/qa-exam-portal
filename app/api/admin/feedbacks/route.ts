import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedbacks, users } from "@/lib/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { canGiveFeedback } from "@/lib/rbac";
import { initDatabase } from "@/lib/init-db";

export async function GET(req: NextRequest) {
  await initDatabase();
  const session = await auth();
  if (!session || !canGiveFeedback(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "received"; // "received" | "given" | "all"

  const fromUser = { id: users.id, name: users.name, email: users.email, role: users.role };

  let rows;
  if (session.user.role === "admin" || session.user.role === "manager") {
    rows = await db
      .select({
        id: feedbacks.id,
        rating: feedbacks.rating,
        comment: feedbacks.comment,
        type: feedbacks.type,
        createdAt: feedbacks.createdAt,
        fromUserId: feedbacks.fromUserId,
        toUserId: feedbacks.toUserId,
      })
      .from(feedbacks)
      .orderBy(desc(feedbacks.createdAt));
  } else if (mode === "given") {
    rows = await db
      .select({
        id: feedbacks.id,
        rating: feedbacks.rating,
        comment: feedbacks.comment,
        type: feedbacks.type,
        createdAt: feedbacks.createdAt,
        fromUserId: feedbacks.fromUserId,
        toUserId: feedbacks.toUserId,
      })
      .from(feedbacks)
      .where(eq(feedbacks.fromUserId, session.user.id))
      .orderBy(desc(feedbacks.createdAt));
  } else {
    rows = await db
      .select({
        id: feedbacks.id,
        rating: feedbacks.rating,
        comment: feedbacks.comment,
        type: feedbacks.type,
        createdAt: feedbacks.createdAt,
        fromUserId: feedbacks.fromUserId,
        toUserId: feedbacks.toUserId,
      })
      .from(feedbacks)
      .where(eq(feedbacks.toUserId, session.user.id))
      .orderBy(desc(feedbacks.createdAt));
  }

  // Enrich with user names
  const allUserIds = [...new Set(rows.flatMap((r) => [r.fromUserId, r.toUserId]))];
  const userRows = allUserIds.length > 0
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
    : [];
  const userMap = Object.fromEntries(userRows.map((u) => [u.id, u]));

  const enriched = rows.map((r) => ({
    ...r,
    fromUser: userMap[r.fromUserId] ?? { id: r.fromUserId, name: "Silinmiş", email: "" },
    toUser:   userMap[r.toUserId]   ?? { id: r.toUserId,   name: "Silinmiş", email: "" },
  }));

  return NextResponse.json({ feedbacks: enriched });
}

export async function POST(req: NextRequest) {
  await initDatabase();
  const session = await auth();
  if (!session || !canGiveFeedback(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { toUserId, rating, comment } = await req.json() as {
    toUserId: string; rating: number; comment?: string;
  };

  if (!toUserId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "toUserId və rating (1-5) tələb olunur" }, { status: 400 });
  }

  const [target] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, toUserId)).limit(1);
  if (!target) return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  const type = session.user.role === "student" ? "student_to_teacher" : "teacher_to_student";

  const [newFeedback] = await db.insert(feedbacks).values({
    fromUserId: session.user.id,
    toUserId,
    rating,
    comment: comment?.trim() || null,
    type,
  }).returning({ id: feedbacks.id });

  return NextResponse.json({ success: true, id: newFeedback.id }, { status: 201 });
}
