import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageMaterials } from "@/lib/rbac";
import MaterialsClient from "./MaterialsClient";

export default async function AdminMaterialsPage() {
  const session = await auth();
  if (!session?.user || !canManageMaterials(session.user.role)) redirect("/admin");
  return <MaterialsClient />;
}
