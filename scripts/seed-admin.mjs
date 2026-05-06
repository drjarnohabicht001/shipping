import { randomBytes } from 'crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'System Administrator';
const ACCESS_LEVEL = process.env.SEED_ADMIN_ACCESS_LEVEL || 'system_admin';
const EXPLICIT_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

function getPrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
}

function generateStrongPassword(length = 32) {
  return randomBytes(length).toString('base64url').slice(0, length);
}

function getAdminPermissions(now) {
  return [
    {
      resource: 'users',
      actions: ['create', 'read', 'update', 'delete', 'manage', 'lock', 'unlock'],
      grantedBy: 'system',
      grantedAt: now
    },
    {
      resource: 'security',
      actions: ['read', 'update', 'manage'],
      grantedBy: 'system',
      grantedAt: now
    },
    {
      resource: 'sessions',
      actions: ['read', 'delete', 'manage'],
      grantedBy: 'system',
      grantedAt: now
    },
    {
      resource: 'logins',
      actions: ['read', 'export'],
      grantedBy: 'system',
      grantedAt: now
    },
    {
      resource: 'settings',
      actions: ['read', 'update'],
      grantedBy: 'system',
      grantedAt: now
    },
    {
      resource: 'audit',
      actions: ['read', 'export'],
      grantedBy: 'system',
      grantedAt: now
    },
    {
      resource: 'tracking',
      actions: ['create', 'read', 'update', 'delete'],
      grantedBy: 'system',
      grantedAt: now
    },
    {
      resource: 'quotes',
      actions: ['create', 'read', 'update', 'delete'],
      grantedBy: 'system',
      grantedAt: now
    },
    {
      resource: 'messages',
      actions: ['read', 'update'],
      grantedBy: 'system',
      grantedAt: now
    }
  ];
}

async function seedAdmin() {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = getPrivateKey();

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase Admin SDK credentials in environment.');
    }

    if (!ADMIN_EMAIL) {
      throw new Error('Missing SEED_ADMIN_EMAIL environment variable.');
    }

    const app =
      getApps()[0] ||
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

    const auth = getAuth(app);
    const db = getFirestore(app);
    const now = Timestamp.now();
    const password = EXPLICIT_PASSWORD || generateStrongPassword(28);

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
      await auth.updateUser(userRecord.uid, {
        password,
        displayName: ADMIN_NAME,
        emailVerified: true,
        disabled: false,
      });
      console.log(`Updated existing Firebase Auth admin: ${ADMIN_EMAIL}`);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }

      userRecord = await auth.createUser({
        email: ADMIN_EMAIL,
        password,
        displayName: ADMIN_NAME,
        emailVerified: true,
        disabled: false,
      });
      console.log(`Created Firebase Auth admin: ${ADMIN_EMAIL}`);
    }

    await auth.revokeRefreshTokens(userRecord.uid);

    const adminUserData = {
      uid: userRecord.uid,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: 'admin',
      accessLevel: ACCESS_LEVEL,
      isActive: true,
      isLocked: false,
      emailVerified: true,
      twoFactorEnabled: false,
      mustChangePassword: true,
      mfaRequired: true,
      lastPasswordChange: now,
      passwordRotationDueAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
      permissions: getAdminPermissions(now),
      sessionTimeout: 60,
      createdAt: now,
      createdBy: 'system',
      updatedAt: now,
      updatedBy: 'system',
      version: 1,
      loginAttempts: 0,
      auditTrail: [{
        id: `seed-${Date.now()}`,
        action: 'ADMIN_USER_CREATED',
        timestamp: now,
        details: { createdBy: 'system', method: 'admin_sdk_seed' },
        severity: 'high'
      }]
    };

    await db.collection('admin_users').doc(userRecord.uid).set(adminUserData, { merge: true });

    console.log('');
    console.log('System admin seeded successfully.');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`UID: ${userRecord.uid}`);
    console.log(`Access Level: ${ACCESS_LEVEL}`);
    console.log(`Generated Password: ${password}`);
    console.log('This password is shown once. Store it securely and rotate it after first login.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
