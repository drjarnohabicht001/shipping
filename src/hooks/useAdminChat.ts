import { useState, useEffect, useCallback } from 'react';
import FirestoreChatService from '@/services/firestoreChatService';
import { FirestoreChatMessage, FirestoreChatConversation } from '@/lib/firestore-schema';
import { useAuth } from '@/contexts/AuthContext';

interface UseAdminChatResult {
    conversations: FirestoreChatConversation[];
    selectedConversation: FirestoreChatConversation | null;
    messages: FirestoreChatMessage[];
    isLoading: boolean;
    error: string | null;
    selectConversation: (conversation: FirestoreChatConversation) => void;
    sendMessage: (text: string) => Promise<void>;
    markAsRead: (conversationId: string) => Promise<void>;
    updateStatus: (conversationId: string, status: 'active' | 'resolved' | 'archived') => Promise<void>;
    totalUnread: number;
}

export const useAdminChat = (): UseAdminChatResult => {
    const [conversations, setConversations] = useState<FirestoreChatConversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<FirestoreChatConversation | null>(null);
    const [messages, setMessages] = useState<FirestoreChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();
    const chatService = FirestoreChatService.getInstance();

    // Subscribe to all conversations
    useEffect(() => {
        const unsubscribe = chatService.subscribeToConversations((newConversations) => {
            setConversations(newConversations);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to messages for selected conversation
    useEffect(() => {
        if (!selectedConversation) {
            setMessages([]);
            return;
        }

        const unsubscribe = chatService.subscribeToMessages(selectedConversation.id, (newMessages) => {
            setMessages(newMessages);
        });

        return () => unsubscribe();
    }, [selectedConversation]);

    // Calculate total unread count
    const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadByAdmin, 0);

    // Select a conversation
    const selectConversation = useCallback((conversation: FirestoreChatConversation) => {
        setSelectedConversation(conversation);

        // Mark as read when selected
        if (conversation.unreadByAdmin > 0) {
            chatService.markMessagesAsRead(conversation.id, 'admin').catch(err => {
                console.error('Error marking messages as read:', err);
            });
        }
    }, []);

    // Send message as admin
    const sendMessage = useCallback(async (text: string) => {
        if (!selectedConversation || !user) {
            setError('No conversation selected or user not authenticated');
            return;
        }

        try {
            setError(null);
            await chatService.sendMessage({
                conversationId: selectedConversation.id,
                text,
                sender: 'admin',
                senderName: user.name || 'Admin',
                senderId: user.id
            });
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message. Please try again.');
            throw err;
        }
    }, [selectedConversation, user]);

    // Mark conversation as read
    const markAsRead = useCallback(async (conversationId: string) => {
        try {
            await chatService.markMessagesAsRead(conversationId, 'admin');
        } catch (err) {
            console.error('Error marking as read:', err);
            throw err;
        }
    }, []);

    // Update conversation status
    const updateStatus = useCallback(async (
        conversationId: string,
        status: 'active' | 'resolved' | 'archived'
    ) => {
        try {
            await chatService.updateConversationStatus(conversationId, status);
        } catch (err) {
            console.error('Error updating status:', err);
            throw err;
        }
    }, []);

    return {
        conversations,
        selectedConversation,
        messages,
        isLoading,
        error,
        selectConversation,
        sendMessage,
        markAsRead,
        updateStatus,
        totalUnread
    };
};
