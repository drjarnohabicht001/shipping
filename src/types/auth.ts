export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  permissions?: string[];
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Permission {
  resource: string;
  actions: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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

export const hasPermission = (userRole: UserRole, resource: string, action: string): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole];
  const resourcePermission = permissions.find(p => p.resource === resource);
  return resourcePermission?.actions.includes(action) || false;
};