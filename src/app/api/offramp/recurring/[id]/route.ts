import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      action,
      label,
      amount,
      currency,
      frequency,
      maxExecutions,
      retryConfig,
      notificationsEnabled,
    } = body;

    const validActions = ["pause", "resume", "update"];
    if (action && !validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const patch: Record<string, unknown> = { id };
    if (action === "pause") patch.paused = true;
    if (action === "resume") patch.paused = false;
    if (label !== undefined) patch.label = label;
    if (amount !== undefined) patch.amount = String(amount);
    if (currency !== undefined) patch.currency = currency;
    if (frequency !== undefined) patch.frequency = frequency;
    if (maxExecutions !== undefined) patch.maxExecutions = maxExecutions;
    if (retryConfig !== undefined) patch.retryConfig = retryConfig;
    if (notificationsEnabled !== undefined)
      patch.notificationsEnabled = notificationsEnabled;

    return NextResponse.json({ updated: patch });
  } catch {
    return NextResponse.json(
      { error: "Failed to modify recurring schedule" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing schedule id" },
        { status: 400 },
      );
    }
    return NextResponse.json({ cancelled: id });
  } catch {
    return NextResponse.json(
      { error: "Failed to cancel recurring schedule" },
      { status: 500 },
    );
  }
}
