import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { materials } from "@/lib/schema";
import { and, eq, isNull, lte, or, gte } from "drizzle-orm";

export default async function MaterialsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const now = new Date();
  const groupId = session.user.groupId ?? null;

  const rows = await db
    .select()
    .from(materials)
    .where(
      and(
        lte(materials.startDate, now),
        or(isNull(materials.endDate), gte(materials.endDate, now)),
        or(isNull(materials.groupId), groupId ? eq(materials.groupId, groupId) : isNull(materials.groupId))
      )
    )
    .orderBy(materials.createdAt);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Materiallar</h1>
      {rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Hazırda material yoxdur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <a
              key={m.id}
              href={m.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{m.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(m.startDate).toLocaleDateString("az-AZ")}
                    {m.endDate && ` – ${new Date(m.endDate).toLocaleDateString("az-AZ")}`}
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
