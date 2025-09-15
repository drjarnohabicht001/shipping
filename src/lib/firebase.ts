import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v9-compat and later, measurementId is optional
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

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;