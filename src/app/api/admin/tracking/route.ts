import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, serializeForClient } from "@/lib/admin-route";
import { createTrackingItem, listTrackingItems } from "@/lib/admin-tracking";
import { AdminAction, AdminResource } from "@/lib/firestore-schema";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(AdminResource.TRACKING, AdminAction.READ);
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get("searchQuery") || undefined;
    const statusParam = searchParams.get("status");
    const status = statusParam ? statusParam.split(",").filter(Boolean) : undefined;

    const items = await listTrackingItems({
      searchQuery,
      status: status as any,
    });

    return NextResponse.json({
      items: serializeForClient(items),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load tracking items.";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminPermission(
      AdminResource.TRACKING,
      AdminAction.CREATE
    );
    const body = await request.json();
    const item = await createTrackingItem(body, session.uid);

    return NextResponse.json({
      ok: true,
      item: serializeForClient(item),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create tracking item.";
    const status =
      message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
