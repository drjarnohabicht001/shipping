import { NextResponse } from "next/server";
import { getSecurityOverview, requireSystemAdminSession } from "@/lib/security-admin";

export async function GET() {
  try {
    await requireSystemAdminSession();
    const overview = await getSecurityOverview();
    return NextResponse.json({ overview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json(
      { error: message },
      { status: message === "Forbidden" ? 403 : 401 }
    );
  }
}
