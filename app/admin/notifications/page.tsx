import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canSendNotifications } from "@/lib/rbac";
import NotificationsAdminClient from "./NotificationsAdminClient";

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session?.user || !canSendNotifications(session.user.role)) redirect("/admin");
  return <NotificationsAdminClient />;
}
