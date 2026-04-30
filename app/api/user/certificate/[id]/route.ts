import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, users } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { jsPDF } from "jspdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [attempt] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.id, id), eq(examAttempts.userId, session.user.id)))
    .limit(1);

  if (!attempt) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });

  const pct = Math.round((attempt.score / attempt.maxScore) * 100);
  if (pct < 70) {
    return NextResponse.json({ error: "Sertifikat yalnız keçən tələbələrə verilir (≥70%)" }, { status: 403 });
  }

  const [user] = await db.select({ name: users.name, groupName: users.groupName })
    .from(users).where(eq(users.id, session.user.id)).limit(1);

  const studentName = user?.name ?? session.user.name ?? "Tələbə";
  const completedDate = new Date(attempt.completedAt).toLocaleDateString("az-AZ", {
    year: "numeric", month: "long", day: "numeric",
  });

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210;

  // Outer border
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(4);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setLineWidth(1);
  doc.rect(12, 12, W - 24, H - 24);

  // Header bar
  doc.setFillColor(37, 99, 235);
  doc.rect(12, 12, W - 24, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("UĞUR SERTİFİKATI", W / 2, 31, { align: "center" });

  // Body
  doc.setTextColor(30, 30, 30);

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text("Bu sertifikat təsdiq edir ki,", W / 2, 62, { align: "center" });

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(studentName, W / 2, 80, { align: "center" });

  // Underline
  const nameWidth = doc.getTextWidth(studentName);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - nameWidth / 2, 83, W / 2 + nameWidth / 2, 83);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text("QA / ISTQB Əsasları imtahanını uğurla başa vurmuşdur.", W / 2, 96, { align: "center" });

  // Score badge
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(1);
  doc.roundedRect(W / 2 - 30, 102, 60, 22, 4, 4, "FD");
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${pct}%`, W / 2, 116, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Nəticə", W / 2, 121, { align: "center" });

  // Date & details
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text(`Tarix: ${completedDate}`, W / 2 - 40, 136, { align: "center" });
  doc.text(`Bal: ${attempt.score} / ${attempt.maxScore}`, W / 2 + 40, 136, { align: "center" });

  if (user?.groupName) {
    doc.text(`Qrup: ${user.groupName}`, W / 2, 143, { align: "center" });
  }

  // Footer
  doc.setFillColor(37, 99, 235);
  doc.rect(12, H - 30, W - 24, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("QA İmtahan Portalı  •  Bu sertifikat rəqəmsal imzalanmışdır", W / 2, H - 19, { align: "center" });
  doc.setFontSize(8);
  doc.text(`Sertifikat ID: ${attempt.id}`, W / 2, H - 14, { align: "center" });

  const pdfBytes = doc.output("arraybuffer");
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sertifikat-${attempt.id}.pdf"`,
    },
  });
}
