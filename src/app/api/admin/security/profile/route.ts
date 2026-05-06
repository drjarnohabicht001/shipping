import { NextResponse } from "next/server";
import { verifyAdminSessionFromCookies } from "@/lib/server-auth";

export async function GET() {
  try {
    const session = await verifyAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = session.adminUser;

    return NextResponse.json({
      profile: {
        uid: adminUser.uid,
        email: adminUser.email,
        name: adminUser.name,
        accessLevel: adminUser.accessLevel,
        sessionId: session.sessionId ?? null,
        lastLogin: adminUser.lastLogin?.toDate?.()?.toISOString() ?? null,
        lastActivity: adminUser.lastActivity?.toDate?.()?.toISOString() ?? null,
        lastPasswordChange:
          adminUser.lastPasswordChange?.toDate?.()?.toISOString() ?? null,
        passwordRotationDueAt:
          adminUser.passwordRotationDueAt?.toDate?.()?.toISOString() ?? null,
        mfaEnabled: adminUser.twoFactorEnabled,
        mfaRequired: adminUser.mfaRequired ?? false,
        mustChangePassword: adminUser.mustChangePassword ?? false,
        sessionTimeout: adminUser.sessionTimeout,
        allowedIpRanges: adminUser.allowedIpRanges ?? [],
      },
    });
  } catch (error) {
    console.error("Security profile lookup failed:", error);
    return NextResponse.json(
      { error: "Unable to load security profile." },
      { status: 500 }
    );
  }
}
