import { NextRequest, NextResponse } from "next/server";
import { updateAdminConversationStatus } from "@/lib/admin-chat";
import { requireAdminPermission } from "@/lib/admin-route";
import { AdminAction, AdminResource } from "@/lib/firestore-schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    await requireAdminPermission(AdminResource.ADMIN_PANEL, AdminAction.UPDATE);
    const { conversationId } = await params;
    const body = await request.json();
    await updateAdminConversationStatus(conversationId, body.status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update conversation status.";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
