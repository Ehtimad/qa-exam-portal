import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MessagesClient from "./MessagesClient";
import Link from "next/link";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const isAdmin = ["admin", "manager"].includes(session.user.role);

  return (
    <div className="flex flex-col h-screen">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <Link href={isAdmin ? "/admin" : "/dashboard"} className="text-sm text-gray-600 hover:text-gray-900">
            ← {isAdmin ? "Admin" : "Dashboard"}
          </Link>
          <span className="font-semibold text-gray-900">Mesajlar</span>
        </div>
      </nav>
      <div className="flex-1 overflow-hidden">
        <MessagesClient userId={session.user.id} userName={session.user.name ?? "Sən"} />
      </div>
    </div>
  );
}
