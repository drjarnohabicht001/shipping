import { NextRequest, NextResponse } from "next/server";
import {
  deleteTrackingItem,
  getTrackingItemByTrackingId,
  updateTrackingStatus,
} from "@/lib/admin-tracking";
import { requireAdminPermission, serializeForClient } from "@/lib/admin-route";
import { AdminAction, AdminResource } from "@/lib/firestore-schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    await requireAdminPermission(AdminResource.TRACKING, AdminAction.READ);
    const { trackingId } = await params;
    const item = await getTrackingItemByTrackingId(trackingId);

    if (!item) {
      return NextResponse.json({ error: "Tracking item not found." }, { status: 404 });
    }

    return NextResponse.json({ item: serializeForClient(item) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load tracking item.";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const session = await requireAdminPermission(
      AdminResource.TRACKING,
      AdminAction.UPDATE
    );
    const { trackingId } = await params;
    const body = await request.json();
    const updatedItem = await updateTrackingStatus({
      ...body,
      trackingId,
      updatedBy: session.uid,
    });

    return NextResponse.json({
      ok: true,
      item: serializeForClient(updatedItem),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update tracking item.";
    const status =
      message === "Forbidden"
        ? 403
        : message === "Tracking item not found"
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    await requireAdminPermission(AdminResource.TRACKING, AdminAction.DELETE);
    const { trackingId } = await params;
    await deleteTrackingItem(trackingId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete tracking item.";
    const status =
      message === "Forbidden"
        ? 403
        : message === "Tracking item not found"
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
