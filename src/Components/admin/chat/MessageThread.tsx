'use client';

import { useState, useRef, useEffect } from 'react';
import { FirestoreChatMessage, FirestoreChatConversation } from '@/lib/firestore-schema';
import { Send, Check, Archive, XCircle } from 'lucide-react';

interface MessageThreadProps {
  conversation: FirestoreChatConversation;
  messages: FirestoreChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onUpdateStatus: (status: 'active' | 'resolved' | 'archived') => Promise<void>;
}

export default function MessageThread({
  conversation,
  messages,
  onSendMessage,
  onUpdateStatus
}: MessageThreadProps) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(messageText.trim());
      setMessageText('');
    } catch (err) {
      // Error is handled in the hook
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusUpdate = async (status: 'active' | 'resolved' | 'archived') => {
    try {
      await onUpdateStatus(status);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

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

    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {conversation.user.name}
            </h2>
            <p className="text-sm text-gray-600">{conversation.user.email}</p>
            <p className="text-xs text-gray-500 mt-1">
              User ID: {conversation.user.userId}
            </p>
          </div>

          <div className="flex gap-2">
            {conversation.status !== 'resolved' && (
              <button
                onClick={() => handleStatusUpdate('resolved')}
                className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Resolve
              </button>
            )}
            
            {conversation.status !== 'archived' && (
              <button
                onClick={() => handleStatusUpdate('archived')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
            )}

            {conversation.status !== 'active' && (
              <button
                onClick={() => handleStatusUpdate('active')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors text-sm font-medium"
              >
                <XCircle className="w-4 h-4" />
                Reopen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No messages yet
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.sender === 'admin'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-xs font-medium ${
                    message.sender === 'admin' ? 'text-blue-100' : 'text-gray-600'
                  }`}>
                    {message.senderName}
                  </p>
                  {message.sender === 'admin' && (
                    <span className="text-xs bg-blue-500 px-2 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.text}
                </p>
                <p
                  className={`text-xs mt-2 ${
                    message.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your reply..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !messageText.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
