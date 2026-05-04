import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canUploadQuestions } from "@/lib/rbac";
import { db } from "@/lib/db";
import { exams } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session || !canUploadQuestions(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch real exam IDs from DB so the template shows usable values
  const allExams = await db
    .select({ id: exams.id, title: exams.title })
    .from(exams)
    .orderBy(asc(exams.title))
    .limit(5);

  const examLines = allExams.length > 0
    ? allExams.map((e) => `#     ${e.title} → ${e.id}`).join("\n")
    : "#     (Hələ heç bir imtahan yaradılmayıb. /admin/exams-dan imtahan yaradın)";

  const firstExamId  = allExams[0]?.id  ?? "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
  const secondExamId = allExams[1]?.id  ?? "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy";

  // # lines are comment lines — skipped by the importer
  const comments = [
    "# ============================================================",
    "# SUAL IMPORT ŞABLONU  —  sətirləri nümunə kimi silin",
    "# ============================================================",
    "#",
    "# SÜTUNLAR:",
    "#   id            : Boş buraxın → yeni sual avtomatik ID alır",
    "#                   Mövcud sual ID-si yazsanız → o sual yenilənir",
    "#   text          : Sualın mətni (məcburi)",
    "#   type          : single  (tək cavab)  |  multiple  (çoxlu cavab)",
    "#   option_1..6   : Cavab variantları. Minimum 2. Boş qalanlara \"\" yazın",
    "#   correct_answers: 1-əsaslı indeks. Tək: \"2\"  Çoxlu: \"1;3\"",
    "#   points        : Bal (tam ədəd, məs. 3 və ya 5)",
    "#   explanation   : İzahat — imtahan bitdikdən sonra göstərilir (istəyə görə)",
    "#   exam_ids      : İmtahan UUID-ləri (aşağıdan kopyalayın)",
    "#                   Bir imtahan: uuid1",
    "#                   Bir neçə   : uuid1;uuid2",
    "#                   Boş        : heç birinə bağlanmır",
    "#",
    "# MOVCUd İMTAHANLAR (exam_ids üçün kopyalayın):",
    examLines,
    "#",
    "# ============================================================",
  ].join("\n");

  const header = "id,text,type,option_1,option_2,option_3,option_4,option_5,option_6,correct_answers,points,explanation,exam_ids";

  // Example 1: new question (id empty) assigned to first exam, single answer
  const ex1 = `,"Sualın mətni burada yazın","single","Variant A","Variant B","Variant C","Variant D","","","1","5","İzahat (istəyə görə)","${firstExamId}"`;

  // Example 2: new question with multiple correct answers, two exams
  const ex2 = `,"Çoxlu cavablı sual nümunəsi","multiple","Doğru cavab 1","Doğru cavab 2","Yanlış cavab","Yanlış cavab 2","","","1;2","5","","${firstExamId};${secondExamId}"`;

  // Example 3: update existing question by ID (no exam assignment)
  const ex3 = `"1","Mövcud sualı yeniləmək üçün sual ID-sini yazın","single","Variant A","Variant B","Variant C","Variant D","","","2","3","",""`;

  const csv = [comments, header, ex1, ex2, ex3, ""].join("\n");

  // UTF-8 BOM ensures Excel opens the file with correct Azerbaijani characters
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sual-sablon.csv"',
    },
  });
}
