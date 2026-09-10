import { NextRequest, NextResponse } from "next/server";
import { subcontractorOnboardingSchema } from "@/lib/zod/schemas";
import { db } from "@/lib/state/mock-db";

export async function GET() {
  const subcontractors = db.getSubcontractors();
  return NextResponse.json({ success: true, subcontractors });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = subcontractorOnboardingSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const newSubcontractor = db.registerSubcontractor(parseResult.data);
    return NextResponse.json(
      { success: true, subcontractor: newSubcontractor },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[Onboard Subcontractor Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to onboard subcontractor" },
      { status: 500 }
    );
  }
}
