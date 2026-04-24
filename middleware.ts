import { NextRequest, NextResponse } from "next/server";
import { registry } from "./src/lib/api-versioning/registry";

// Matches /api/v{n}/... and captures the version segment
const VERSIONED_PATH_RE = /^\/api\/(v\d+)(\/.*)?$/;

// Matches /api/{non-version-segment}/... (unversioned legacy paths)
const UNVERSIONED_API_RE = /^\/api\/(?!v\d+(?:\/|$))(.*)$/;

// Matches application/vnd.stellarspend.v{n}+json
const ACCEPT_HEADER_RE = /application\/vnd\.stellarspend\.(v\d+)\+json/;

// Migration guide URL referenced in deprecation headers
const MIGRATION_GUIDE_URL = "/docs/api-migration-v1";

function resolveVersionFromHeaders(request: NextRequest): string | null {
    // X-API-Version header takes precedence over Accept header
    const xApiVersion = request.headers.get("x-api-version");
    if (xApiVersion && xApiVersion.trim() !== "") {
        const normalised = /^\d+$/.test(xApiVersion.trim())
            ? `v${xApiVersion.trim()}`
            : xApiVersion.trim();
        return normalised;
    }

    // Accept header
    const accept = request.headers.get("accept");
    if (accept) {
        const match = ACCEPT_HEADER_RE.exec(accept);
        if (match) {
            return match[1];
        }
    }

    return null;
}

function addLegacyDeprecationHeaders(response: NextResponse, legacyPath: string): NextResponse {
    // v1 is currently supported, so legacy routes are deprecated (pointing to v1 successor)
    // Use a fixed deprecation date — when v1 was introduced
    response.headers.set("Deprecation", "2025-01-01");
    response.headers.set("Sunset", "2026-01-01");
    response.headers.set(
        "Link",
        `</api/v1/${legacyPath.replace(/^\//, "")}>; rel="successor-version", <${MIGRATION_GUIDE_URL}>; rel="deprecation"`
    );
    return response;
}

export function middleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    // 1. Check for versioned URL path: /api/v{n}/*
    const versionedMatch = VERSIONED_PATH_RE.exec(pathname);
    if (versionedMatch) {
        const version = versionedMatch[1];
        if (!registry.isKnown(version)) {
            return NextResponse.json(
                { error: "API version not supported" },
                { status: 404 }
            );
        }
        // Known version — pass through, add X-API-Version header
        const response = NextResponse.next();
        response.headers.set("X-API-Version", version.replace(/^v/, ""));
        return response;
    }

    // 2. Check for unversioned /api/* paths with version headers
    const unversionedMatch = UNVERSIONED_API_RE.exec(pathname);
    if (unversionedMatch) {
        const subpath = unversionedMatch[1] ?? "";
        const version = resolveVersionFromHeaders(request);
        if (version !== null) {
            if (!registry.isKnown(version)) {
                const supported = registry.getAll().map((e) => e.version);
                return NextResponse.json(
                    { error: "Unsupported API version", supported },
                    { status: 400 }
                );
            }
            // Rewrite URL to versioned equivalent
            const url = request.nextUrl.clone();
            url.pathname = `/api/${version}/${subpath}`;
            return NextResponse.rewrite(url);
        }

        // Legacy route with no version headers — add deprecation headers
        const response = NextResponse.next();
        addLegacyDeprecationHeaders(response, subpath);
        return response;
    }

    // 3. Pass through all other requests unchanged
    return NextResponse.next();
}

export const config = {
    matcher: ["/api/:path*"],
};
