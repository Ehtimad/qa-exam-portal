import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, questions } from "@/lib/schema";
import { and, eq, inArray } from "drizzle-orm";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

  const questionOrder: number[] = attempt.questionOrder ? JSON.parse(attempt.questionOrder) : [];
  const optionOrders: Record<string, number[]> = attempt.optionOrders ? JSON.parse(attempt.optionOrders) : {};
  const userAnswers: Record<string, number[]> = JSON.parse(attempt.answers);

  const dbQs = questionOrder.length > 0
    ? await db.select({ id: questions.id, text: questions.text, options: questions.options, correctAnswers: questions.correctAnswers, points: questions.points })
        .from(questions).where(inArray(questions.id, questionOrder))
    : [];

  const qMap = new Map(dbQs.map((q) => [q.id, q]));
  const pct = Math.round((attempt.score / attempt.maxScore) * 100);
  const passed = pct >= 70;
  const dur = attempt.duration ? `${Math.floor(attempt.duration / 60)} dəq ${attempt.duration % 60} san` : "–";

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("QA İmtahan Nəticəsi", 105, 12, { align: "center" });
  doc.setFontSize(10);
  doc.text(`${new Date(attempt.completedAt).toLocaleString("az-AZ")}`, 105, 22, { align: "center" });

  // Summary box
  doc.setTextColor(0);
  doc.setFontSize(12);
  let y = 36;

  const summaryData = [
    ["Ad Soyad:", session.user.name ?? "–"],
    ["Bal:", `${attempt.score} / ${attempt.maxScore}`],
    ["Faiz:", `${pct}%`],
    ["Düzgün cavablar:", `${attempt.correctAnswers} / ${attempt.totalQuestions}`],
    ["Müddət:", dur],
    ["Nəticə:", passed ? "KEÇDİ ✓" : "KƏSİLDİ ✗"],
  ];

  for (const [label, val] of summaryData) {
    doc.setFont("helvetica", "bold");
    doc.text(label, 14, y);
    doc.setFont("helvetica", "normal");
    if (label === "Nəticə:") {
      doc.setTextColor(passed ? 22 : 220, passed ? 163 : 38, passed ? 74 : 38);
    }
    doc.text(val, 60, y);
    doc.setTextColor(0);
    y += 7;
  }

  // Question breakdown
  if (questionOrder.length > 0) {
    y += 4;
    const rows: (string | number)[][] = [];
    let displayIdx = 1;
    for (const qId of questionOrder) {
      const q = qMap.get(qId);
      if (!q) continue;
      const correct: number[] = JSON.parse(q.correctAnswers);
      const optionOrder = optionOrders[String(qId)] ?? Array.from({ length: 10 }, (_, i) => i);
      const displayAnswers = userAnswers[String(qId)] ?? [];
      const originalAnswers = displayAnswers.map((di) => optionOrder[di] ?? di);
      const options = JSON.parse(q.options) as string[];
      const isCorrect =
        originalAnswers.length === correct.length &&
        [...originalAnswers].sort().every((v, i) => v === [...correct].sort()[i]);

      rows.push([
        displayIdx++,
        q.text.length > 60 ? q.text.slice(0, 57) + "..." : q.text,
        originalAnswers.map((i) => options[i] ?? "–").join(", ") || "Cavab yoxdur",
        correct.map((i) => options[i] ?? "–").join(", "),
        isCorrect ? `+${q.points}` : "0",
        isCorrect ? "✓" : "✗",
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [["#", "Sual", "Seçdiyiniz", "Düzgün cavab", "Bal", ""]],
      body: rows,
      styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 65 },
        2: { cellWidth: 45 },
        3: { cellWidth: 45 },
        4: { cellWidth: 12 },
        5: { cellWidth: 10 },
      },
    });
  }

  const pdfBytes = doc.output("arraybuffer");
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="netice-${attempt.id}.pdf"`,
    },
  });
}
