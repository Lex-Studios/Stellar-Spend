import { NextRequest, NextResponse } from "next/server";
import { sharingService } from "@/lib/services/sharing-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const { token } = params;

    const share = await sharingService.getShareLink(token);

    if (!share) {
      return NextResponse.json(
        { error: "Share link not found" },
        { status: 404 },
      );
    }

    if (share.expiresAt && share.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: "Share link expired" },
        { status: 410 },
      );
    }

    // Increment view count
    await sharingService.incrementViewCount(token);

    // TODO: Fetch transaction details from database
    const preview = {
      transactionId: share.transactionId,
      amount: "100.00",
      currency: "NGN",
      status: "completed",
      timestamp: Date.now(),
    };

    return NextResponse.json({
      share,
      preview,
    });
  } catch (error) {
    console.error("Error fetching share:", error);
    return NextResponse.json(
      { error: "Failed to fetch share" },
      { status: 500 },
    );
  }
}
