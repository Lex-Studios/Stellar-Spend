import { NextResponse } from "next/server";
import { onrampService } from "@/lib/services/onramp.service";

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 },
      );
    }

    await onrampService.reconciliate(orderId);

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
