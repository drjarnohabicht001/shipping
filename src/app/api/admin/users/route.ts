import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import { requireAdminPermission, serializeForClient } from "@/lib/admin-route";
import {
  AdminAction,
  AdminAuditEntry,
  AdminResource,
  DEFAULT_ADMIN_PERMISSIONS,
  FIRESTORE_COLLECTIONS,
  FirestoreAdminUser,
  validateAdminUser,
} from "@/lib/firestore-schema";

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
  continueUrl.searchParams.set("email", email);
  return continueUrl.toString();
}

export async function GET() {
  try {
    await requireAdminPermission(AdminResource.USERS, AdminAction.READ);

    const snapshot = await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_USERS)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const users = snapshot.docs.map((doc) =>
      serializeForClient({
        uid: doc.id,
        ...doc.data(),
      } as FirestoreAdminUser)
    );

    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load admin users.";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminPermission(AdminResource.USERS, AdminAction.CREATE);
    const body = await request.json();
    const now = Timestamp.now();
    const nowForSchema = now as unknown as FirestoreAdminUser["createdAt"];
    const auditTimestamp = now as unknown as AdminAuditEntry["timestamp"];
    const passwordRotationDueAt = Timestamp.fromMillis(
      Date.now() + 1000 * 60 * 60 * 24 * 30
    ) as unknown as FirestoreAdminUser["passwordRotationDueAt"];

    const accessLevel = body.accessLevel as FirestoreAdminUser["accessLevel"];
    const tempPassword = randomBytes(24).toString("base64url");
    const userRecord = await getFirebaseAdminAuth().createUser({
      email: body.email,
      displayName: body.name,
      password: tempPassword,
      emailVerified: false,
      disabled: false,
    });

    const newAdminUser: FirestoreAdminUser = {
      uid: userRecord.uid,
      email: body.email,
      name: body.name,
      role: "admin",
      emailVerified: false,
      phoneNumber: undefined,
      phoneVerified: false,
      twoFactorEnabled: false,
      mfaRequired: Boolean(body.twoFactorEnabled),
      mustChangePassword: true,
      lastPasswordChange: nowForSchema,
      passwordRotationDueAt,
      permissions: DEFAULT_ADMIN_PERMISSIONS[accessLevel] || [],
      accessLevel,
      sessionTimeout: Number(body.sessionTimeout) || 480,
      isActive: true,
      isLocked: false,
      loginAttempts: 0,
      department: body.department || undefined,
      jobTitle: body.jobTitle || undefined,
      employeeId: body.employeeId || undefined,
      createdAt: nowForSchema,
      updatedAt: nowForSchema,
      createdBy: session.uid,
      updatedBy: session.uid,
      version: 1,
      auditTrail: [
        {
          id: crypto.randomUUID(),
          action: "ADMIN_USER_CREATED",
          timestamp: auditTimestamp,
          details: {
            createdBy: session.uid,
            via: "api",
          },
          severity: "medium",
        } satisfies AdminAuditEntry,
      ],
    };

    const validationErrors = validateAdminUser(newAdminUser);
    if (validationErrors.length > 0) {
      await getFirebaseAdminAuth().deleteUser(userRecord.uid).catch(() => undefined);
      return NextResponse.json(
        { error: `Validation failed: ${validationErrors.join(", ")}` },
        { status: 400 }
      );
    }

    await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_USERS)
      .doc(userRecord.uid)
      .set(newAdminUser);

    const resetLink = await getFirebaseAdminAuth().generatePasswordResetLink(body.email, {
      url: getPasswordResetContinueUrl(request, body.email),
      handleCodeInApp: false,
    });

    await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_AUDIT_LOGS)
      .add({
        targetUserId: userRecord.uid,
        action: "CREATE_ADMIN_USER",
        performedBy: session.uid,
        timestamp: now,
        details: {
          targetUserEmail: body.email,
          accessLevel,
        },
        severity: "medium",
      });

    return NextResponse.json({
      ok: true,
      user: serializeForClient(newAdminUser),
      resetLink,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create admin user.";
    const status =
      message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
