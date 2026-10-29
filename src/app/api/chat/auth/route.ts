import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Issues a Firebase session token for an anonymous site visitor so the
 * customer chat can talk to Firestore. The browser generates and keeps a
 * random client id; the uid derived from it is stable for that browser,
 * which is what the Firestore rules use to scope conversations.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { clientId?: unknown }
      | null;
    const clientId =
      typeof body?.clientId === "string" ? body.clientId.trim() : "";

    if (!UUID_PATTERN.test(clientId)) {
      return NextResponse.json({ error: "Invalid client id." }, { status: 400 });
    }

    const uid = `chat_${clientId.replace(/-/g, "")}`;
    const token = await getFirebaseAdminAuth().createCustomToken(uid);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error issuing chat session token:", error);
    return NextResponse.json(
      { error: "Unable to start chat right now." },
      { status: 500 }
    );
  }
}
