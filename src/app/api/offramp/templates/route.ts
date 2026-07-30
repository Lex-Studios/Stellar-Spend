import { NextRequest, NextResponse } from "next/server";
import {
  TransactionTemplate,
  TemplateStorage,
} from "@/lib/transaction-templates";

export async function GET(req: NextRequest) {
  try {
    const ownerAddress = req.nextUrl.searchParams.get("ownerAddress");
    const userAddress = req.nextUrl.searchParams.get("userAddress");

    if (!ownerAddress && !userAddress) {
      return NextResponse.json(
        { error: "Missing ownerAddress or userAddress" },
        { status: 400 },
      );
    }

    const address = (userAddress || ownerAddress) as string;
    const templates = userAddress
      ? TemplateStorage.getAccessibleTemplates(address)
      : TemplateStorage.getTemplatesByOwner(address);

    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      amount,
      currency,
      feeMethod,
      category,
      ownerAddress,
      beneficiaryId,
      note,
    } = body;

    if (!name || !amount || !currency || !feeMethod || !ownerAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!["XLM", "USDC"].includes(feeMethod)) {
      return NextResponse.json({ error: "Invalid feeMethod" }, { status: 400 });
    }

    const template: Omit<
      TransactionTemplate,
      "id" | "createdAt" | "sharedWith"
    > = {
      name,
      amount: String(amount),
      currency,
      feeMethod,
      category: category ?? "General",
      ownerAddress,
      usageCount: 0,
      beneficiaryId,
      note,
    };

    const created = TemplateStorage.createTemplate(template);
    return NextResponse.json({ template: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 },
    );
  }
}
