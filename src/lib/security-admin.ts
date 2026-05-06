import { Timestamp } from "firebase-admin/firestore";
import {
  AdminLoginEventRecord,
  AdminSessionRecord,
  FIRESTORE_COLLECTIONS,
  FirestoreAdminUser,
  SecurityAlertRecord,
} from "@/lib/firestore-schema";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import { clearAdminSession, verifyAdminSessionFromCookies } from "@/lib/server-auth";

type TimestampLike = {
  toMillis: () => number;
};

function toMillis(value?: TimestampLike | null) {
  return value ? value.toMillis() : 0;
}

function getAlertSeverity(level: number): SecurityAlertRecord["severity"] {
  if (level >= 10) return "critical";
  if (level >= 5) return "high";
  if (level >= 3) return "medium";
  return "low";
}

export async function requireSystemAdminSession(options?: { allowWithoutMfa?: boolean }) {
  const session = await verifyAdminSessionFromCookies();

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (session.accessLevel !== "system_admin") {
    throw new Error("Forbidden");
  }

  if (
    !options?.allowWithoutMfa &&
    session.adminUser.mfaRequired &&
    !session.adminUser.twoFactorEnabled
  ) {
    throw new Error("MFA_REQUIRED");
  }

  return session;
}

export async function getSecurityOverview() {
  const [sessionsSnap, loginsSnap, alerts] = await Promise.all([
    getFirebaseAdminDb().collection(FIRESTORE_COLLECTIONS.ADMIN_SESSIONS).get(),
    getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_LOGIN_EVENTS)
      .orderBy("timestamp", "desc")
      .limit(50)
      .get(),
    listSecurityAlerts(),
  ]);

  const sessions = sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AdminSessionRecord[];

  const logins = loginsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AdminLoginEventRecord[];

  const activeSessions = sessions.filter((session) => session.status === "active");
  const successfulLogins = logins.filter((login) => login.success);
  const failedLogins = logins.filter((login) => !login.success);
  const now = Date.now();
  const last24Hours = now - 24 * 60 * 60 * 1000;

  return {
    activeSessions: activeSessions.length,
    totalSessions: sessions.length,
    recentLogins: successfulLogins.filter((login) => login.timestamp.toMillis() >= last24Hours).length,
    failedLogins: failedLogins.filter((login) => login.timestamp.toMillis() >= last24Hours).length,
    uniqueAdmins: new Set(activeSessions.map((session) => session.userId)).size,
    openAlerts: alerts.filter((alert) => alert.status !== "resolved").length,
  };
}

export async function listSecurityAlerts(): Promise<SecurityAlertRecord[]> {
  const [sessionsSnap, loginsSnap] = await Promise.all([
    getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_SESSIONS)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get(),
    getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.ADMIN_LOGIN_EVENTS)
      .orderBy("timestamp", "desc")
      .limit(200)
      .get(),
  ]);

  const sessions = sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AdminSessionRecord[];
  const logins = loginsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AdminLoginEventRecord[];

  const alerts: SecurityAlertRecord[] = [];
  const now = Date.now();
  const last24Hours = now - 24 * 60 * 60 * 1000;
  const lastHour = now - 60 * 60 * 1000;

  const recentFailedLogins = logins.filter(
    (login) => !login.success && toMillis(login.timestamp) >= lastHour
  );

  if (recentFailedLogins.length >= 3) {
    alerts.push({
      id: `failed-logins-${recentFailedLogins.length}`,
      type: "failed_login_spike",
      severity: getAlertSeverity(recentFailedLogins.length),
      message: `${recentFailedLogins.length} failed admin login attempts were recorded in the last hour.`,
      createdAt: Timestamp.now() as unknown as SecurityAlertRecord["createdAt"],
      status: "open",
      details: {
        affectedUsers: [...new Set(recentFailedLogins.map((login) => login.email))],
      },
    });
  }

  const activeSessions = sessions.filter((session) => session.status === "active");
  const sessionsByUser = new Map<string, AdminSessionRecord[]>();
  activeSessions.forEach((session) => {
    const userSessions = sessionsByUser.get(session.userId) ?? [];
    userSessions.push(session);
    sessionsByUser.set(session.userId, userSessions);
  });

  for (const [userId, userSessions] of sessionsByUser.entries()) {
    if (userSessions.length >= 3) {
      alerts.push({
        id: `session-anomaly-${userId}`,
        type: "session_anomaly",
        severity: getAlertSeverity(userSessions.length),
        message: `${userSessions[0]?.email ?? userId} has ${userSessions.length} active admin sessions.`,
        createdAt: Timestamp.now() as unknown as SecurityAlertRecord["createdAt"],
        status: "investigating",
        relatedUserId: userId,
        details: {
          sessionIds: userSessions.map((session) => session.id),
        },
      });
    }
  }

  const staleSessions = activeSessions.filter(
    (session) =>
      toMillis(session.lastActivityAt) > 0 &&
      toMillis(session.lastActivityAt) < last24Hours
  );

  if (staleSessions.length > 0) {
    alerts.push({
      id: `stale-sessions-${staleSessions.length}`,
      type: "policy_violation",
      severity: staleSessions.length >= 5 ? "high" : "medium",
      message: `${staleSessions.length} active admin sessions have been idle for more than 24 hours.`,
      createdAt: Timestamp.now() as unknown as SecurityAlertRecord["createdAt"],
      status: "open",
      details: {
        sessionIds: staleSessions.map((session) => session.id),
      },
    });
  }

  return alerts;
}

export async function listAdminSessions(limitCount = 100) {
  const snapshot = await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.ADMIN_SESSIONS)
    .orderBy("createdAt", "desc")
    .limit(limitCount)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AdminSessionRecord[];
}

export async function listAdminLoginEvents(limitCount = 100) {
  const snapshot = await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.ADMIN_LOGIN_EVENTS)
    .orderBy("timestamp", "desc")
    .limit(limitCount)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AdminLoginEventRecord[];
}

export async function revokeAdminSession(sessionId: string) {
  await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.ADMIN_SESSIONS)
    .doc(sessionId)
    .set(
      {
        status: "revoked",
        terminatedAt: Timestamp.now(),
      },
      { merge: true }
    );
}

export async function listUserSessions(userId: string, limitCount = 20) {
  const snapshot = await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.ADMIN_SESSIONS)
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limitCount)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AdminSessionRecord[];
}

export async function revokeOwnSession(
  ownerUserId: string,
  targetSessionId: string,
  currentSessionId?: string
) {
  const sessionRef = getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.ADMIN_SESSIONS)
    .doc(targetSessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    throw new Error("Session not found");
  }

  const sessionData = sessionSnap.data() as AdminSessionRecord;
  if (sessionData.userId !== ownerUserId) {
    throw new Error("Forbidden");
  }

  await revokeAdminSession(targetSessionId);

  if (currentSessionId && currentSessionId === targetSessionId) {
    await clearAdminSession();
  }
}

export async function revokeOtherUserSessions(
  ownerUserId: string,
  currentSessionId?: string
) {
  const sessions = await listUserSessions(ownerUserId, 100);
  const sessionsToRevoke = sessions.filter(
    (session) => session.status === "active" && session.id !== currentSessionId
  );

  await Promise.all(
    sessionsToRevoke.map((session) => revokeAdminSession(session.id))
  );

  return sessionsToRevoke.length;
}

export async function getCurrentAdminMfaState(userId: string) {
  const [userRecord, projectConfig] = await Promise.all([
    getFirebaseAdminAuth().getUser(userId),
    getFirebaseAdminAuth().projectConfigManager().getProjectConfig(),
  ]);

  const providerConfigs = projectConfig.multiFactorConfig?.providerConfigs ?? [];
  const totpProvider = providerConfigs.find(
    (config) => config.totpProviderConfig !== undefined
  );

  return {
    projectTotpEnabled:
      projectConfig.multiFactorConfig?.state === "ENABLED" &&
      totpProvider?.state === "ENABLED",
    enrolledFactors: (userRecord.multiFactor?.enrolledFactors ?? []).map((factor) => ({
      uid: factor.uid,
      displayName: factor.displayName ?? null,
      factorId: factor.factorId,
      enrollmentTime: factor.enrollmentTime ?? null,
    })),
  };
}

export async function syncAdminMfaState(adminUser: FirestoreAdminUser) {
  const mfaState = await getCurrentAdminMfaState(adminUser.uid);
  const enabled = mfaState.enrolledFactors.length > 0;

  await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.ADMIN_USERS)
    .doc(adminUser.uid)
    .set(
      {
        twoFactorEnabled: enabled,
        updatedAt: Timestamp.now(),
        updatedBy: "mfa-sync",
      },
      { merge: true }
    );

  return mfaState;
}

export async function ensureTotpProjectMfaEnabled(userId: string) {
  const auth = getFirebaseAdminAuth();
  const currentConfig = await auth.projectConfigManager().getProjectConfig();
  const existingProviderConfigs = currentConfig.multiFactorConfig?.providerConfigs ?? [];
  const filteredProviders = existingProviderConfigs.filter(
    (config) => config.totpProviderConfig === undefined
  );

  await auth.projectConfigManager().updateProjectConfig({
    multiFactorConfig: {
      state: "ENABLED",
      factorIds: currentConfig.multiFactorConfig?.factorIds,
      providerConfigs: [
        ...filteredProviders,
        {
          state: "ENABLED",
          totpProviderConfig: {
            adjacentIntervals: 1,
          },
        },
      ],
    },
  });

  return getCurrentAdminMfaState(userId);
}
