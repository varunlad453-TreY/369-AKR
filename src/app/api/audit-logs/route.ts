import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AuditLog } from "@/types";
import { db } from "@/lib/state/mock-db";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Get Audit Logs Supabase Fallback to Mock DB]", error.message);
      return NextResponse.json({ success: true, logs: db.getAuditLogs() });
    }

    const logs: AuditLog[] = (data || []).map((log) => ({
      id: log.id,
      action: log.action,
      actorId: log.actor_id,
      actorType: log.actor_type as AuditLog["actorType"],
      actorIdentifier: log.actor_identifier,
      resourceId: log.resource_id,
      resourceType: log.resource_type,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      metadata: log.metadata,
      createdAt: log.created_at,
    }));

    return NextResponse.json({ success: true, logs });
  } catch (err: unknown) {
    console.warn("[Get Audit Logs Error - Fallback to Mock DB]", err);
    return NextResponse.json({ success: true, logs: db.getAuditLogs() });
  }
}
