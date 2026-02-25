
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAWOZ0IO4nmPOPj_-wt-CC8JIwz3yX9_NI",
  authDomain: "test-e12ce.firebaseapp.com",
  projectId: "test-e12ce",
  storageBucket: "test-e12ce.firebasestorage.app",
  messagingSenderId: "93491215580",
  appId: "1:93491215580:web:40cc63c67a9eacc530c819",
  measurementId: "G-CPVK6T9VGN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const ADMIN_EMAIL = 'admin@shipping.com';
const ADMIN_PASSWORD = 'admin123';

const SUPER_ADMIN_PERMISSIONS = [
    {
      resource: 'users',
      actions: ['create', 'read', 'update', 'delete', 'lock', 'unlock'],
      grantedBy: 'system',
      grantedAt: Timestamp.now()
    },
    {
      resource: 'system_settings',
      actions: ['read', 'update'],
      grantedBy: 'system',
      grantedAt: Timestamp.now()
    },
    {
      resource: 'audit_logs',
      actions: ['read', 'export'],
      grantedBy: 'system',
      grantedAt: Timestamp.now()
    }
];

async function seedAdmin() {
  try {
    console.log('Creating Admin User in Firebase Auth...');
    let uid;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        uid = userCredential.user.uid;
        console.log('User created with UID:', uid);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('User already exists in Auth. Retrying login or skipping...');
            // In a real script we might want to sign in to get the UID, 
            // but for seeding we can't easily get the UID of an existing user without Admin SDK.
            // However, we can try to sign in to get the UID.
            // For now, let's assume we can't proceed if user exists but we don't know the password or UID.
            // Actually, we can just throw.
            console.error('Error: User already exists. Please verify manually or delete the user from Firebase Console.');
            process.exit(1);
        } else {
            throw error;
        }
    }

    const now = Timestamp.now();

    const adminUserData = {
      uid: uid,
      email: ADMIN_EMAIL,
      name: 'Super Admin',
      role: 'admin',
      accessLevel: 'super_admin',
      isActive: true, // Auto-activate
      isLocked: false,
      emailVerified: true,
      twoFactorEnabled: false,
      lastPasswordChange: now,
      permissions: SUPER_ADMIN_PERMISSIONS,
      sessionTimeout: 480,
      createdAt: now,
      createdBy: 'system',
      updatedAt: now,
      updatedBy: 'system',
      version: 1,
      loginAttempts: 0,
      auditTrail: [{
        id: 'init-seed',
        action: 'ADMIN_USER_CREATED',
        timestamp: now,
        details: { createdBy: 'system', method: 'seed_script' },
        severity: 'medium'
      }]
    };

    console.log('Creating Admin User document in Firestore...');
    await setDoc(doc(db, 'admin_users', uid), adminUserData);
    
    console.log('Successfully seeded admin user!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
