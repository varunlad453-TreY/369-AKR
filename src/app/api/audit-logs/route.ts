import { NextResponse } from "next/server";
import { db } from "@/lib/state/mock-db";

export async function GET() {
  const logs = db.getAuditLogs();
  return NextResponse.json({ success: true, logs });
}
