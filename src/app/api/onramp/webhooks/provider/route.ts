import { NextResponse } from "next/server";
import { onrampService } from "@/lib/services/onramp.service";
import { onrampProviderRegistry } from "@/lib/onramp/adapters/provider-registry";

export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Provider-Signature") ?? "";
    const provider = request.headers.get("X-Provider") ?? "";

    if (!provider) {
      return NextResponse.json(
        { error: "X-Provider header is required" },
        { status: 400 },
      );
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const adapter = onrampProviderRegistry.getProvider(provider);
    if (!adapter) {
      return NextResponse.json(
        { error: `Unknown provider: ${provider}` },
        { status: 400 },
      );
    }

    const payload = JSON.parse(rawBody);
    await onrampService.handleWebhook(payload);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Onramp webhook error:", error);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
