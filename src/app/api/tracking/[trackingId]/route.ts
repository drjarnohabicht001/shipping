import { NextRequest, NextResponse } from "next/server";
import { serializeForClient } from "@/lib/admin-route";
import { getPublicTrackingItemByTrackingId } from "@/lib/admin-tracking";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    const item = await getPublicTrackingItemByTrackingId(trackingId);

    if (!item) {
      return NextResponse.json({ error: "Tracking item not found." }, { status: 404 });
    }

    return NextResponse.json({ item: serializeForClient(item) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load tracking item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
