"use client";

import { usePathname } from "next/navigation";
import FloatingChatButton from "@/Components/chat/FloatingChatButton";

export default function ChatButtonWrapper() {
  const pathname = usePathname();

  // Don't show chat button on admin pages or the maintenance page
  const isAdminPage = pathname?.startsWith("/admin");
  const isMaintenancePage = pathname === "/";

  if (isAdminPage || isMaintenancePage) return null;

  return <FloatingChatButton />;
}
