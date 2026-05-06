import { NextRequest, NextResponse } from "next/server";
import { clearAdminSession, createAdminSession, toSessionUser, verifyAdminSessionFromCookies } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body?.idToken;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "Missing Firebase ID token." },
        { status: 400 }
      );
    }

    const { sessionId, adminUser } = await createAdminSession(
      idToken,
      request.headers
    );

    return NextResponse.json({
      ok: true,
      user: toSessionUser(adminUser, sessionId),
    });
  } catch (error) {
    console.error("Session creation failed:", error);
    return NextResponse.json(
      { error: "Unable to create admin session." },
      { status: 401 }
    );
  }
}

export async function GET() {
  try {
    const session = await verifyAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: toSessionUser(session.adminUser, session.sessionId),
    });
  } catch (error) {
    console.error("Session lookup failed:", error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  try {
    await clearAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session deletion failed:", error);
    return NextResponse.json(
      { error: "Unable to clear admin session." },
      { status: 500 }
    );
  }
}
