import { Timestamp } from "firebase-admin/firestore";
import { AdminAction, AdminPermission, AdminResource } from "@/lib/firestore-schema";
import { verifyAdminSessionFromCookies } from "@/lib/server-auth";

export async function requireAdminSession() {
  const session = await verifyAdminSessionFromCookies();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export function hasAdminPermission(
  permissions: AdminPermission[] | undefined,
  resource: AdminResource,
  action: AdminAction
) {
  if (!permissions || permissions.length === 0) {
    return false;
  }

  return permissions.some((permission) => {
    const notExpired =
      !permission.expiresAt || permission.expiresAt.toDate() > new Date();

    return (
      permission.resource === resource &&
      permission.actions.includes(action) &&
      notExpired
    );
  });
}

export async function requireAdminPermission(
  resource: AdminResource,
  action: AdminAction
) {
  const session = await requireAdminSession();

  if (!hasAdminPermission(session.adminUser.permissions, resource, action)) {
    throw new Error("Forbidden");
  }

  return session;
}

export function serializeForClient<T>(value: T): T {
  if (value instanceof Timestamp) {
    return {
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
    } as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeForClient(item)) as T;
  }

  if (value && typeof value === "object") {
    const serializedEntries = Object.entries(value as Record<string, unknown>).map(
      ([key, nestedValue]) => [key, serializeForClient(nestedValue)]
    );
    return Object.fromEntries(serializedEntries) as T;
  }

  return value;
}
