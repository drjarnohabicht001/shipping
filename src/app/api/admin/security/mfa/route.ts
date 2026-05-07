import { NextRequest, NextResponse } from "next/server";
import {
  ensureTotpProjectMfaEnabled,
  getCurrentAdminMfaState,
  requireSystemAdminSession,
  syncAdminMfaState,
} from "@/lib/security-admin";
import { verifyAdminSessionFromCookies } from "@/lib/server-auth";

export async function GET() {
  try {
    const session = await verifyAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mfaState = await getCurrentAdminMfaState(session.uid);
    return NextResponse.json(mfaState);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load MFA status." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (action === "enable_project_totp") {
      await requireSystemAdminSession({ allowWithoutMfa: true });
      const mfaState = await ensureTotpProjectMfaEnabled(session.uid);
      return NextResponse.json({ ok: true, ...mfaState });
    }

    const mfaState = await syncAdminMfaState(session.adminUser);
    return NextResponse.json({ ok: true, ...mfaState });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update MFA state.";
    const status =
      message === "Forbidden"
        ? 403
        : message === "MFA_REQUIRED"
          ? 428
          : message.includes("cannot enable TOTP MFA yet")
            ? 409
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
