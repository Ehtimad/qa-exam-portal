import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groups } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const all = await db.select().from(groups).orderBy(asc(groups.name));
  return NextResponse.json(all);
}
