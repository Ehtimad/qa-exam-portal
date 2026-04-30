import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const header = "id,lecture_id,text,type,option_1,option_2,option_3,option_4,option_5,option_6,correct_answers,difficulty,points,explanation";
  const example = ',"1","Testing nədir?","single","Kodun yazılması","Proqramın sınaqdan keçirilməsi","Xətaların düzəldilməsi","Layihənin planlanması","","","1","easy","3","Testinq proqram keyfiyyətini yoxlamaq deməkdir"';

  const csv = `${header}\n${example}\n`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sual-sablon.csv"',
    },
  });
}
