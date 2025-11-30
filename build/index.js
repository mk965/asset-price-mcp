#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoldApiService } from "./services/gold-api.js";
import { CoinGeckoService } from "./services/coingecko-api.js";
import { GoldPriceOrgService } from "./services/goldprice-org.js";
import { ExchangeRateService } from "./services/exchange-rate.js";
import { registerGetAssetPriceTool, registerListAssetsTool } from "./tools/index.js";
import { apiCache } from "./cache.js";
// Initialize Services
// Priority: GoldPriceOrg (Faster for XAU/XAG) -> GoldAPI (Fallback/More Metals) -> CoinGecko (Crypto)
const goldPriceOrg = new GoldPriceOrgService();
const goldApi = new GoldApiService();
const coinGeckoApi = new CoinGeckoService();
const exchangeService = new ExchangeRateService();
const services = [goldPriceOrg, goldApi, coinGeckoApi];
// Create Server
const server = new McpServer({
    name: "asset-price-mcp",
    version: "1.2.0",
});
// Register Tools
registerGetAssetPriceTool(server, services, exchangeService);
registerListAssetsTool(server, services);
// Cache Cleanup Loop
setInterval(() => {
    apiCache.clear();
}, 5 * 60 * 1000);
async function main() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Asset Price MCP Server running on stdio");
        // Optional: Preheat cache (non-blocking)
        console.error("Preheating cache...");
        Promise.all([
            ...services.map(s => s.getSupportedAssets().catch(e => console.error(`Failed to preheat ${s.getName()}:`, e))),
            exchangeService.getRate("USD", "CNY").catch(e => console.error("Failed to preheat rates:", e))
        ]);
    }
    catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
