import { NextResponse, type NextRequest } from "next/server";
import { onrampService } from "@/lib/services/onramp.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const status = await onrampService.getOrderStatus(orderId);
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
