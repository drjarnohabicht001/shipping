import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "@/lib/firebase";

/**
 * Customer chat runs on its own Firebase app instance so a visitor session
 * never collides with the admin auth listener in AuthProvider (which signs
 * out anything that is not a registered admin).
 */
const CHAT_APP_NAME = "customer-chat";

export const chatApp = getApps().some((app) => app.name === CHAT_APP_NAME)
  ? getApp(CHAT_APP_NAME)
  : initializeApp(firebaseConfig, CHAT_APP_NAME);

export const chatAuth = getAuth(chatApp);
export const chatDb = getFirestore(chatApp);

setPersistence(chatAuth, browserLocalPersistence).catch((error) => {
  console.error("Failed to configure chat auth persistence:", error);
});
