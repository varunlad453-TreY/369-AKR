import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/state/mock-db";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const newCode = db.regenerateVendorCode(id);

    if (!newCode) {
      return NextResponse.json(
        { success: false, error: "Subcontractor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, vendorCode: newCode });
  } catch (err: unknown) {
    console.error("[Regenerate Vendor Code Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to regenerate vendor code" },
      { status: 500 }
    );
  }
}
