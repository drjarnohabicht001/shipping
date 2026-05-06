import { NextRequest, NextResponse } from "next/server";
import {
  listConversationMessages,
  sendAdminConversationMessage,
} from "@/lib/admin-chat";
import { requireAdminPermission, serializeForClient } from "@/lib/admin-route";
import { AdminAction, AdminResource } from "@/lib/firestore-schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    await requireAdminPermission(AdminResource.ADMIN_PANEL, AdminAction.READ);
    const { conversationId } = await params;
    const messages = await listConversationMessages(conversationId);
    return NextResponse.json({ messages: serializeForClient(messages) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load messages.";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await requireAdminPermission(
      AdminResource.ADMIN_PANEL,
      AdminAction.UPDATE
    );
    const { conversationId } = await params;
    const body = await request.json();
    const message = await sendAdminConversationMessage({
      conversationId,
      text: body.text,
      senderId: session.uid,
      senderName: session.name,
    });

    return NextResponse.json({ ok: true, message: serializeForClient(message) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send admin message.";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
