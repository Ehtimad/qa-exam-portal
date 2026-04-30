import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, users } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await db
    .select({
      score: examAttempts.score,
      maxScore: examAttempts.maxScore,
      correctAnswers: examAttempts.correctAnswers,
      totalQuestions: examAttempts.totalQuestions,
      duration: examAttempts.duration,
      completedAt: examAttempts.completedAt,
      userName: users.name,
      userEmail: users.email,
      userGroup: users.groupName,
    })
    .from(examAttempts)
    .leftJoin(users, eq(examAttempts.userId, users.id))
    .orderBy(sql`${examAttempts.completedAt} DESC`);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(16);
  doc.text("İmtahan Nəticələri", 14, 16);
  doc.setFontSize(10);
  doc.text(`Hazırlanma tarixi: ${new Date().toLocaleString("az-AZ")}`, 14, 23);

  const rows = results.map((r, i) => {
    const pct = Math.round((r.score / r.maxScore) * 100);
    const dur = r.duration ? `${Math.floor(r.duration / 60)}d ${r.duration % 60}s` : "–";
    return [
      i + 1,
      r.userName ?? "–",
      r.userEmail ?? "–",
      r.userGroup ?? "–",
      `${r.score}/${r.maxScore}`,
      `${pct}%`,
      `${r.correctAnswers}/${r.totalQuestions}`,
      dur,
      pct >= 70 ? "Keçdi" : "Kəsildi",
      new Date(r.completedAt).toLocaleString("az-AZ"),
    ];
  });

  autoTable(doc, {
    startY: 28,
    head: [["#", "Ad Soyad", "E-poçt", "Qrup", "Bal", "Faiz", "Düzgün", "Müddət", "Nəticə", "Tarix"]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 30 },
      2: { cellWidth: 45 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 14 },
      6: { cellWidth: 16 },
      7: { cellWidth: 16 },
      8: { cellWidth: 16 },
      9: { cellWidth: 28 },
    },
    didDrawCell: (data) => {
      if (data.column.index === 8 && data.section === "body") {
        const val = String(data.cell.raw);
        if (val === "Keçdi") {
          doc.setTextColor(22, 163, 74);
        } else {
          doc.setTextColor(220, 38, 38);
        }
      }
    },
  });

  const passCount = results.filter((r) => (r.score / r.maxScore) * 100 >= 70).length;
  const avg = results.length > 0
    ? Math.round(results.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0) / results.length)
    : 0;

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 200;
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(
    `Cəmi: ${results.length} nəticə  |  Keçən: ${passCount}  |  Kəsilən: ${results.length - passCount}  |  Orta: ${avg}%`,
    14,
    finalY + 8
  );

  const pdfBytes = doc.output("arraybuffer");

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="neticeler-${Date.now()}.pdf"`,
    },
  });
}
