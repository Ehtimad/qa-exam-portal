import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ImpersonatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) redirect("/");

  try {
    await signIn("credentials", {
      impersonationToken: token,
      redirect: false,
    });
  } catch {
    redirect("/?error=impersonate_failed");
  }

  redirect("/dashboard");
}
