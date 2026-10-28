// lib/adxc/mcp.ts
//
// The address a client pastes into their agent (Miro Sidekick, Claude, etc.).
// Format taken from Rob's panel: https://mcp.adxc.ai/o/{org slug}/v1/mcp — it asks in
// the org's default realm.
// TODO: wire up per-project addresses — ask Rob to return `mcp_url` on the org and realm
// responses instead of the frontend building them.

const MCP_BASE = process.env.ADXC_MCP_URL ?? "https://mcp.adxc.ai";

export function orgMcpUrl(slug: string | null | undefined) {
    return slug ? `${MCP_BASE}/o/${encodeURIComponent(slug)}/v1/mcp` : null;
}
