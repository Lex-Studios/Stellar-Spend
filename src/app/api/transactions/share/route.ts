import { NextRequest, NextResponse } from "next/server";
import { sharingService } from "@/lib/services/sharing-service";
import { ShareSettings } from "@/types/sharing";

export async function POST(req: NextRequest) {
  try {
    const userAddress = req.headers.get("x-user-address");
    if (!userAddress) {
      return NextResponse.json(
        { error: "User address required" },
        { status: 401 },
      );
    }

    const {
      transactionId,
      settings,
    }: { transactionId: string; settings: ShareSettings } = await req.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID required" },
        { status: 400 },
      );
    }

    const share = await sharingService.createShareLink(
      transactionId,
      userAddress,
      settings,
    );

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userAddress = req.headers.get("x-user-address");
    if (!userAddress) {
      return NextResponse.json(
        { error: "User address required" },
        { status: 401 },
      );
    }

    const shares = await sharingService.getUserShareLinks(userAddress);

    return NextResponse.json(shares);
  } catch (error) {
    console.error("Error fetching share links:", error);
    return NextResponse.json(
      { error: "Failed to fetch share links" },
      { status: 500 },
    );
  }
}
