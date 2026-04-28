import { type NextRequest, NextResponse } from "next/server";
import { recordVital, recordFunnelEvent } from "@/lib/performance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Web Vitals payload: { name, value, rating?, url?, ts? }
    if (typeof body.name === "string" && typeof body.value === "number") {
      const { name, value, rating, url, ts } = body;
      recordVital({ name, value, rating: rating ?? "unknown", url: url ?? "/", timestamp: ts ?? Date.now() });
      return new NextResponse(null, { status: 204 });
    }

    // Analytics / funnel event payload: { category, action, sessionId?, ... }
    if (typeof body.category === "string" && typeof body.action === "string") {
      if (body.category === "Funnel") {
        recordFunnelEvent({
          action: body.action,
          sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
          timestamp: body.timestamp ? new Date(body.timestamp).getTime() : Date.now(),
        });
      }
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
