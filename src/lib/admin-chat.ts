import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import {
  FIRESTORE_COLLECTIONS,
  FirestoreChatConversation,
  FirestoreChatMessage,
} from "@/lib/firestore-schema";

export async function listAdminConversations() {
  const snapshot = await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS)
    .orderBy("updatedAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FirestoreChatConversation[];
}

export async function listConversationMessages(conversationId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.CHAT_MESSAGES)
    .where("conversationId", "==", conversationId)
    .orderBy("timestamp", "asc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FirestoreChatMessage[];
}

export async function sendAdminConversationMessage(input: {
  conversationId: string;
  text: string;
  senderId: string;
  senderName: string;
}) {
  const now = Timestamp.now();
  const messageTimestamp = now as unknown as FirestoreChatMessage["timestamp"];
  const conversationTimestamp =
    now as unknown as FirestoreChatConversation["updatedAt"];
  const messageData: Omit<FirestoreChatMessage, "id"> = {
    conversationId: input.conversationId,
    text: input.text,
    sender: "admin",
    senderName: input.senderName,
    senderId: input.senderId,
    isRead: false,
    timestamp: messageTimestamp,
  };

  const docRef = await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.CHAT_MESSAGES)
    .add(messageData);

  await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS)
    .doc(input.conversationId)
    .set(
      {
        lastMessage: {
          text: input.text,
          timestamp: messageTimestamp,
          sender: "admin",
        },
        unreadByUser: (await getFirebaseAdminDb()
          .collection(FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS)
          .doc(input.conversationId)
          .get()).data()?.unreadByUser + 1 || 1,
        updatedAt: conversationTimestamp,
      },
      { merge: true }
    );

  return {
    id: docRef.id,
    ...messageData,
  } as FirestoreChatMessage;
}

export async function markConversationReadAsAdmin(conversationId: string) {
  const messagesSnap = await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.CHAT_MESSAGES)
    .where("conversationId", "==", conversationId)
    .where("isRead", "==", false)
    .where("sender", "==", "user")
    .get();

  const batch = getFirebaseAdminDb().batch();
  messagesSnap.docs.forEach((doc) => {
    batch.update(doc.ref, { isRead: true });
  });

  batch.set(
    getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS)
      .doc(conversationId),
    {
      unreadByAdmin: 0,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  await batch.commit();
}

export async function updateAdminConversationStatus(
  conversationId: string,
  status: "active" | "resolved" | "archived"
) {
  await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS)
    .doc(conversationId)
    .set(
      {
        status,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
}
