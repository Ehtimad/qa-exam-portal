import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExamClient from "./ExamClient";
import { questions } from "@/lib/questions";
import { db } from "@/lib/db";
import { examAttempts } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function ExamPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const [existing] = await db
    .select({ id: examAttempts.id })
    .from(examAttempts)
    .where(eq(examAttempts.userId, session.user.id))
    .limit(1);

  if (existing) redirect("/dashboard");

  return <ExamClient questions={questions} userId={session.user.id} />;
}
