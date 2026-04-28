import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  return (
    <ProfileForm
      initialName={session.user.name ?? ""}
      initialGroupName={(session.user as { groupName?: string }).groupName ?? ""}
      email={session.user.email ?? ""}
    />
  );
}
