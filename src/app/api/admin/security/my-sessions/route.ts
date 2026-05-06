import { NextRequest, NextResponse } from "next/server";
import {
  listUserSessions,
  revokeOtherUserSessions,
  revokeOwnSession,
} from "@/lib/security-admin";
import { verifyAdminSessionFromCookies } from "@/lib/server-auth";

export async function GET() {
  try {
    const session = await verifyAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await listUserSessions(session.uid);
    return NextResponse.json({ sessions, currentSessionId: session.sessionId ?? null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load sessions." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await verifyAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (body?.scope === "others") {
      const revokedCount = await revokeOtherUserSessions(session.uid, session.sessionId);
      return NextResponse.json({ ok: true, revokedCount });
    }

    const sessionId = body?.sessionId;
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
    }

    await revokeOwnSession(session.uid, sessionId, session.sessionId);
    return NextResponse.json({
      ok: true,
      revokedCurrentSession: session.sessionId === sessionId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to revoke session.";
    const status = message === "Forbidden" ? 403 : message === "Session not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
