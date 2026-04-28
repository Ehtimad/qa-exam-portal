import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExamClient from "./ExamClient";
import { questions } from "@/lib/questions";

export default async function ExamPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");
  if (!session.user.approved) redirect("/dashboard");

  return <ExamClient questions={questions} userId={session.user.id} />;
}
