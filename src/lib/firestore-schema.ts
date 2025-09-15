import { Timestamp } from 'firebase/firestore';

// Firestore Admin User Schema
export interface FirestoreAdminUser {
  // Core Identity Fields
  uid: string; // Firebase Auth UID
  email: string;
  name: string;
  role: 'admin'; // Explicitly set to admin only
  
  // Security & Authentication
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified?: boolean;
  twoFactorEnabled: boolean;
  lastPasswordChange: Timestamp;
  
  // Profile Information
  avatar?: string;
  department?: string;
  jobTitle?: string;
  employeeId?: string;
  
  // Access Control & Permissions
  permissions: AdminPermission[];
  accessLevel: 'super_admin' | 'admin' | 'limited_admin';
  allowedIpRanges?: string[]; // IP whitelist for enhanced security
  sessionTimeout: number; // in minutes
  
  // Activity Tracking
  createdAt: Timestamp;
  createdBy: string; // UID of admin who created this account
  lastLogin?: Timestamp;
  lastActivity?: Timestamp;
  loginAttempts: number;
  lastFailedLogin?: Timestamp;
  
  // Account Status
  isActive: boolean;
  isLocked: boolean;
  lockReason?: string;
  lockedAt?: Timestamp;
  lockedBy?: string;
  
  // Audit & Compliance
  auditTrail: AdminAuditEntry[];
  complianceFlags?: string[];
  
  // System Metadata
  updatedAt: Timestamp;
  updatedBy: string;
  version: number; // For optimistic locking
}

// Admin-specific permissions with granular control
export interface AdminPermission {
  resource: AdminResource;
  actions: AdminAction[];
  conditions?: PermissionCondition[];
  expiresAt?: Timestamp;
  grantedBy: string;
  grantedAt: Timestamp;
}

export enum AdminResource {
  USERS = 'users',
  TRACKING = 'tracking',
  AUDIT_LOGS = 'audit_logs',
  SYSTEM_SETTINGS = 'system_settings',
  REPORTS = 'reports',
  EXPORTS = 'exports',
  ADMIN_PANEL = 'admin_panel',
  USER_MANAGEMENT = 'user_management',
  ROLE_MANAGEMENT = 'role_management',
  SECURITY_SETTINGS = 'security_settings'
}

export enum AdminAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  REJECT = 'reject',
  LOCK = 'lock',
  UNLOCK = 'unlock',
  RESET_PASSWORD = 'reset_password',
  VIEW_SENSITIVE = 'view_sensitive'
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Firestore Tracking Schema
export interface FirestoreTrackingItem {
  // Core Tracking Information
  id: string; // Firestore document ID
  trackingId: string; // Unique tracking code (e.g., SH-2024-ABC123)
  
  // Item Details
  itemName: string;
  itemDescription?: string;
  itemValue?: number; // Declared value for insurance
  itemCategory?: string;
  weight?: number; // in kg
  dimensions?: {
    length: number; // in cm
    width: number;
    height: number;
  };
  
  // Sender Information
  sender: {
    name: string;
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    companyName?: string;
  };
  
  // Recipient Information
  recipient: {
    name: string;
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    companyName?: string;
  };
  
  // Shipping Details
  serviceType: 'standard' | 'express' | 'overnight' | 'international' | 'same_day';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Status and Timeline
  status: TrackingStatus;
  currentLocation?: {
    city: string;
    state?: string;
    country: string;
    facility?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Delivery Information
  estimatedDeliveryDate: Timestamp;
  actualDeliveryDate?: Timestamp;
  deliveryInstructions?: string;
  signatureRequired: boolean;
  
  // Financial Information
  cost: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'cancelled';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  pickedUpAt?: Timestamp;
  deliveredAt?: Timestamp;
  
  // System Information
  createdBy: string; // Admin UID who created the tracking
  lastUpdatedBy: string;
  
  // Additional Features
  isFragile: boolean;
  requiresSignature: boolean;
  insuranceAmount?: number;
  specialInstructions?: string;
  
  // Status History
  statusHistory: TrackingStatusUpdate[];
  
  // Notifications
  notificationPreferences: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  
  // Metadata
  tags?: string[];
  notes?: string;
  internalNotes?: string; // Admin-only notes
}

export interface TrackingStatusUpdate {
  id: string;
  status: TrackingStatus;
  timestamp: Timestamp;
  location?: {
    city: string;
    state?: string;
    country: string;
    facility?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  description: string;
  updatedBy: string; // Admin UID
  isPublic: boolean; // Whether this update is visible to end users
  notes?: string;
}

export enum TrackingStatus {
  PENDING = 'pending',
  LABEL_CREATED = 'label_created',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_DELIVERY = 'failed_delivery',
  RETURNED_TO_SENDER = 'returned_to_sender',
  CANCELLED = 'cancelled',
  EXCEPTION = 'exception',
  CUSTOMS_CLEARANCE = 'customs_clearance',
  DELAYED = 'delayed'
}

// Firestore Collection Structure
export const FIRESTORE_COLLECTIONS = {
  ADMIN_USERS: 'admin_users',
  ADMIN_SESSIONS: 'admin_sessions',
  ADMIN_AUDIT_LOGS: 'admin_audit_logs',
  ADMIN_PERMISSIONS: 'admin_permissions',
  TRACKING_ITEMS: 'tracking_items',
  TRACKING_STATUS_UPDATES: 'tracking_status_updates',
  TRACKING_NOTIFICATIONS: 'tracking_notifications'
} as const;

// Security Rules Helper Types
export interface AdminSecurityContext {
  uid: string;
  role: string;
  accessLevel: string;
  permissions: string[];
  ipAddress?: string;
  sessionId: string;
}

// Default Admin Permissions by Access Level
export const DEFAULT_ADMIN_PERMISSIONS: Record<string, AdminPermission[]> = {
  super_admin: [
    {
      resource: AdminResource.USERS,
      actions: [AdminAction.CREATE, AdminAction.READ, AdminAction.UPDATE, AdminAction.DELETE, AdminAction.LOCK, AdminAction.UNLOCK],
      grantedBy: 'system',
      grantedAt: Timestamp.now()
    },
    {
      resource: AdminResource.SYSTEM_SETTINGS,
      actions: [AdminAction.READ, AdminAction.UPDATE],
      grantedBy: 'system',
      grantedAt: Timestamp.now()
    },
    {
      resource: AdminResource.AUDIT_LOGS,
      actions: [AdminAction.READ, AdminAction.EXPORT],
      grantedBy: 'system',
      grantedAt: Timestamp.now()
    }
  ],
  admin: [
    {
      resource: AdminResource.USERS,
      actions: [AdminAction.READ, AdminAction.UPDATE],
      grantedBy: 'system',
      grantedAt: Timestamp.now()
    },
    {
      resource: AdminResource.TRACKING,
      actions: [AdminAction.CREATE, AdminAction.READ, AdminAction.UPDATE, AdminAction.DELETE],
      grantedBy: 'system',
      grantedAt: Timestamp.now()
    }
  ],
  limited_admin: [
    {
      resource: AdminResource.TRACKING,
      actions: [AdminAction.READ, AdminAction.UPDATE],
      grantedBy: 'system',
      grantedAt: Timestamp.now()
    }
  ]
};

// Validation helpers
export const validateAdminUser = (user: Partial<FirestoreAdminUser>): string[] => {
  const errors: string[] = [];
  
  if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Valid email is required');
  }
  
  if (!user.name || user.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!user.accessLevel || !['super_admin', 'admin', 'limited_admin'].includes(user.accessLevel)) {
    errors.push('Valid access level is required');
  }
  
  if (!user.permissions || user.permissions.length === 0) {
    errors.push('At least one permission is required');
  }
  
  return errors;
};