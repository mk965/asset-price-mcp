[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/mk965-asset-price-mcp-badge.png)](https://mseep.ai/app/mk965-asset-price-mcp)

# Asset Price MCP Server (asset-price-mcp)

[![smithery badge](https://smithery.ai/badge/@mk965/asset-price-mcp)](https://smithery.ai/server/@mk965/asset-price-mcp)
[English](#asset-price-mcp-server-asset-price-mcp) | [中文](./README.zh.md) | [日本語](./README.ja.md)

## Overview

A Model Context Protocol server for retrieving and displaying current asset price information. This server provides tools to fetch real-time price information for various asset (including precious metals and cryptocurrencies), making it easy for large language models to access and display this data.

### Features

- Retrieve prices for precious metals (Gold, Silver, etc.) via Gold API
- Retrieve prices for cryptocurrencies via CoinGecko and Gold API
- Smart routing to available data sources
- Automatic caching for better performance and rate limit compliance

Please note that asset-price-mcp is currently in development.

## Tools

### `get_asset_price`

Retrieves current pricing information for specific assets.

**Arguments:**
- `symbol` (optional): The asset symbol to query (e.g., "XAU", "BTC", "ETH"). If omitted, returns a default list of major assets.
- `currency` (optional): The currency to express the price in (default: "USD").

### `list_assets`

Lists all supported assets available for price queries.

## Getting Started

Many code editors and other AI clients use configuration files to manage MCP servers.

You can configure the `asset-price-mcp` server by adding the following to your configuration file.

### Installing via Smithery

To install asset-price-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@mk965/asset-price-mcp):

```bash
npx -y @smithery/cli install @mk965/asset-price-mcp --client claude
```

### MacOS/Linux

```json
{
  "mcpServers": {
    "Asset Price MCP": {
      "command": "npx",
      "args": ["-y", "asset-price-mcp"]
    }
  }
}
```

### Windows

```json
{
  "mcpServers": {
    "Asset Price MCP": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "asset-price-mcp"]
    }
  }
}
```

## Building

```bash
npm run build
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
