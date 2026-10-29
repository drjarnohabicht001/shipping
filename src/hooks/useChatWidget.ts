import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import FirestoreChatService from '@/services/firestoreChatService';
import { FirestoreChatMessage } from '@/lib/firestore-schema';
import { chatAuth, chatDb } from '@/lib/firebase-chat';

const USER_NAME_KEY = 'chat_user_name';
const USER_EMAIL_KEY = 'chat_user_email';
const CLIENT_ID_KEY = 'chat_client_id';
const CHAT_UNAVAILABLE_MESSAGE = 'Chat is temporarily unavailable right now.';

function isAuthUnavailable(error: unknown) {
    return typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'auth/admin-restricted-operation';
}

function getClientId(): string {
    const stored = localStorage.getItem(CLIENT_ID_KEY);
    if (stored) return stored;

    const generated =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
    localStorage.setItem(CLIENT_ID_KEY, generated);
    return generated;
}

/**
 * Swap the browser's random chat client id for a Firebase session token.
 * Anonymous sign-in is disabled on the project, so identity is issued
 * server-side and the visitor never has to sign up.
 */
async function signInForChat() {
    const response = await fetch('/api/chat/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: getClientId() }),
    });

    if (!response.ok) {
        throw new Error('Unable to start chat right now.');
    }

    const { token } = (await response.json()) as { token?: string };
    if (!token) {
        throw new Error('Unable to start chat right now.');
    }

    return signInWithCustomToken(chatAuth, token);
}

export interface UseChatWidgetResult {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    messages: FirestoreChatMessage[];
    isLoading: boolean;
    error: string | null;
    hasUserInfo: boolean;
    sendMessage: (text: string) => Promise<void>;
    initializeChat: (name: string, email: string, initialMessage: string) => Promise<void>;
    unreadCount: number;
}

export const useChatWidget = (): UseChatWidgetResult => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<FirestoreChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [participantUid, setParticipantUid] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatUnavailable, setChatUnavailable] = useState(false);

    const chatService = FirestoreChatService.getInstance(chatDb);
    const signInStartedRef = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(chatAuth, async (firebaseUser) => {
            if (!firebaseUser) {
                // Signing in fires this listener again with the new user.
                if (signInStartedRef.current) return;
                signInStartedRef.current = true;

                try {
                    await signInForChat();
                } catch (err) {
                    signInStartedRef.current = false;

                    if (isAuthUnavailable(err)) {
                        setChatUnavailable(true);
                        setParticipantUid(null);
                        setError(CHAT_UNAVAILABLE_MESSAGE);
                        return;
                    }

                    console.error('Error preparing chat identity:', err);
                    setError('Unable to initialize secure chat right now.');
                }
                return;
            }

            signInStartedRef.current = false;

            try {
                setChatUnavailable(false);
                setParticipantUid(firebaseUser.uid);

                if (typeof window !== 'undefined') {
                    const storedUserName = localStorage.getItem(USER_NAME_KEY);
                    const storedUserEmail = localStorage.getItem(USER_EMAIL_KEY);

                    if (storedUserName) {
                        setUserName(storedUserName);
                    }

                    if (storedUserEmail) {
                        setUserEmail(storedUserEmail);
                    }
                }

                await loadConversation(firebaseUser.uid);
            } catch (err) {
                console.error('Error preparing chat identity:', err);
                setError('Unable to initialize secure chat right now.');
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserName = localStorage.getItem(USER_NAME_KEY);
            const storedUserEmail = localStorage.getItem(USER_EMAIL_KEY);

            if (storedUserName && storedUserEmail) {
                setUserName(storedUserName);
                setUserEmail(storedUserEmail);
            }
        }
    }, []);

    // Load conversation for returning user
    const loadConversation = async (uid: string) => {
        try {
            setIsLoading(true);
            const conversation = await chatService.getConversationByParticipantUid(uid);

            if (conversation) {
                setConversationId(conversation.id);
                // Messages will be loaded via subscription
            }
        } catch (err) {
            console.error('Error loading conversation:', err);
            setError('Failed to load conversation');
        } finally {
            setIsLoading(false);
        }
    };

    // Subscribe to messages when conversation is set
    useEffect(() => {
        if (!conversationId) return;

        const unsubscribe = chatService.subscribeToMessages(conversationId, (newMessages) => {
            setMessages(newMessages);

            // Count unread messages from admin
            if (!isOpen) {
                const unread = newMessages.filter(msg => msg.sender === 'admin' && !msg.isRead).length;
                setUnreadCount(unread);
            }
        });

        return () => unsubscribe();
    }, [conversationId, isOpen]);

    // Mark messages as read when chat is opened
    useEffect(() => {
        if (isOpen && conversationId && unreadCount > 0) {
            chatService.markMessagesAsRead(conversationId, 'user').catch(err => {
                console.error('Error marking messages as read:', err);
            });
            setUnreadCount(0);
        }
    }, [isOpen, conversationId, unreadCount]);

    // Initialize chat for new user
    const initializeChat = useCallback(async (name: string, email: string, initialMessage: string) => {
        if (chatUnavailable || !participantUid) {
            setError(CHAT_UNAVAILABLE_MESSAGE);
            throw new Error(CHAT_UNAVAILABLE_MESSAGE);
        }

        try {
            setIsLoading(true);
            setError(null);

            const { conversation, userId: newUserId } = await chatService.createConversation({
                userName: name,
                userEmail: email,
                initialMessage,
                participantUid: participantUid!,
            });

            // Store user info in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(USER_NAME_KEY, name);
                localStorage.setItem(USER_EMAIL_KEY, email);
            }

            setUserName(name);
            setUserEmail(email);
            setConversationId(conversation.id);
        } catch (err) {
            console.error('Error initializing chat:', err);
            setError(err instanceof Error ? err.message : 'Failed to start chat');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [chatUnavailable, participantUid]);

    // Send message
    const sendMessage = useCallback(async (text: string) => {
        if (chatUnavailable) {
            setError(CHAT_UNAVAILABLE_MESSAGE);
            throw new Error(CHAT_UNAVAILABLE_MESSAGE);
        }

        if (!conversationId || !participantUid || !userName) {
            setError('Chat not initialized');
            return;
        }

        try {
            setError(null);
            await chatService.sendMessage({
                conversationId,
                text,
                sender: 'user',
                senderName: userName,
                senderId: participantUid
            });
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message. Please try again.');
            throw err;
        }
    }, [chatUnavailable, conversationId, participantUid, userName]);

    return {
        isOpen,
        setIsOpen,
        messages,
        isLoading,
        error,
        hasUserInfo: !!participantUid && !!userName && !!userEmail,
        sendMessage,
        initializeChat,
        unreadCount
    };
};
