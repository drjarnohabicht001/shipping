'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { FirestoreChatMessage } from '@/lib/firestore-schema';

// If UseChatWidgetResult is not exported, we can define the props manually or export it. 
// I will assume I will export it in the next step or redefine it here to be safe if I can't easily change the hook file export right now.
// Actually, looking at the hook file content previously, it was NOT exported (interface UseChatWidgetResult).
// So I will mirror the necessary props here.

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  messages: FirestoreChatMessage[];
  isLoading: boolean;
  error: string | null;
  hasUserInfo: boolean;
  sendMessage: (text: string) => Promise<void>;
  initializeChat: (name: string, email: string, initialMessage: string) => Promise<void>;
}

export default function ChatWidget({
  isOpen,
  onClose,
  messages,
  isLoading,
  error,
  hasUserInfo,
  sendMessage,
  initializeChat
}: ChatWidgetProps) {
  const [messageText, setMessageText] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim() || !userEmail.trim() || !messageText.trim()) {
      return;
    }

    setIsSending(true);
    try {
      await initializeChat(userName.trim(), userEmail.trim(), messageText.trim());
      setMessageText('');
    } catch (err) {
      // Error is handled in the hook
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;

    setIsSending(true);
    try {
      await sendMessage(messageText.trim());
      setMessageText('');
    } catch (err) {
      // Error is handled in the hook
    } finally {
      setIsSending(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Chat with us</h3>
            <p className="text-xs text-blue-100">We typically reply instantly</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasUserInfo ? (
          // User Info Form
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Welcome! 👋
              </h4>
              <p className="text-sm text-gray-600">
                Please provide your information to start chatting with our team.
              </p>
            </div>

            <form onSubmit={handleInitialSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                  required
                  disabled={isSending}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="john@example.com"
                  required
                  disabled={isSending}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Message
                </label>
                <textarea
                  id="message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="How can we help you?"
                  rows={4}
                  required
                  disabled={isSending}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSending || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Starting Chat...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Start Chat
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {isLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No messages yet
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
                      }`}
                    >
                      {message.sender === 'admin' && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {message.senderName}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
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
            <div className="p-4 bg-white border-t border-gray-200">
              {error && (
                <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={isSending || !messageText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
