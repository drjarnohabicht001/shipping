import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    increment,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    FirestoreChatConversation,
    FirestoreChatMessage,
    FIRESTORE_COLLECTIONS
} from '@/lib/firestore-schema';

export interface CreateConversationRequest {
    userName: string;
    userEmail: string;
    initialMessage: string;
    participantUid: string;
}

export interface SendMessageRequest {
    conversationId: string;
    text: string;
    sender: 'user' | 'admin';
    senderName: string;
    senderId: string;
}

class FirestoreChatService {
    private static instance: FirestoreChatService;
    private chatCounterDoc = 'chat_counter';

    private constructor() { }

    public static getInstance(): FirestoreChatService {
        if (!FirestoreChatService.instance) {
            FirestoreChatService.instance = new FirestoreChatService();
        }
        return FirestoreChatService.instance;
    }

    /**
     * Generate a unique user ID for chat
     */
    private generateUserId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 9);
        return `USER-${timestamp}-${random}`.toUpperCase();
    }

    /**
     * Generate a unique conversation ID with format: CHAT-YYYY-XXXXXX
     */
    private async generateConversationId(): Promise<string> {
        const year = new Date().getFullYear();
        const counterRef = doc(db, 'system_counters', this.chatCounterDoc);

        try {
            const counterDoc = await getDoc(counterRef);
            let nextNumber = 1;

            if (counterDoc.exists()) {
                nextNumber = (counterDoc.data().value || 0) + 1;
            }

            await updateDoc(counterRef, {
                value: increment(1),
                lastUpdated: Timestamp.now()
            });

            const paddedNumber = nextNumber.toString().padStart(6, '0');
            return `CHAT-${year}-${paddedNumber}`;
        } catch (error) {
            // Fallback to timestamp-based ID if counter fails
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `CHAT-${year}-${timestamp}${random}`;
        }
    }

    /**
     * Check if a conversation exists for a user
     */
    async getConversationByParticipantUid(participantUid: string): Promise<FirestoreChatConversation | null> {
        try {
            const q = query(
                collection(db, FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS),
                where('participantUid', '==', participantUid),
                limit(1)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return null;
            }

            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            } as FirestoreChatConversation;
        } catch (error) {
            console.error('Error getting conversation by participant UID:', error);
            return null;
        }
    }

    /**
     * Create a new conversation
     */
    async createConversation(request: CreateConversationRequest): Promise<{
        conversation: FirestoreChatConversation;
        userId: string;
    }> {
        try {
            const conversationId = await this.generateConversationId();
            const userId = this.generateUserId();
            const now = Timestamp.now();

            const conversationData: Omit<FirestoreChatConversation, 'id'> = {
                conversationId,
                participantUid: request.participantUid,
                user: {
                    name: request.userName,
                    email: request.userEmail,
                    userId
                },
                status: 'active',
                lastMessage: {
                    text: request.initialMessage,
                    timestamp: now,
                    sender: 'user'
                },
                unreadByAdmin: 1,
                unreadByUser: 0,
                createdAt: now,
                updatedAt: now
            };

            const docRef = await addDoc(
                collection(db, FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS),
                conversationData
            );

            // Create the initial message
            const messageData: Omit<FirestoreChatMessage, 'id'> = {
                conversationId: docRef.id,
                text: request.initialMessage,
                sender: 'user',
                senderName: request.userName,
                senderId: userId,
                isRead: false,
                timestamp: now
            };

            await addDoc(
                collection(db, FIRESTORE_COLLECTIONS.CHAT_MESSAGES),
                messageData
            );

            return {
                conversation: {
                    id: docRef.id,
                    ...conversationData
                },
                userId
            };
        } catch (error) {
            console.error('Error creating conversation:', error);
            // Throw the original error or a more descriptive one including the cause
            throw error instanceof Error ? error : new Error(String(error));
        }
    }

    /**
     * Send a message in a conversation
     */
    async sendMessage(request: SendMessageRequest): Promise<FirestoreChatMessage> {
        try {
            const now = Timestamp.now();

            const messageData: Omit<FirestoreChatMessage, 'id'> = {
                conversationId: request.conversationId,
                text: request.text,
                sender: request.sender,
                senderName: request.senderName,
                senderId: request.senderId,
                isRead: false,
                timestamp: now
            };

            const docRef = await addDoc(
                collection(db, FIRESTORE_COLLECTIONS.CHAT_MESSAGES),
                messageData
            );

            // Update conversation's last message and unread count
            const conversationRef = doc(db, FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS, request.conversationId);
            const updateData: any = {
                lastMessage: {
                    text: request.text,
                    timestamp: now,
                    sender: request.sender
                },
                updatedAt: now
            };

            if (request.sender === 'user') {
                updateData.unreadByAdmin = increment(1);
            } else {
                updateData.unreadByUser = increment(1);
            }

            await updateDoc(conversationRef, updateData);

            return {
                id: docRef.id,
                ...messageData
            };
        } catch (error) {
            console.error('Error sending message:', error);
            throw new Error('Failed to send message');
        }
    }

    /**
     * Get all messages for a conversation
     */
    async getMessages(conversationId: string): Promise<FirestoreChatMessage[]> {
        try {
            const q = query(
                collection(db, FIRESTORE_COLLECTIONS.CHAT_MESSAGES),
                where('conversationId', '==', conversationId),
                orderBy('timestamp', 'asc')
            );

            const querySnapshot = await getDocs(q);
            const messages: FirestoreChatMessage[] = [];

            querySnapshot.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                } as FirestoreChatMessage);
            });

            return messages;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time messages for a conversation
     */
    subscribeToMessages(
        conversationId: string,
        callback: (messages: FirestoreChatMessage[]) => void
    ): () => void {
        const q = query(
            collection(db, FIRESTORE_COLLECTIONS.CHAT_MESSAGES),
            where('conversationId', '==', conversationId),
            orderBy('timestamp', 'asc')
        );

        return onSnapshot(q, (querySnapshot) => {
            const messages: FirestoreChatMessage[] = [];

            querySnapshot.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                } as FirestoreChatMessage);
            });

            callback(messages);
        }, (error) => {
            console.error('Error in messages subscription:', error);
            callback([]);
        });
    }

    /**
     * Get all conversations (for admin)
     */
    async getAllConversations(): Promise<FirestoreChatConversation[]> {
        try {
            const q = query(
                collection(db, FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS),
                orderBy('updatedAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const conversations: FirestoreChatConversation[] = [];

            querySnapshot.forEach((doc) => {
                conversations.push({
                    id: doc.id,
                    ...doc.data()
                } as FirestoreChatConversation);
            });

            return conversations;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time conversations (for admin)
     */
    subscribeToConversations(
        callback: (conversations: FirestoreChatConversation[]) => void
    ): () => void {
        const q = query(
            collection(db, FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS),
            orderBy('updatedAt', 'desc')
        );

        return onSnapshot(q, (querySnapshot) => {
            const conversations: FirestoreChatConversation[] = [];

            querySnapshot.forEach((doc) => {
                conversations.push({
                    id: doc.id,
                    ...doc.data()
                } as FirestoreChatConversation);
            });

            callback(conversations);
        }, (error) => {
            console.error('Error in conversations subscription:', error);
            callback([]);
        });
    }

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(conversationId: string, readBy: 'user' | 'admin'): Promise<void> {
        try {
            const batch = writeBatch(db);

            // Get all unread messages
            const q = query(
                collection(db, FIRESTORE_COLLECTIONS.CHAT_MESSAGES),
                where('conversationId', '==', conversationId),
                where('isRead', '==', false),
                where('sender', '==', readBy === 'admin' ? 'user' : 'admin')
            );

            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, { isRead: true });
            });

            // Reset unread count in conversation
            const conversationRef = doc(db, FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS, conversationId);
            const updateData = readBy === 'admin'
                ? { unreadByAdmin: 0 }
                : { unreadByUser: 0 };

            batch.update(conversationRef, updateData);

            await batch.commit();
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }

    /**
     * Update conversation status
     */
    async updateConversationStatus(
        conversationId: string,
        status: 'active' | 'resolved' | 'archived'
    ): Promise<void> {
        try {
            const conversationRef = doc(db, FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS, conversationId);
            await updateDoc(conversationRef, {
                status,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error('Error updating conversation status:', error);
            throw error;
        }
    }
}

export default FirestoreChatService;
