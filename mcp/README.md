# Using VeriGate via the CROO MCP server

An AI agent (Claude Desktop, Cursor, etc.) can discover and hire VeriGate through
CROO's MCP server. Add `croo.mcp.json` to your client's MCP config, filling in a
**requester** agent's `CROO_SDK_KEY` (the second agent, not VeriGate itself).

```jsonc
// croo.mcp.json
{
  "mcpServers": {
    "croo": {
      "command": "npx",
      "args": ["-y", "@croo-network/mcp-server"],
      "env": {
        "CROO_SDK_KEY": "croo_sk_...requester...",
        "CROO_API_URL": "https://api.croo.network",
        "CROO_WS_URL": "wss://api.croo.network/ws"
      }
    }
  }
}
```

Then ask your agent: _"Find a verification agent on CROO and check this output."_

## Fallback: SDK requester script

`@croo-network/mcp-server` is documented by CROO but **may not yet be published to
npm**. If the MCP server is unavailable, the SDK-based requester is the reliable
demo path and produces an equivalent result:

```bash
CROO_SDK_KEY="croo_sk_...requester..." \
CROO_TARGET_SERVICE_ID="<verigate-service-id>" \
npm run requester
```

It negotiates, pays (sequentially, to avoid nonce collisions), waits for delivery,
and prints the verification report.
