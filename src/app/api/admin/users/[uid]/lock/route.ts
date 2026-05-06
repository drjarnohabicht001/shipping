import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { requireAdminPermission } from "@/lib/admin-route";
import {
  AdminAction,
  AdminResource,
  FIRESTORE_COLLECTIONS,
} from "@/lib/firestore-schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const session = await requireAdminPermission(
      AdminResource.USERS,
      AdminAction.UPDATE
    );
    const { uid } = await params;
    const body = await request.json();
    const lock = Boolean(body.lock);
    const reason = typeof body.reason === "string" ? body.reason : "";
    const now = Timestamp.now();

    await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_USERS)
      .doc(uid)
      .set(
        {
          isLocked: lock,
          lockReason: lock ? reason : null,
          lockedAt: lock ? now : null,
          lockedBy: lock ? session.uid : null,
          updatedAt: now,
          updatedBy: session.uid,
        },
        { merge: true }
      );

    await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_AUDIT_LOGS)
      .add({
        targetUserId: uid,
        action: lock ? "LOCK_ADMIN_USER" : "UNLOCK_ADMIN_USER",
        performedBy: session.uid,
        timestamp: now,
        details: {
          reason,
        },
        severity: "medium",
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update admin lock state.";
    const status =
      message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
