# 資産価格 MCP サーバー (asset-price-mcp)

[English](./README.md) | [中文](./README.zh.md) | [日本語](#資産価格-mcp-サーバー-asset-price-mcp)

## 概要

現在の資産価格情報を取得して表示するための Model Context Protocol サーバーです。このサーバーは、さまざまな資産（貴金属や暗号通貨を含む）のリアルタイム価格情報を取得するツールを提供し、大規模言語モデルがこれらのデータに簡単にアクセスして表示できるようにします。

asset-price-mcp は現在、初期開発段階にあることにご注意ください。機能と利用可能なツールは、サーバーの開発と改善を続ける中で変更および拡張される可能性があります。

## はじめに

多くのコードエディタや他のAIクライアントはMCPサーバーを管理するために設定ファイルを使用します。

設定ファイルに以下を追加することで `asset-price-mcp` サーバーを設定できます。

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

## ビルド

```bash
npm run build
```

## テスト

```bash
npm test
```

## ライセンス

この MCP サーバーは MIT ライセンスの下でライセンスされています。これは、MIT ライセンスの条件に従い、ソフトウェアを自由に使用、修正、配布できることを意味します。詳細については、プロジェクトリポジトリの LICENSE ファイルを参照してください。 