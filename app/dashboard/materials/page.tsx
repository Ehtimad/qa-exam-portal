import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { materials } from "@/lib/schema";
import { and, eq, isNull, lte, or, gte } from "drizzle-orm";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import NotificationBell from "@/components/NotificationBell";
import NavBadges from "@/components/NavBadges";

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-semibold text-gray-900">QA Exam Portal</Link>
            <Link href="/dashboard/materials" className="text-sm font-medium text-blue-600">Materiallar</Link>
            <NavBadges userId={session.user.id} msgHref="/messages"
              linkClass="text-sm text-gray-600 hover:text-gray-900 font-medium" />
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell userId={session.user.id} />
            <span className="text-sm text-gray-500">{session.user.name}</span>
            <Link href="/profile" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Məlumatlarım</Link>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="btn-secondary text-sm py-1.5 px-3">Çıxış</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Kabinetə qayıt</Link>
          <h1 className="text-2xl font-bold text-gray-900">Materiallar</h1>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Hazırda material yoxdur</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((m) => {
              const ytId = getYoutubeId(m.contentUrl);
              return (
                <div key={m.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {ytId ? (
                    <>
                      <div className="aspect-video w-full">
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={m.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                      <div className="px-5 py-3 border-t border-gray-100">
                        <p className="font-medium text-gray-900">{m.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(m.startDate).toLocaleDateString("az-AZ")}
                          {m.endDate && ` – ${new Date(m.endDate).toLocaleDateString("az-AZ")}`}
                        </p>
                      </div>
                    </>
                  ) : (
                    <a href={m.contentUrl} target="_blank" rel="noopener noreferrer"
                      className="block px-5 py-4 hover:bg-gray-50 transition-all group">
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
