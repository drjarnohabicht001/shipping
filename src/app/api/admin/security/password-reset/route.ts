import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-schema";
import { verifyAdminSessionFromCookies } from "@/lib/server-auth";

function getAppBaseUrl(request: NextRequest) {
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";

  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const continueUrl = `${getAppBaseUrl(request)}/admin/login?passwordReset=success&email=${encodeURIComponent(
      session.email
    )}`;
    const resetLink = await getFirebaseAdminAuth().generatePasswordResetLink(
      session.email,
      {
        url: continueUrl,
        handleCodeInApp: false,
      }
    );

    await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_USERS)
      .doc(session.uid)
      .set(
        {
          passwordResetIssuedAt: now,
          updatedAt: now,
          updatedBy: "password-reset-link",
        },
        { merge: true }
      );

    await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_AUDIT_LOGS)
      .add({
        targetUserId: session.uid,
        action: "GENERATE_PASSWORD_RESET_LINK",
        performedBy: session.uid,
        timestamp: now,
        details: {
          email: session.email,
          generatedForSelf: true,
          continueUrl,
        },
        severity: "medium",
      });

    return NextResponse.json({ resetLink });
  } catch (error) {
    console.error("Password reset link generation failed:", error);
    return NextResponse.json(
      { error: "Unable to generate password reset link." },
      { status: 500 }
    );
  }
}
