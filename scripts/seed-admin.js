const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVO_zEfdNOyH0dygdMmphL1mc3Q7vmqo4",
  authDomain: "test-15b4b.firebaseapp.com",
  projectId: "test-15b4b",
  storageBucket: "test-15b4b.firebasestorage.app",
  messagingSenderId: "944760105458",
  appId: "1:944760105458:web:89f880684cbb6a2b69a36b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Default permissions for super admin
const DEFAULT_SUPER_ADMIN_PERMISSIONS = [
  {
    resource: 'USERS',
    actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    grantedBy: 'system',
    grantedAt: Timestamp.now()
  },
  {
    resource: 'TRACKING',
    actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    grantedBy: 'system',
    grantedAt: Timestamp.now()
  },
  {
    resource: 'AUDIT',
    actions: ['READ'],
    grantedBy: 'system',
    grantedAt: Timestamp.now()
  }
];

async function createSeedAdmin() {
  try {
    console.log('Creating seed admin user...');

    const now = Timestamp.now();
    const seedAdminData = {
      uid: '', // Will be set after document creation
      email: 'admin@shipping.com',
      name: 'System Administrator',
      role: 'admin',
      accessLevel: 'super_admin',
      emailVerified: true,
      twoFactorEnabled: false,
      lastPasswordChange: now,
      permissions: DEFAULT_SUPER_ADMIN_PERMISSIONS,
      sessionTimeout: 480, // 8 hours
      isActive: true,
      isLocked: false,
      loginAttempts: 0,
      department: 'IT',
      jobTitle: 'System Administrator',
      employeeId: 'SYS001',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      updatedBy: 'system',
      version: 1,
      auditTrail: [{
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
        action: 'ADMIN_USER_CREATED',
        timestamp: now,
        details: { createdBy: 'system', reason: 'Initial seed admin' },
        severity: 'medium'
      }]
    };

    // Create the document
    const docRef = await addDoc(collection(db, 'admin_users'), seedAdminData);
    
    // Update with the document ID as uid
    const { updateDoc, doc } = require('firebase/firestore');
    await updateDoc(doc(db, 'admin_users', docRef.id), { uid: docRef.id });
    
    console.log('✅ Seed admin user created successfully!');
    console.log('📧 Email: admin@shipping.com');
    console.log('🆔 UID:', docRef.id);
    console.log('🔑 Access Level: super_admin');
    console.log('');
    console.log('You can now use this admin user to create other admin users through the UI.');
    
  } catch (error) {
    console.error('❌ Error creating seed admin:', error);
  }
}

// Run the seed function
createSeedAdmin().then(() => {
  console.log('Seed script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});