import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRow } from "./UserActions";
import { Suspense } from "react";
import UsersFilterBar from "./UsersFilterBar";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const { q = "", group = "" } = await searchParams;

  const allStudents = await db
    .select()
    .from(users)
    .where(eq(users.role, "student"))
    .orderBy(users.createdAt);

  const groups = [...new Set(allStudents.map((s) => s.groupName).filter(Boolean))] as string[];

  const filtered = allStudents.filter((s) => {
    const matchQ = !q || (s.name?.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()));
    const matchGroup = !group || s.groupName === group;
    return matchQ && matchGroup;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">← Admin</Link>
          <span className="font-semibold text-gray-900">İstifadəçi İdarəetməsi</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Tələbələr</h1>
          <div className="text-sm text-gray-500">
            {filtered.length} / {allStudents.length} tələbə
          </div>
        </div>

        <Suspense>
          <UsersFilterBar groups={groups} />
        </Suspense>

        <div className="card">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              {allStudents.length === 0 ? "Hələ heç bir tələbə yoxdur" : "Filter nəticəsi tapılmadı"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 text-gray-500 font-medium">Ad Soyad</th>
                    <th className="text-left py-3 text-gray-500 font-medium">Qrup</th>
                    <th className="text-left py-3 text-gray-500 font-medium">E-poçt</th>
                    <th className="text-left py-3 text-gray-500 font-medium">Qeydiyyat tarixi</th>
                    <th className="text-right py-3 text-gray-500 font-medium">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => (
                    <UserRow key={student.id} student={student} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
