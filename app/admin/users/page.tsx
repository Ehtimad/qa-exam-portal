import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import ApproveButton from "./ApproveButton";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const allStudents = await db
    .select()
    .from(users)
    .where(eq(users.role, "student"))
    .orderBy(users.createdAt);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">← Admin</Link>
          <span className="font-semibold text-gray-900">İstifadəçi İdarəetməsi</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tələbələr</h1>
          <div className="text-sm text-gray-500">
            {allStudents.filter((u) => !u.approved).length} gözləyir •{" "}
            {allStudents.filter((u) => u.approved).length} təsdiq edilib
          </div>
        </div>

        <div className="card">
          {allStudents.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Hələ heç bir tələbə yoxdur</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 text-gray-500 font-medium">Ad Soyad</th>
                    <th className="text-left py-3 text-gray-500 font-medium">E-poçt</th>
                    <th className="text-left py-3 text-gray-500 font-medium">Qeydiyyat tarixi</th>
                    <th className="text-center py-3 text-gray-500 font-medium">Giriş</th>
                    <th className="text-center py-3 text-gray-500 font-medium">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {allStudents.map((student) => (
                    <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">{student.name ?? "–"}</td>
                      <td className="py-3 text-gray-600">{student.email}</td>
                      <td className="py-3 text-gray-500">
                        {new Date(student.createdAt).toLocaleDateString("az-AZ")}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.approved
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {student.approved ? "Təsdiqlənib" : "Gözləyir"}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <ApproveButton
                          userId={student.id}
                          approved={student.approved}
                        />
                      </td>
                    </tr>
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
