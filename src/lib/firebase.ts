import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v9-compat and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWOZ0IO4nmPOPj_-wt-CC8JIwz3yX9_NI",
  authDomain: "test-e12ce.firebaseapp.com",
  projectId: "test-e12ce",
  storageBucket: "test-e12ce.firebasestorage.app",
  messagingSenderId: "93491215580",
  appId: "1:93491215580:web:40cc63c67a9eacc530c819",
  measurementId: "G-CPVK6T9VGN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;