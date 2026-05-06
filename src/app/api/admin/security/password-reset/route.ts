import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-schema";
import { verifyAdminSessionFromCookies } from "@/lib/server-auth";

export async function POST() {
  try {
    const session = await verifyAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resetLink = await getFirebaseAdminAuth().generatePasswordResetLink(
      session.email
    );

    await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_AUDIT_LOGS)
      .add({
        targetUserId: session.uid,
        action: "GENERATE_PASSWORD_RESET_LINK",
        performedBy: session.uid,
        timestamp: new Date(),
        details: {
          email: session.email,
          generatedForSelf: true,
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
