"use client";

import { MessageCircle } from "lucide-react";
import { useChatWidget } from "@/hooks/useChatWidget";
import ChatWidget from "@/Components/chat/ChatWidget";

export default function FloatingChatButton() {
  const {
    isOpen,
    setIsOpen,
    unreadCount,
    messages,
    isLoading,
    error,
    hasUserInfo,
    sendMessage,
    initializeChat,
  } = useChatWidget();

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 group"
        aria-label="Open chat"
      >
        <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* Pulse Animation */}
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
      </button>

      {/* Chat Widget */}
      <ChatWidget
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        isLoading={isLoading}
        error={error}
        hasUserInfo={hasUserInfo}
        sendMessage={sendMessage}
        initializeChat={initializeChat}
      />
    </>
  );
}
