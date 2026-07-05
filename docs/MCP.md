# VeriGate MCP Server

Hire VeriGate directly from an MCP client (Claude Desktop, Cursor, any MCP host). Each tool call places a **real CAP order** to the deployed VeriGate agent and returns the verification report — with the report hash written on-chain.

> Note: CROO's own `@croo-network/mcp-server` is documented but not yet published to npm. This is VeriGate's **own** MCP server, built on the official `@modelcontextprotocol/sdk`, wrapping the CAP requester flow.

## Prerequisites

- A **CROO requester agent** SDK-Key (an agent you own — *not* VeriGate's provider key).
- A little **USDC** in that agent's AA wallet (each verification is a paid order: ~0.015–0.05 USDC + gas).
- The repo built locally:

  ```bash
  git clone https://github.com/wildanre/verigate.git && cd verigate
  npm install && npm run build
  ```

## Configure your MCP client

Add this to your client's MCP config (e.g. Claude Desktop `claude_desktop_config.json`, or Cursor MCP settings). Use the **absolute path** to `dist/mcp-server.js`:

```json
{
  "mcpServers": {
    "verigate": {
      "command": "node",
      "args": ["/absolute/path/to/verigate/dist/mcp-server.js"],
      "env": {
        "CROO_SDK_KEY": "croo_sk_...your-requester-agent...",
        "CROO_API_URL": "https://api.croo.network",
        "CROO_WS_URL": "wss://api.croo.network/ws"
      }
    }
  }
}
```

Restart your client. VeriGate's tools appear automatically. A ready-to-edit copy lives at [`mcp/verigate.mcp.json`](../mcp/verigate.mcp.json).

## Tools

| Tool | Input | Hires |
|---|---|---|
| `verify_schema` | `output`, `expected_schema`, `rules?` | Schema & Output Validation (~0.015 USDC) |
| `verify_grounding` | `source_text`, `generated_text` | Hallucination / Grounding (~0.02 USDC) |
| `fact_check` | `text` or `claims[]` | Fact-Check with Sources (~0.05 USDC) |

Each returns the JSON report (verdict + details + `report_hash`).

## Example prompts

- *"Use verify_grounding to check whether this summary is supported by the article above."*
- *"Validate this JSON against the schema with verify_schema before I ship it."*
- *"Fact-check these three claims with fact_check and show me the sources."*

## Notes

- **Every call spends USDC** — it's a real on-chain order, not a mock. Fund the requester agent's AA wallet.
- **Calls are serialized** (one WebSocket per key), so concurrent tool calls run one at a time.
- **Point at another VeriGate instance** by overriding `VERIGATE_SCHEMA_ID` / `VERIGATE_GROUNDING_ID` / `VERIGATE_FACTCHECK_ID` in `env`. Defaults target the deployed instance.
- All server logs go to **stderr**, so they never corrupt the stdio protocol.
