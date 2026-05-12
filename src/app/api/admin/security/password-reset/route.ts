import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-schema";
import { verifyAdminSessionFromCookies } from "@/lib/server-auth";

function getAppBaseUrl(request: NextRequest) {
  const configuredBaseUrl =
    process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  return request.nextUrl.origin;
}

function getPasswordResetContinueUrl(request: NextRequest, email: string) {
  const continueUrl = new URL("/admin/login", getAppBaseUrl(request));
  continueUrl.searchParams.set("passwordReset", "success");
  continueUrl.searchParams.set("email", email);
  return continueUrl.toString();
}

function getErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "errorInfo" in error &&
    typeof (error as { errorInfo?: { code?: unknown } }).errorInfo?.code === "string"
  ) {
    return (error as { errorInfo: { code: string } }).errorInfo.code;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const continueUrl = getPasswordResetContinueUrl(request, session.email);
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
    const code = getErrorCode(error);
    const message =
      code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri"
        ? "Password reset link generation failed because the production app URL is not authorized in Firebase Auth. Set APP_BASE_URL to your public https:// domain and add that domain to Firebase Authentication authorized domains."
        : "Unable to generate password reset link.";
    console.error("Password reset link generation failed:", error);
    return NextResponse.json(
      { error: message },
      {
        status:
          code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri"
            ? 400
            : 500,
      }
    );
  }
}
