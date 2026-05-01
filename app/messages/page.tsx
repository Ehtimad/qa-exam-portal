import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  return <MessagesClient userId={session.user.id} userName={session.user.name ?? "Sən"} />;
}
