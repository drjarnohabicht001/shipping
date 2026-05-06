import { NextRequest, NextResponse } from "next/server";
import { markConversationReadAsAdmin } from "@/lib/admin-chat";
import { requireAdminPermission } from "@/lib/admin-route";
import { AdminAction, AdminResource } from "@/lib/firestore-schema";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    await requireAdminPermission(AdminResource.ADMIN_PANEL, AdminAction.UPDATE);
    const { conversationId } = await params;
    await markConversationReadAsAdmin(conversationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to mark messages as read.";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
