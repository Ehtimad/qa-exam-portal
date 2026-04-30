import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const [userRow] = await db.select({ groupId: users.groupId }).from(users).where(eq(users.id, session.user.id)).limit(1);

  return (
    <ProfileForm
      initialName={session.user.name ?? ""}
      initialGroupId={userRow?.groupId ?? ""}
      email={session.user.email ?? ""}
    />
  );
}
