'use client';

import { useState } from 'react';
import { useAdminChat } from '@/hooks/useAdminChat';
import ConversationList from '@/Components/admin/chat/ConversationList';
import MessageThread from '@/Components/admin/chat/MessageThread';
import { MessageCircle, Search } from 'lucide-react';

export default function MessagesPage() {
  const {
    conversations,
    selectedConversation,
    messages,
    isLoading,
    error,
    selectConversation,
    sendMessage,
    updateStatus,
    totalUnread
  } = useAdminChat();

  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (text: string) => {
    await sendMessage(text);
  };

  const handleUpdateStatus = async (status: 'active' | 'resolved' | 'archived') => {
    if (selectedConversation) {
      await updateStatus(selectedConversation.id, status);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-600">
                {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Conversations ({filteredConversations.length})
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={filteredConversations}
              selectedConversation={selectedConversation}
              onSelectConversation={selectConversation}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 bg-gray-50">
          {selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              onUpdateStatus={handleUpdateStatus}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="w-20 h-20 mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the list to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
