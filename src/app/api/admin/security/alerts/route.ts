import { NextResponse } from "next/server";
import { listSecurityAlerts, requireSystemAdminSession } from "@/lib/security-admin";

export async function GET() {
  try {
    await requireSystemAdminSession();
    const alerts = await listSecurityAlerts();
    return NextResponse.json({ alerts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json(
      { error: message },
      { status: message === "Forbidden" ? 403 : 401 }
    );
  }
}
