# 资产价格 MCP 服务器 (asset-price-mcp)

[English](./README.md) | [中文](#资产价格-mcp-服务器-asset-price-mcp) | [日本語](./README.ja.md)

## 概述

一个用于检索和展示当前资产价格信息的 MCP 服务器。此服务器提供工具来检索各种资产（包括贵金属和加密货币）的实时价格信息，便于大型语言模型访问和显示这些数据。

请注意，asset-price-mcp 目前处于早期开发阶段。功能和可用工具可能会随着我们继续开发和改进服务器而变化和扩展。

## 入门

许多代码编辑器和其他 AI 客户端使用配置文件来管理 MCP 服务器。

可以通过在配置文件中添加以下内容来配置 `asset-price-mcp` 服务器。

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

## 构建

```bash
npm run build
```

## 测试

```bash
npm test
```

## 许可证

此 MCP 服务器根据 MIT 许可证授权。这意味着您可以自由使用、修改和分发此软件，但需遵守 MIT 许可证的条款和条件。有关更多详细信息，请参阅项目仓库中的 LICENSE 文件。 