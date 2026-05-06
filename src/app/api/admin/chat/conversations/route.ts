import { NextResponse } from "next/server";
import { listAdminConversations } from "@/lib/admin-chat";
import { requireAdminPermission, serializeForClient } from "@/lib/admin-route";
import { AdminAction, AdminResource } from "@/lib/firestore-schema";

export async function GET() {
  try {
    await requireAdminPermission(AdminResource.ADMIN_PANEL, AdminAction.READ);
    const conversations = await listAdminConversations();
    return NextResponse.json({
      conversations: serializeForClient(conversations),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load conversations.";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
