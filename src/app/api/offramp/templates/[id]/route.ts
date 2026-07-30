import { NextRequest, NextResponse } from "next/server";
import { TemplateStorage } from "@/lib/transaction-templates";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const template = TemplateStorage.getTemplate(params.id);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ template });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const { action, targetAddress, ...updates } = body;

    if (action === "share") {
      if (!targetAddress) {
        return NextResponse.json(
          { error: "Missing targetAddress" },
          { status: 400 },
        );
      }
      const template = TemplateStorage.shareTemplate(params.id, targetAddress);
      if (!template)
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 },
        );
      return NextResponse.json({ template });
    }

    if (action === "unshare") {
      if (!targetAddress) {
        return NextResponse.json(
          { error: "Missing targetAddress" },
          { status: 400 },
        );
      }
      const template = TemplateStorage.unshareTemplate(
        params.id,
        targetAddress,
      );
      if (!template)
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 },
        );
      return NextResponse.json({ template });
    }

    if (action === "use") {
      TemplateStorage.recordUsage(params.id);
      return NextResponse.json({ recorded: true });
    }

    const updated = TemplateStorage.updateTemplate(params.id, updates);
    if (!updated)
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    return NextResponse.json({ template: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const deleted = TemplateStorage.deleteTemplate(params.id);
    if (!deleted)
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    return NextResponse.json({ deleted: params.id });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 },
    );
  }
}
