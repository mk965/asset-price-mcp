# 資産価格 MCP サーバー (asset-price-mcp)

[English](./README.md) | [中文](./README.zh.md) | [日本語](#資産価格-mcp-サーバー-asset-price-mcp)

## 概要

現在の資産価格情報を取得して表示するための Model Context Protocol サーバーです。このサーバーは、さまざまな資産（貴金属や暗号通貨を含む）のリアルタイム価格情報を取得するツールを提供し、大規模言語モデルがこれらのデータに簡単にアクセスして表示できるようにします。

### 機能

- 金や銀などの貴金属価格の照会をサポート (情報源: Gold API)
- 暗号通貨価格の照会をサポート (情報源: CoinGecko, Gold API)
- 利用可能なデータソースへのクエリリクエストのインテリジェントルーティング
- 応答速度の向上とAPI呼び出しの削減のための自動キャッシュ

asset-price-mcp は現在、開発段階にあることにご注意ください。

## ツール

### `get_asset_price`

特定の資産の価格を照会します。

**引数:**
- `symbol` (オプション): 資産シンボル (例: "XAU", "BTC", "ETH")。指定しない場合、主要な資産価格のリストを返します。
- `currency` (オプション): 価格を表示する通貨。デフォルトは "USD" です。

### `list_assets`

価格照会がサポートされているすべての資産リストを表示します。

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

## ライセンス

この MCP サーバーは MIT ライセンスの下でライセンスされています。これは、MIT ライセンスの条件に従い、ソフトウェアを自由に使用、修正、配布できることを意味します。詳細については、プロジェクトリポジトリの LICENSE ファイルを参照してください。
