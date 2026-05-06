export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accessLevel?: AccessLevel;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
  lastActivity?: Date;
  isActive: boolean;
  sessionId?: string;
  mfaEnabled?: boolean;
  mfaRequired?: boolean;
  mustChangePassword?: boolean;
  passwordRotationDueAt?: Date;
  permissions?: Permission[];
}

export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  ADMIN = 'admin',
  USER = 'user'
}

export type AccessLevel =
  | 'system_admin'
  | 'super_admin'
  | 'admin'
  | 'limited_admin'
  | 'user';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mfaChallenge: MfaChallenge | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface MfaChallenge {
  factorId: string;
  enrollmentId: string;
  displayName?: string | null;
  email: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SYSTEM_ADMIN]: [
    { resource: 'security', actions: ['read', 'update', 'manage'] },
    { resource: 'sessions', actions: ['read', 'delete', 'manage'] },
    { resource: 'logins', actions: ['read', 'export'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage', 'lock', 'unlock'] },
    { resource: 'tracking', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'quotes', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'export', actions: ['read', 'write', 'create'] },
    { resource: 'audit', actions: ['read', 'export'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'messages', actions: ['read', 'update'] },
  ],
  [UserRole.ADMIN]: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { resource: 'tracking', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'projects', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'audit', actions: ['read'] },
    { resource: 'export', actions: ['create'] },
    { resource: 'quotes', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'settings', actions: ['read', 'update'] }
  ],
  [UserRole.USER]: [
    { resource: 'tracking', actions: ['read'] },
    { resource: 'projects', actions: ['read'] }
  ]
};

function normalizePermissionRequest(resource: string, action: string): {
  resource: string;
  action: string;
} {
  if (resource.includes('.') && action === 'read') {
    const [normalizedResource, normalizedAction] = resource.split('.', 2);
    if (normalizedResource && normalizedAction) {
      return { resource: normalizedResource, action: normalizedAction };
    }
  }

  return { resource, action };
}

export const hasPermission = (
  userRole: UserRole,
  resource: string,
  action: string,
  userPermissions?: Permission[]
): boolean => {
  const normalized = normalizePermissionRequest(resource, action);
  const permissions =
    userPermissions && userPermissions.length > 0
      ? userPermissions
      : ROLE_PERMISSIONS[userRole];
  const resourcePermission = permissions.find(
    (p) => p.resource === normalized.resource
  );
  return resourcePermission?.actions.includes(normalized.action) || false;
};
