// lib/adxc/mcp.ts
//
// The connector address a client pastes into their agent (Miro Sidekick, Claude, etc.).
// The API doesn't return it; the format is taken from Rob's panel:
//   default realm:  https://mcp.adxc.ai/o/{org slug}/v1/mcp
//   other realms:   https://mcp.adxc.ai/o/{org slug}/r/{realm name}/v1/mcp
// That's why realm names are limited to lowercase letters, digits and hyphens.
// If Rob ever returns `mcp_url` on orgs/realms, use that instead of building it here.

import type { Realm } from "./types";

const MCP_BASE = process.env.ADXC_MCP_URL ?? "https://mcp.adxc.ai";

export function orgMcpUrl(slug: string | null | undefined) {
    return slug ? `${MCP_BASE}/o/${encodeURIComponent(slug)}/v1/mcp` : null;
}

export function realmMcpUrl(slug: string | null | undefined, realm: Pick<Realm, "name" | "is_default">) {
    if (!slug) return null;
    if (realm.is_default) return orgMcpUrl(slug);
    return `${MCP_BASE}/o/${encodeURIComponent(slug)}/r/${encodeURIComponent(realm.name)}/v1/mcp`;
}
