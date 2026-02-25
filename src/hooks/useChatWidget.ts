import { useState, useEffect, useCallback } from 'react';
import FirestoreChatService from '@/services/firestoreChatService';
import { FirestoreChatMessage, FirestoreChatConversation } from '@/lib/firestore-schema';

const STORAGE_KEY = 'chat_user_id';
const USER_NAME_KEY = 'chat_user_name';
const USER_EMAIL_KEY = 'chat_user_email';

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
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const chatService = FirestoreChatService.getInstance();

    // Load user info from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserId = localStorage.getItem(STORAGE_KEY);
            const storedUserName = localStorage.getItem(USER_NAME_KEY);
            const storedUserEmail = localStorage.getItem(USER_EMAIL_KEY);

            if (storedUserId && storedUserName && storedUserEmail) {
                setUserId(storedUserId);
                setUserName(storedUserName);
                setUserEmail(storedUserEmail);

                // Load existing conversation
                loadConversation(storedUserId);
            }
        }
    }, []);

    // Load conversation for returning user
    const loadConversation = async (userId: string) => {
        try {
            setIsLoading(true);
            const conversation = await chatService.getConversationByUserId(userId);

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
        try {
            setIsLoading(true);
            setError(null);

            const { conversation, userId: newUserId } = await chatService.createConversation({
                userName: name,
                userEmail: email,
                initialMessage
            });

            // Store user info in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, newUserId);
                localStorage.setItem(USER_NAME_KEY, name);
                localStorage.setItem(USER_EMAIL_KEY, email);
            }

            setUserId(newUserId);
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
    }, []);

    // Send message
    const sendMessage = useCallback(async (text: string) => {
        if (!conversationId || !userId || !userName) {
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
                senderId: userId
            });
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message. Please try again.');
            throw err;
        }
    }, [conversationId, userId, userName]);

    return {
        isOpen,
        setIsOpen,
        messages,
        isLoading,
        error,
        hasUserInfo: !!userId,
        sendMessage,
        initializeChat,
        unreadCount
    };
};
