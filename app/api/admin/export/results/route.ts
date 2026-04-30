import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import * as XLSX from "xlsx";
import { canExportResults } from "@/lib/rbac";

async function requireAdmin() {
  const s = await auth();
  return canExportResults(s?.user?.role ?? "") ? s : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attempts = await db
    .select({
      id: examAttempts.id,
      score: examAttempts.score,
      maxScore: examAttempts.maxScore,
      correctAnswers: examAttempts.correctAnswers,
      totalQuestions: examAttempts.totalQuestions,
      tabSwitches: examAttempts.tabSwitches,
      duration: examAttempts.duration,
      completedAt: examAttempts.completedAt,
      userName: users.name,
      userEmail: users.email,
      groupName: users.groupName,
    })
    .from(examAttempts)
    .leftJoin(users, eq(examAttempts.userId, users.id))
    .orderBy(desc(examAttempts.completedAt));

  const rows = attempts.map((a) => ({
    "Ad Soyad": a.userName ?? "–",
    "E-poçt": a.userEmail ?? "–",
    "Qrup": a.groupName ?? "–",
    "Bal": a.score,
    "Maks Bal": a.maxScore,
    "Faiz (%)": Math.round((a.score / a.maxScore) * 100),
    "Nəticə": Math.round((a.score / a.maxScore) * 100) >= 70 ? "Keçdi" : "Kəsildi",
    "Düzgün Cavab": a.correctAnswers,
    "Ümumi Sual": a.totalQuestions,
    "Tab Keçid": a.tabSwitches,
    "Müddət (dəq)": a.duration ? Math.round(a.duration / 60) : "–",
    "Tarix": new Date(a.completedAt).toLocaleDateString("az-AZ"),
    "Saat": new Date(a.completedAt).toLocaleTimeString("az-AZ"),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nəticələr");

  // Auto-width columns
  const cols = Object.keys(rows[0] ?? {});
  ws["!cols"] = cols.map((key) => ({ wch: Math.max(key.length, 15) }));

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="netice-${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}
