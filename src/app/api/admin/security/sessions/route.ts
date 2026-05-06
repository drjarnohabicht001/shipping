import { NextRequest, NextResponse } from "next/server";
import { listAdminSessions, requireSystemAdminSession, revokeAdminSession } from "@/lib/security-admin";

export async function GET() {
  try {
    await requireSystemAdminSession();
    const sessions = await listAdminSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json(
      { error: message },
      { status: message === "Forbidden" ? 403 : 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSystemAdminSession();
    const body = await request.json();
    const sessionId = body?.sessionId;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
    }

    await revokeAdminSession(sessionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json(
      { error: message },
      { status: message === "Forbidden" ? 403 : 401 }
    );
  }
}
