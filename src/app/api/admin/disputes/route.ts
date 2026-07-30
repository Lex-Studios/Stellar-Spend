import { NextRequest, NextResponse } from "next/server";
import { disputeRepository } from "@/lib/repositories/dispute-repository";
import { DisputeStatus, DisputeUpdate } from "@/types/disputes";

export async function GET(req: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const status = req.nextUrl.searchParams.get("status");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

    const disputes = await disputeRepository.listDisputes(
      (status || undefined) as DisputeStatus | undefined,
      limit,
      offset,
    );

    return NextResponse.json(disputes);
  } catch (error) {
    console.error("Error fetching disputes:", error);
    return NextResponse.json(
      { error: "Failed to fetch disputes" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const { disputeId, update }: { disputeId: string; update: DisputeUpdate } =
      await req.json();

    if (!disputeId) {
      return NextResponse.json(
        { error: "Dispute ID required" },
        { status: 400 },
      );
    }

    const dispute = await disputeRepository.updateDispute(disputeId, update);

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    return NextResponse.json(dispute);
  } catch (error) {
    console.error("Error updating dispute:", error);
    return NextResponse.json(
      { error: "Failed to update dispute" },
      { status: 500 },
    );
  }
}
