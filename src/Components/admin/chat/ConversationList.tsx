'use client';

import { FirestoreChatConversation } from '@/lib/firestore-schema';
import { MessageCircle, Clock, Mail } from 'lucide-react';

interface ConversationListProps {
  conversations: FirestoreChatConversation[];
  selectedConversation: FirestoreChatConversation | null;
  onSelectConversation: (conversation: FirestoreChatConversation) => void;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading
}: ConversationListProps) {
  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp && typeof timestamp.seconds === 'number') {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return '';
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No conversations yet</p>
        <p className="text-sm">New messages will appear here</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
            selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {conversation.user.name}
                </h3>
                {conversation.unreadByAdmin > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {conversation.unreadByAdmin}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Mail className="w-3 h-3" />
                <span className="truncate">{conversation.user.email}</span>
              </div>

              <p className="text-sm text-gray-700 line-clamp-2">
                {conversation.lastMessage.text}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {formatTime(conversation.lastMessage.timestamp)}
              </div>
              
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                conversation.status === 'active' 
                  ? 'bg-green-100 text-green-700'
                  : conversation.status === 'resolved'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {conversation.status}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
