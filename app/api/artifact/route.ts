// GET /api/artifact?href=/v3/org/.../artifacts/{supplier}/{file}
//
// Streams one answer file to the browser, signing the request server-side.
// Only artifact paths in the current org are accepted, so this can't be used to
// call any other API route.

import { AdxcApiError, fetchArtifact, getCurrentOrg } from "@/lib/adxc/client";

const ARTIFACT_PATH = /^\/v3\/org\/([^/]+)\/realm\/[^/]+\/query\/[^/]+\/artifacts\/[^/]+\/([^/]+)$/;

export async function GET(request: Request) {
    const href = new URL(request.url).searchParams.get("href") ?? "";
    const match = ARTIFACT_PATH.exec(href);
    if (!match) return new Response("Not an artifact path.", { status: 400 });

    try {
        const org = await getCurrentOrg();
        if (decodeURIComponent(match[1]) !== org.org_id) return new Response("Not found.", { status: 404 });

        const upstream = await fetchArtifact(href);
        const filename = decodeURIComponent(match[2]);
        return new Response(upstream.body, {
            headers: {
                "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
                "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (err) {
        const status = err instanceof AdxcApiError ? err.status : 502;
        return new Response(status === 403 ? "This file unlocks when the answer is bought." : "Couldn't fetch the file.", {
            status,
        });
    }
}
