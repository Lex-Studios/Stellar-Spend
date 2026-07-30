import { NextRequest, NextResponse } from "next/server";
import { vulnerabilityManager } from "@/lib/vulnerability-management";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const severity = searchParams.get("severity") as
      "critical" | "high" | "medium" | "low" | null;

    let vulnerabilities;
    if (severity) {
      vulnerabilities =
        vulnerabilityManager.getVulnerabilitiesBySeverity(severity);
    } else {
      vulnerabilities = vulnerabilityManager.getActiveVulnerabilities();
    }

    const report = vulnerabilityManager.generateReport();

    return NextResponse.json({
      report,
      vulnerabilities,
      hasCritical: vulnerabilityManager.hasCriticalVulnerabilities(),
    });
  } catch (error) {
    logger.error("Failed to fetch vulnerability report", { error });
    return NextResponse.json(
      { error: "Failed to fetch vulnerability report" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      severity,
      package: pkg,
      version,
      fixedVersion,
      description,
      cve,
    } = body;

    if (!title || !severity || !pkg || !version) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const vulnerability = vulnerabilityManager.registerVulnerability({
      title,
      severity,
      package: pkg,
      version,
      fixedVersion,
      description,
      cve,
    });

    return NextResponse.json({ vulnerability }, { status: 201 });
  } catch (error) {
    logger.error("Failed to register vulnerability", { error });
    return NextResponse.json(
      { error: "Failed to register vulnerability" },
      { status: 500 },
    );
  }
}
