import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canUploadQuestions } from "@/lib/rbac";
import { db } from "@/lib/db";
import { exams, users } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session || !canUploadQuestions(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch real exam IDs and teachers so the template shows copy-paste-ready values
  const [allExams, allTeachers] = await Promise.all([
    db.select({ id: exams.id, title: exams.title }).from(exams).orderBy(asc(exams.title)),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.role, "teacher")).orderBy(asc(users.name)),
  ]);

  const firstExamId  = allExams[0]?.id ?? "";
  const secondExamId = allExams[1]?.id ?? "";
  const firstTeacherEmail = allTeachers[0]?.email ?? "";

  // id column: always left EMPTY — importer auto-assigns the next available ID
  // teacher column: optional — accepts teacher email or teacher_id
  const header = "id,text,type,option_1,option_2,option_3,option_4,option_5,option_6,correct_answers,points,explanation,exam_ids,teacher";

  // Row 1: single-answer question assigned to one exam + optional teacher
  const row1 = `,"Sual mətni burada yazın","single","Variant A","Variant B","Variant C","Variant D","","","1","5","İzahat burada (istəyə görə)","${firstExamId}","${firstTeacherEmail}"`;

  // Row 2: multiple-answer question, two exams, no teacher
  const twoExams = firstExamId && secondExamId ? `${firstExamId};${secondExamId}` : firstExamId;
  const row2 = `,"Çoxlu cavablı sual","multiple","Doğru cavab 1","Doğru cavab 2","Yanlış cavab","Yanlış cavab 2","","","1;2","5","","${twoExams}","" `;

  // Row 3: no exam, no teacher
  const row3 = `,"İmtahana bağlanmayan sual","single","Variant A","Variant B","Variant C","Variant D","","","3","3","","","" `;

  // Reference comments — prefixed with # so the importer skips them
  const examRef = allExams.length > 0
    ? ["# --- MOVCUd İMTAHANLAR (exam_ids sütununa kopyalayın) ---",
       ...allExams.map((e) => `# ${e.title} = ${e.id}`),
      ].join("\n")
    : "# Hələ imtahan yoxdur — /admin/exams səhifəsindən imtahan yaradın";

  const teacherRef = allTeachers.length > 0
    ? ["# --- MÜƏLLİMLƏR (teacher sütununa e-poçt daxil edin) ---",
       ...allTeachers.map((t) => `# ${t.name ?? t.email} = ${t.email}`),
      ].join("\n")
    : "# Hələ müəllim yoxdur";

  const csv = [examRef, teacherRef, header, row1, row2, row3, ""].join("\n");

  // UTF-8 BOM — Excel-də Azərbaycan hərfləri düzgün açılır
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sual-sablon.csv"',
    },
  });
}
