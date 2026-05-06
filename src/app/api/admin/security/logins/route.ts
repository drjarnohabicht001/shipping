import { NextResponse } from "next/server";
import { listAdminLoginEvents, requireSystemAdminSession } from "@/lib/security-admin";

export async function GET() {
  try {
    await requireSystemAdminSession();
    const logins = await listAdminLoginEvents();
    return NextResponse.json({ logins });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json(
      { error: message },
      { status: message === "Forbidden" ? 403 : 401 }
    );
  }
}
