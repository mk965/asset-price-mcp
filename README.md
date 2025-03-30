# Asset Price MCP Server (asset-price-mcp)

[English](#asset-price-mcp-server-asset-price-mcp) | [中文](./README.zh.md) | [日本語](./README.ja.md)

## Overview

A Model Context Protocol server for retrieving and displaying current asset price information. This server provides tools to fetch real-time price information for various assets (including precious metals and cryptocurrencies), making it easy for large language models to access and display this data.

Please note that asset-price-mcp is currently in early development. The functionality and available tools may change and expand as we continue to develop and improve the server.

## Getting Started

Many code editors and other AI clients use configuration files to manage MCP servers.

You can configure the `assets-price-mcp` server by adding the following to your configuration file.

### MacOS/Linux

```json
{
  "mcpServers": {
    "Asset Price MCP": {
      "command": "npx",
      "args": ["-y", "assets-price-mcp"]
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
      "args": ["/c", "npx", "-y", "assets-price-mcp"]
    }
  }
}
```

## Building

```bash
npm run build
```

## Testing

```bash
npm test
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository. 