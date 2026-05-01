import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageAds } from "@/lib/rbac";
import AdsClient from "./AdsClient";

export default async function AdminAdsPage() {
  const session = await auth();
  if (!session?.user || !canManageAds(session.user.role)) redirect("/admin");
  return <AdsClient />;
}
