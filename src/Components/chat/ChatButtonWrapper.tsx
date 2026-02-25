'use client';

import { usePathname } from 'next/navigation';
import FloatingChatButton from '@/components/chat/FloatingChatButton';

export default function ChatButtonWrapper() {
  const pathname = usePathname();
  
  // Don't show chat button on admin pages
  const isAdminPage = pathname?.startsWith('/admin');
  
  if (isAdminPage) return null;
  
  return <FloatingChatButton />;
}
