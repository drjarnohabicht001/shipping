const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

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
getFirestore(app);

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
    throw new Error(
      'Deprecated insecure script. Use scripts/seed-admin.mjs with environment variables and Firebase Auth bootstrap instead.'
    );
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
