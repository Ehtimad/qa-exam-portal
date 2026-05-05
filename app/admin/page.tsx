import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, examAttempts } from "@/lib/schema";
import { eq, count, sql, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isStaff } from "@/lib/rbac";

export default async function AdminPage() {
  const session = await auth();
  if (!session || !isStaff(session.user.role)) redirect("/dashboard");

  const isTeacher = session.user.role === "teacher";

  const [totalStudents] = await db
    .select({ count: count() })
    .from(users)
    .where(
      isTeacher
        ? and(eq(users.role, "student"), eq(users.teacherId, session.user.id))
        : eq(users.role, "student")
    );

  const [totalAttempts] = await db
    .select({ count: count() })
    .from(examAttempts)
    .leftJoin(users, eq(examAttempts.userId, users.id))
    .where(isTeacher ? eq(users.teacherId, session.user.id) : undefined);

  const recentAttempts = await db
    .select({
      id: examAttempts.id,
      score: examAttempts.score,
      maxScore: examAttempts.maxScore,
      correctAnswers: examAttempts.correctAnswers,
      completedAt: examAttempts.completedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(examAttempts)
    .leftJoin(users, eq(examAttempts.userId, users.id))
    .where(isTeacher ? eq(users.teacherId, session.user.id) : undefined)
    .orderBy(sql`${examAttempts.completedAt} DESC`)
    .limit(5);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isTeacher ? "Müəllim Paneli" : "Admin Dashboard"}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{totalStudents.count}</div>
          <div className="text-gray-500 text-sm mt-1">
            {isTeacher ? "Öz tələbələrim" : "Ümumi tələbə"}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">
            <Link href="/admin/users" className="hover:underline">{totalStudents.count}</Link>
          </div>
          <div className="text-gray-500 text-sm mt-1">
            <Link href="/admin/users" className="hover:underline">Tələbə siyahısı →</Link>
          </div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{totalAttempts.count}</div>
          <div className="text-gray-500 text-sm mt-1">İmtahan cəhdi</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Son nəticələr</h2>
          <Link href="/admin/results" className="text-sm text-blue-600 hover:underline">
            Hamısı →
          </Link>
        </div>
        {recentAttempts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Hələ heç bir nəticə yoxdur</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">Tələbə</th>
                <th className="text-right py-2 text-gray-500 font-medium">Bal</th>
                <th className="text-right py-2 text-gray-500 font-medium">Faiz</th>
                <th className="text-right py-2 text-gray-500 font-medium">Tarix</th>
              </tr>
            </thead>
            <tbody>
              {recentAttempts.map((a) => {
                const pct = Math.round((a.score / a.maxScore) * 100);
                return (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="py-3">
                      <div className="font-medium text-gray-900">{a.userName ?? "–"}</div>
                      <div className="text-gray-400 text-xs">{a.userEmail}</div>
                    </td>
                    <td className="py-3 text-right font-semibold text-blue-600">
                      {a.score}/{a.maxScore}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`font-medium ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-500">
                      {new Date(a.completedAt).toLocaleDateString("az-AZ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
