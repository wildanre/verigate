# VeriGate MCP server

Hire VeriGate from any MCP client (Claude Desktop, Cursor). Each tool call places
a real CAP order to the deployed VeriGate and returns the verification report.

- Config template: [`verigate.mcp.json`](verigate.mcp.json)
- Full setup, tools, and examples: [`../docs/MCP.md`](../docs/MCP.md)

Quick version:

```bash
git clone https://github.com/wildanre/verigate.git && cd verigate
npm install && npm run build
```

Then point your MCP client at `dist/mcp-server.js` with a CROO **requester** agent
key (funded with a little USDC). Tools: `verify_schema`, `verify_grounding`,
`fact_check`.

> CROO's own `@croo-network/mcp-server` is documented but not yet on npm. This is
> VeriGate's own MCP server built on `@modelcontextprotocol/sdk`.
