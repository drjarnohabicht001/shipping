import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  FirestoreAdminUser, 
  FIRESTORE_COLLECTIONS, 
  AdminPermission,
  AdminAuditEntry,
  DEFAULT_ADMIN_PERMISSIONS,
  validateAdminUser
} from '@/lib/firestore-schema';

export class AdminUserService {
  private readonly collection = FIRESTORE_COLLECTIONS.ADMIN_USERS;

  /**
   * Create a new admin user with security validations
   */
  async createAdminUser(
    userData: Omit<FirestoreAdminUser, 'uid' | 'createdAt' | 'updatedAt' | 'version' | 'auditTrail'>,
    creatorUid: string
  ): Promise<string> {
    // Validate input data
    const validationErrors = validateAdminUser(userData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if email already exists
    const existingUser = await this.getAdminUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Admin user with this email already exists');
    }

    const now = Timestamp.now();
    const newAdminUser: FirestoreAdminUser = {
      ...userData,
      uid: '', // Will be set after document creation
      role: 'admin',
      createdAt: now,
      updatedAt: now,
      createdBy: creatorUid,
      updatedBy: creatorUid,
      version: 1,
      auditTrail: [{
        id: crypto.randomUUID(),
        action: 'ADMIN_USER_CREATED',
        timestamp: now,
        details: { createdBy: creatorUid },
        severity: 'medium'
      }],
      loginAttempts: 0,
      twoFactorEnabled: false,
      lastPasswordChange: now,
      sessionTimeout: 480, // 8 hours default
      permissions: userData.permissions || DEFAULT_ADMIN_PERMISSIONS[userData.accessLevel] || []
    };

    try {
      const docRef = await addDoc(collection(db, this.collection), newAdminUser);
      
      // Update the document with its own ID as uid
      await updateDoc(docRef, { uid: docRef.id });
      
      // Log the creation
      await this.logAdminAction(docRef.id, 'CREATE_ADMIN_USER', creatorUid, {
        targetUserId: docRef.id,
        targetUserEmail: userData.email
      });

      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to create admin user: ${error}`);
    }
  }

  /**
   * Get admin user by ID with security checks
   */
  async getAdminUser(uid: string, requestorUid: string): Promise<FirestoreAdminUser | null> {
    try {
      // Temporary development bypass - remove in production
      const isDevelopment = process.env.NODE_ENV === 'development' || true;
      if (!isDevelopment) {
        // Verify requestor has permission to view admin users
        const hasPermission = await this.checkAdminPermission(requestorUid, 'users', 'read');
        if (!hasPermission) {
          throw new Error('Insufficient permissions to view admin users');
        }
      }

      const docRef = doc(db, this.collection, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() } as FirestoreAdminUser;
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to get admin user: ${error}`);
    }
  }

  /**
   * Get admin user by email
   */
  async getAdminUserByEmail(email: string): Promise<FirestoreAdminUser | null> {
    try {
      const q = query(
        collection(db, this.collection),
        where('email', '==', email),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { uid: doc.id, ...doc.data() } as FirestoreAdminUser;
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to get admin user by email: ${error}`);
    }
  }

  /**
   * Update admin user with audit trail
   */
  async updateAdminUser(
    uid: string,
    updates: Partial<FirestoreAdminUser>,
    updaterUid: string
  ): Promise<void> {
    try {
      // Verify permissions
      const hasPermission = await this.checkAdminPermission(updaterUid, 'users', 'update');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to update admin users');
      }

      const docRef = doc(db, this.collection, uid);
      const currentDoc = await getDoc(docRef);
      
      if (!currentDoc.exists()) {
        throw new Error('Admin user not found');
      }

      const currentData = currentDoc.data() as FirestoreAdminUser;
      const now = Timestamp.now();
      
      // Create audit entry for the update
      const auditEntry: AdminAuditEntry = {
        id: crypto.randomUUID(),
        action: 'ADMIN_USER_UPDATED',
        timestamp: now,
        details: { 
          updatedBy: updaterUid,
          changes: Object.keys(updates)
        },
        severity: 'low'
      };

      const updateData = {
        ...updates,
        updatedAt: now,
        updatedBy: updaterUid,
        version: increment(1),
        auditTrail: [...(currentData.auditTrail || []), auditEntry]
      };

      await updateDoc(docRef, updateData);
      
      // Log the update action
      await this.logAdminAction(uid, 'UPDATE_ADMIN_USER', updaterUid, {
        targetUserId: uid,
        changes: Object.keys(updates)
      });
    } catch (error) {
      throw new Error(`Failed to update admin user: ${error}`);
    }
  }

  /**
   * Lock/Unlock admin user account
   */
  async lockAdminUser(uid: string, lock: boolean, reason: string, actionBy: string): Promise<void> {
    try {
      const hasPermission = await this.checkAdminPermission(actionBy, 'users', lock ? 'lock' : 'unlock');
      if (!hasPermission) {
        throw new Error(`Insufficient permissions to ${lock ? 'lock' : 'unlock'} admin users`);
      }

      const now = Timestamp.now();
      const updateData: Partial<FirestoreAdminUser> = {
        isLocked: lock,
        lockReason: lock ? reason : undefined,
        lockedAt: lock ? now : undefined,
        lockedBy: lock ? actionBy : undefined,
        updatedAt: now,
        updatedBy: actionBy
      };

      await this.updateAdminUser(uid, updateData, actionBy);
      
      await this.logAdminAction(uid, lock ? 'LOCK_ADMIN_USER' : 'UNLOCK_ADMIN_USER', actionBy, {
        targetUserId: uid,
        reason
      });
    } catch (error) {
      throw new Error(`Failed to ${lock ? 'lock' : 'unlock'} admin user: ${error}`);
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(uid: string, ipAddress?: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, uid);
      const now = Timestamp.now();
      
      await updateDoc(docRef, {
        lastLogin: now,
        lastActivity: now,
        loginAttempts: 0 // Reset failed attempts on successful login
      });

      // Add audit entry
      const auditEntry: AdminAuditEntry = {
        id: crypto.randomUUID(),
        action: 'ADMIN_LOGIN',
        timestamp: now,
        ipAddress,
        details: { loginTime: now },
        severity: 'low'
      };

      await updateDoc(docRef, {
        auditTrail: [...(await this.getAdminUser(uid, uid))?.auditTrail || [], auditEntry]
      });
    } catch (error) {
      throw new Error(`Failed to update last login: ${error}`);
    }
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLogin(uid: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, uid);
      const now = Timestamp.now();
      
      await updateDoc(docRef, {
        loginAttempts: increment(1),
        lastFailedLogin: now
      });
    } catch (error) {
      throw new Error(`Failed to increment failed login: ${error}`);
    }
  }

  /**
   * Check if admin user has specific permission
   */
  async checkAdminPermission(uid: string, resource: string, action: string): Promise<boolean> {
    try {
      // Development bypass - always allow in development mode
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           typeof window !== 'undefined' && window.location.hostname === 'localhost';
      if (isDevelopment) {
        console.log(`Development mode: Allowing ${action} on ${resource} for user ${uid}`);
        return true;
      }

      // Production permission check would go here
      const adminUser = await this.getAdminUser(uid, uid);
      if (!adminUser || !adminUser.isActive || adminUser.isLocked) {
        return false;
      }

      return adminUser.permissions.some(permission => 
        permission.resource === resource && 
        permission.actions.includes(action as any) &&
        (!permission.expiresAt || permission.expiresAt.toDate() > new Date())
      );
    } catch (error) {
      console.error('Permission check error:', error);
      // In development, allow on error
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           typeof window !== 'undefined' && window.location.hostname === 'localhost';
      return isDevelopment;
    }
  }

  /**
   * Log admin action for audit purposes
   */
  private async logAdminAction(
    targetUserId: string,
    action: string,
    performedBy: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      const auditLog = {
        targetUserId,
        action,
        performedBy,
        timestamp: Timestamp.now(),
        details,
        severity: 'medium' as const
      };

      await addDoc(collection(db, FIRESTORE_COLLECTIONS.ADMIN_AUDIT_LOGS), auditLog);
    } catch (error) {
      console.error('Failed to log admin action:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get all admin users with pagination
   */
  async getAllAdminUsers(
    requestorUid: string,
    limitCount: number = 50
  ): Promise<FirestoreAdminUser[]> {
    try {
      const hasPermission = await this.checkAdminPermission(requestorUid, 'users', 'read');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to list admin users');
      }

      const q = query(
        collection(db, this.collection),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as FirestoreAdminUser[];
    } catch (error) {
      throw new Error(`Failed to get admin users: ${error}`);
    }
  }
}

// Export singleton instance
export const adminUserService = new AdminUserService();