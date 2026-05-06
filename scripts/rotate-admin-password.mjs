import { randomBytes } from 'crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const TARGET_EMAIL = process.env.ROTATE_ADMIN_EMAIL;
const TARGET_UID = process.env.ROTATE_ADMIN_UID;
const EXPLICIT_PASSWORD = process.env.ROTATE_ADMIN_PASSWORD;

function getPrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
}

function generateStrongPassword(length = 32) {
  return randomBytes(length).toString('base64url').slice(0, length);
}

async function rotateAdminPassword() {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = getPrivateKey();

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase Admin SDK credentials in environment.');
    }

    if (!TARGET_EMAIL && !TARGET_UID) {
      throw new Error('Set ROTATE_ADMIN_EMAIL or ROTATE_ADMIN_UID.');
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
    const password = EXPLICIT_PASSWORD || generateStrongPassword(28);
    const userRecord = TARGET_UID
      ? await auth.getUser(TARGET_UID)
      : await auth.getUserByEmail(TARGET_EMAIL);

    await auth.updateUser(userRecord.uid, { password });
    await auth.revokeRefreshTokens(userRecord.uid);

    await db.collection('admin_users').doc(userRecord.uid).set(
      {
        mustChangePassword: true,
        lastPasswordChange: Timestamp.now(),
        passwordRotationDueAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: Timestamp.now(),
        updatedBy: 'system-password-rotation',
      },
      { merge: true }
    );

    await db
      .collection('admin_sessions')
      .where('userId', '==', userRecord.uid)
      .get()
      .then((snapshot) =>
        Promise.all(
          snapshot.docs.map((sessionDoc) =>
            sessionDoc.ref.set(
              {
                status: 'revoked',
                terminatedAt: Timestamp.now(),
              },
              { merge: true }
            )
          )
        )
      );

    console.log('');
    console.log(`Password rotated for ${userRecord.email}`);
    console.log(`UID: ${userRecord.uid}`);
    console.log(`New Password: ${password}`);
    console.log('This password is shown once. Store it securely and force the admin to change it at next login.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to rotate admin password:', error);
    process.exit(1);
  }
}

rotateAdminPassword();
