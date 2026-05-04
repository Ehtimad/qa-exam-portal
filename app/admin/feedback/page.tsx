import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedbacks, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { canGiveFeedback } from "@/lib/rbac";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? "text-yellow-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

export default async function FeedbackPage() {
  const session = await auth();
  if (!session || !canGiveFeedback(session.user.role)) redirect("/admin");

  const isAdmin = ["admin", "manager"].includes(session.user.role);

  const rows = await db
    .select({
      id:         feedbacks.id,
      rating:     feedbacks.rating,
      comment:    feedbacks.comment,
      type:       feedbacks.type,
      createdAt:  feedbacks.createdAt,
      fromUserId: feedbacks.fromUserId,
      toUserId:   feedbacks.toUserId,
    })
    .from(feedbacks)
    .orderBy(desc(feedbacks.createdAt));

  const allUserIds = [...new Set(rows.flatMap((r) => [r.fromUserId, r.toUserId]))];
  const userRows = allUserIds.length > 0
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
    : [];
  const userMap = Object.fromEntries(userRows.map((u) => [u.id, u]));

  const visible = isAdmin
    ? rows
    : rows.filter((r) => r.toUserId === session.user.id);

  const avgRating = visible.length > 0
    ? (visible.reduce((s, r) => s + r.rating, 0) / visible.length).toFixed(1)
    : "—";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rəylər</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAdmin ? "Bütün rəylər" : "Sizə göndərilən rəylər"}
          </p>
        </div>
        {visible.length > 0 && (
          <div className="text-center bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3">
            <div className="text-2xl font-bold text-yellow-600">{avgRating}</div>
            <div className="text-xs text-gray-500 mt-0.5">Orta qiymət</div>
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">Hələ rəy yoxdur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => {
            const from = userMap[r.fromUserId];
            const to   = userMap[r.toUserId];
            return (
              <div key={r.id} className="card flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{from?.name ?? from?.email ?? "—"}</span>
                    <span className="text-gray-400 text-xs">→</span>
                    <span className="text-sm text-gray-700">{to?.name ?? to?.email ?? "—"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.type === "student_to_teacher" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>
                      {r.type === "student_to_teacher" ? "Tələbə → Müəllim" : "Müəllim → Tələbə"}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Stars rating={r.rating} />
                  </div>
                  {r.comment && (
                    <p className="text-gray-600 text-sm mt-2">{r.comment}</p>
                  )}
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString("az-AZ")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
