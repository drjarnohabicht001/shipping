import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { DecodedIdToken } from "firebase-admin/auth";
import { Timestamp } from "firebase-admin/firestore";
import {
  AdminLoginEventRecord,
  AdminSessionRecord,
  FIRESTORE_COLLECTIONS,
  FirestoreAdminUser,
} from "@/lib/firestore-schema";
import { SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from "@/lib/auth-constants";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

export interface AuthenticatedAdminContext {
  uid: string;
  email: string;
  name: string;
  accessLevel: FirestoreAdminUser["accessLevel"];
  sessionId?: string;
  adminUser: FirestoreAdminUser;
}

function getCookieConfig(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

function getRequestMetadata(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  const userAgent = headers.get("user-agent") || "unknown";

  return { ipAddress, userAgent };
}

async function getAdminUserOrThrow(uid: string) {
  const adminUserSnap = await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.ADMIN_USERS)
    .doc(uid)
    .get();

  if (!adminUserSnap.exists) {
    throw new Error("Admin profile not found");
  }

  const adminUser = {
    uid: adminUserSnap.id,
    ...adminUserSnap.data(),
  } as FirestoreAdminUser;

  if (!adminUser.isActive || adminUser.isLocked) {
    throw new Error("Admin account is inactive or locked");
  }

  return adminUser;
}

async function synchronizeAdminMfaState(adminUser: FirestoreAdminUser) {
  const userRecord = await getFirebaseAdminAuth().getUser(adminUser.uid);
  const hasEnrolledFactor =
    (userRecord.multiFactor?.enrolledFactors?.length ?? 0) > 0;

  if (adminUser.twoFactorEnabled !== hasEnrolledFactor) {
    await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_USERS)
      .doc(adminUser.uid)
      .set(
        {
          twoFactorEnabled: hasEnrolledFactor,
          updatedAt: Timestamp.now(),
          updatedBy: "session-mfa-sync",
        },
        { merge: true }
      );
    adminUser.twoFactorEnabled = hasEnrolledFactor;
  }

  return adminUser;
}

async function writeLoginAndSession(
  adminUser: FirestoreAdminUser,
  sessionId: string,
  expiresAt: Timestamp,
  headers: Headers,
  success: boolean,
  reason?: string
) {
  const { ipAddress, userAgent } = getRequestMetadata(headers);
  const now = Timestamp.now();
  const typedNow = now as unknown as AdminLoginEventRecord["timestamp"];
  const loginEventId = randomUUID();

  const loginEvent: AdminLoginEventRecord = {
    id: loginEventId,
    userId: adminUser.uid,
    email: adminUser.email,
    name: adminUser.name,
    accessLevel: adminUser.accessLevel,
    timestamp: typedNow,
    success,
    sessionId,
    ipAddress,
    userAgent,
    ...(reason !== undefined ? { reason } : {}),
    authMethod: "password",
  };

  await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.ADMIN_LOGIN_EVENTS)
    .doc(loginEventId)
    .set(loginEvent);

  if (!success) {
    return;
  }

  const sessionRecord: AdminSessionRecord = {
    id: sessionId,
    userId: adminUser.uid,
    email: adminUser.email,
    name: adminUser.name,
    accessLevel: adminUser.accessLevel,
    sessionCookieIssuedAt:
      now as unknown as AdminSessionRecord["sessionCookieIssuedAt"],
    expiresAt: expiresAt as unknown as AdminSessionRecord["expiresAt"],
    lastActivityAt: now as unknown as AdminSessionRecord["lastActivityAt"],
    createdAt: now as unknown as AdminSessionRecord["createdAt"],
    status: "active",
    ipAddress,
    userAgent,
    loginEventId,
  };

  await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.ADMIN_SESSIONS)
    .doc(sessionId)
    .set(sessionRecord);

  await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.ADMIN_USERS)
    .doc(adminUser.uid)
    .set(
      {
        lastLogin: now,
        lastActivity: now,
      },
      { merge: true }
    );
}

export async function createAdminSession(idToken: string, headers: Headers) {
  const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken, true);
  const adminUser = await synchronizeAdminMfaState(
    await getAdminUserOrThrow(decodedToken.uid)
  );
  const sessionCookie = await getFirebaseAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });
  const sessionId = randomUUID();
  const expiresAt = Timestamp.fromMillis(Date.now() + SESSION_DURATION_MS);

  await writeLoginAndSession(adminUser, sessionId, expiresAt, headers, true);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, getCookieConfig(SESSION_DURATION_MS));
  cookieStore.set(SESSION_ID_COOKIE_NAME, sessionId, getCookieConfig(SESSION_DURATION_MS));

  return {
    sessionId,
    adminUser,
    decodedToken,
  };
}

export async function verifyAdminSessionFromCookies(): Promise<AuthenticatedAdminContext | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedClaims = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
    return getAuthenticatedAdminContext(decodedClaims, sessionId);
  } catch {
    return null;
  }
}

export async function getAuthenticatedAdminContext(
  decodedClaims: DecodedIdToken,
  sessionId?: string
): Promise<AuthenticatedAdminContext> {
  const adminUser = await synchronizeAdminMfaState(
    await getAdminUserOrThrow(decodedClaims.uid)
  );

  if (sessionId) {
    const sessionSnap = await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_SESSIONS)
      .doc(sessionId)
      .get();

    if (!sessionSnap.exists) {
      throw new Error("Admin session not found");
    }

    const sessionData = sessionSnap.data() as AdminSessionRecord;
    if (sessionData.status !== "active") {
      throw new Error("Admin session is no longer active");
    }

    await sessionSnap.ref.set(
      {
        lastActivityAt: Timestamp.now(),
      },
      { merge: true }
    );
  }

  return {
    uid: adminUser.uid,
    email: adminUser.email,
    name: adminUser.name,
    accessLevel: adminUser.accessLevel,
    sessionId,
    adminUser,
  };
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

  if (sessionId) {
    await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_SESSIONS)
      .doc(sessionId)
      .set(
        {
          status: "logged_out",
          terminatedAt: Timestamp.now(),
        },
        { merge: true }
      );
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(SESSION_ID_COOKIE_NAME);
}

export function toSessionUser(adminUser: FirestoreAdminUser, sessionId?: string) {
  return {
    id: adminUser.uid,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.accessLevel === "system_admin" ? "system_admin" : "admin",
    accessLevel: adminUser.accessLevel,
    lastLogin: adminUser.lastLogin?.toDate?.()?.toISOString() ?? null,
    lastActivity: adminUser.lastActivity?.toDate?.()?.toISOString() ?? null,
    isActive: adminUser.isActive,
    mfaEnabled: adminUser.twoFactorEnabled,
    mfaRequired: adminUser.mfaRequired ?? false,
    mustChangePassword: adminUser.mustChangePassword ?? false,
    passwordRotationDueAt:
      adminUser.passwordRotationDueAt?.toDate?.()?.toISOString() ?? null,
    sessionId: sessionId ?? null,
    permissions: (adminUser.permissions || []).map((permission) => ({
      resource: permission.resource,
      actions: permission.actions,
    })),
  };
}
