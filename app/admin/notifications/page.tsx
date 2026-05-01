import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canSendNotifications } from "@/lib/rbac";
import NotificationsAdminClient from "./NotificationsAdminClient";
import Link from "next/link";

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session?.user || !canSendNotifications(session.user.role)) redirect("/admin");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-6 flex-wrap">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">← Admin</Link>
          <span className="font-semibold text-gray-900">Bildirişlər</span>
          <Link href="/admin/users"         className="text-sm text-gray-500 hover:text-gray-900">İstifadəçilər</Link>
          <Link href="/admin/materials"     className="text-sm text-gray-500 hover:text-gray-900">Materiallar</Link>
          <Link href="/admin/advertisements" className="text-sm text-gray-500 hover:text-gray-900">Elanlar</Link>
        </div>
      </nav>
      <NotificationsAdminClient />
    </div>
  );
}
