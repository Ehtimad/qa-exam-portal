import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import {
  canManageUsers, canViewResults, canViewAnalytics,
  canManageQuestions, canManageExams, canManageGroups,
  canManageMaterials, canSendNotifications, canManageAds,
  canGiveFeedback, canManageForms, canViewStudents,
} from "@/lib/rbac";
import NavBadges from "./NavBadges";

export default async function AdminNav({ current }: { current?: string }) {
  const session = await auth();
  if (!session) return null;
  const role = session.user.role;

  function lc(page?: string) {
    return `text-sm font-medium ${current === page ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`;
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-gray-900 flex-shrink-0">
            {role === "teacher" ? "Müəllim Paneli" : "Admin Panel"}
          </span>
          <Link href="/admin"             className={lc("dashboard")}>Dashboard</Link>
          {canViewStudents(role)    && <Link href="/admin/users"          className={lc("users")}>İstifadəçilər</Link>}
          {canViewResults(role)     && <Link href="/admin/results"        className={lc("results")}>Nəticələr</Link>}
          {canManageQuestions(role) && <Link href="/admin/questions"      className={lc("questions")}>Suallar</Link>}
          {canManageExams(role)     && <Link href="/admin/exams"          className={lc("exams")}>İmtahanlar</Link>}
          {canViewAnalytics(role)   && <Link href="/admin/analytics"      className={lc("analytics")}>Analitika</Link>}
          {canManageGroups(role)    && <Link href="/admin/groups"         className={lc("groups")}>Qruplar</Link>}
          {canManageMaterials(role) && <Link href="/admin/materials"      className={lc("materials")}>Materiallar</Link>}
          {canSendNotifications(role) && <Link href="/admin/notifications" className={lc("notifications")}>Bildirişlər</Link>}
          {canManageAds(role)       && <Link href="/admin/advertisements" className={lc("ads")}>Elanlar</Link>}
          {canManageUsers(role)     && <Link href="/admin/online"         className={lc("online")}>Online</Link>}
          {canManageUsers(role)     && <Link href="/admin/activity"       className={lc("activity")}>Fəaliyyət</Link>}
          {canGiveFeedback(role)    && <Link href="/admin/feedback"       className={lc("feedback")}>Rəylər</Link>}
          {canManageForms(role)     && <Link href="/admin/teacher-forms"  className={lc("teacher-forms")}>Sorğular</Link>}
          <NavBadges
            userId={session.user.id}
            msgHref="/messages"
            linkClass={`text-sm font-medium ${current === "messages" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
          />
        </div>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
          <button type="submit" className="btn-secondary text-sm py-1.5 px-3 flex-shrink-0">Çıxış</button>
        </form>
      </div>
    </nav>
  );
}
