#!/usr/bin/env node
// Node.js v16兼容性修复
import nodeFetch from 'node-fetch';
// @ts-ignore
const fetchToUse = globalThis.fetch || nodeFetch;
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const GOLD_API_BASE = "https://api.gold-api.com";
const USER_AGENT = "asset-price-tracker/1.0";
const DEFAULT_UNKNOWN = "Unknown";
const API_TIMEOUT = 10000; // 10秒超时
const CACHE_TTL = 60000; // 缓存1分钟
const AssetSymbolSchema = z.object({
    name: z.string(),
    symbol: z.string(),
});
const AssetPriceSchema = z.object({
    name: z.string(),
    price: z.number(),
    symbol: z.string(),
    updatedAt: z.string(),
    updatedAtReadable: z.string(),
});
class SimpleCache {
    cache = new Map();
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > CACHE_TTL) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    clear() {
        this.cache.clear();
    }
}
const apiCache = new SimpleCache();
const server = new McpServer({
    name: "asset-price-mcp",
    version: "1.0.2",
});
async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        // @ts-ignore - 使用通用fetch实现
        const response = await fetchToUse(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    }
    finally {
        clearTimeout(id);
    }
}
async function fetchApiData(url, schema, useCache = true) {
    if (useCache) {
        const cachedData = apiCache.get(url);
        if (cachedData) {
            return cachedData;
        }
    }
    const headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    };
    try {
        const response = await fetchWithTimeout(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}`);
        }
        const data = await response.json();
        const parsedData = schema.parse(data);
        if (useCache && parsedData) {
            apiCache.set(url, parsedData);
        }
        return parsedData;
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            console.error(`Schema validation failed for ${url}:`, error.errors);
        }
        else if (error.name === 'AbortError') {
            console.error(`Request timeout for ${url}`);
        }
        else {
            console.error(`API request failed for ${url}:`, error);
        }
        return null;
    }
}
function formatAssetPrice(price) {
    return [
        `Name: ${price.name || DEFAULT_UNKNOWN}`,
        `Price: ${price.price.toLocaleString() || DEFAULT_UNKNOWN}`,
        `Symbol: ${price.symbol || DEFAULT_UNKNOWN}`,
        `Updated: ${price.updatedAtReadable || price.updatedAt || DEFAULT_UNKNOWN}`,
        "---",
    ].join("\n");
}
server.tool("get_asset_price", "Retrieves current pricing information for various assets including precious metals and cryptocurrencies", {
    random_string: z.string().optional().describe("Dummy parameter for no-parameter tools")
}, async () => {
    try {
        const symbols = await fetchApiData(`${GOLD_API_BASE}/symbols`, z.array(AssetSymbolSchema));
        if (!symbols?.length) {
            return {
                content: [{
                        type: "text",
                        text: "No available asset symbols found. Service might be temporarily unavailable.",
                    }]
            };
        }
        const batchSize = 5;
        const prices = [];
        for (let i = 0; i < symbols.length; i += batchSize) {
            const batch = symbols.slice(i, i + batchSize);
            const batchPromises = batch.map(({ symbol }) => fetchApiData(`${GOLD_API_BASE}/price/${symbol}`, AssetPriceSchema));
            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(result => {
                if (result !== null) {
                    prices.push(result);
                }
            });
        }
        if (prices.length === 0) {
            return {
                content: [{
                        type: "text",
                        text: "Failed to retrieve pricing data. Please try again later.",
                    }]
            };
        }
        const categorizedPrices = prices.reduce((acc, price) => {
            const category = getCategoryBySymbol(price.symbol);
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(price);
            return acc;
        }, {});
        let formattedSections = ["Current Asset Prices:"];
        if (categorizedPrices["precious_metals"]) {
            formattedSections = formattedSections.concat(categorizedPrices["precious_metals"].map(formatAssetPrice));
        }
        // 其他类别
        Object.entries(categorizedPrices)
            .filter(([category]) => category !== "precious_metals")
            .forEach(([_, categoryPrices]) => {
            formattedSections = formattedSections.concat(categoryPrices.map(formatAssetPrice));
        });
        return {
            content: [{
                    type: "text",
                    text: formattedSections.join("\n"),
                }]
        };
    }
    catch (error) {
        console.error("Tool execution failed:", error);
        return {
            content: [{
                    type: "text",
                    text: "An error occurred while processing your request. Please try again later.",
                }]
        };
    }
});
function getCategoryBySymbol(symbol) {
    const categories = {
        precious_metals: ["XAU", "XAG", "XPD", "XPT", "HG"],
        crypto: ["BTC", "ETH", "LTC", "XRP", "DOT", "ADA"],
        forex: ["USD", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF"],
        indices: ["SPX", "NDX", "DJI", "VIX"]
    };
    for (const [category, symbols] of Object.entries(categories)) {
        if (symbols.includes(symbol)) {
            return category;
        }
    }
    return "other";
}
async function main() {
    try {
        console.error("Preheating cache...");
        fetchApiData(`${GOLD_API_BASE}/symbols`, z.array(AssetSymbolSchema), true).catch(() => {
            console.error("Failed to preheat cache");
        });
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Asset Price MCP Server running on stdio");
    }
    catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}
setInterval(() => {
    apiCache.clear();
    console.error("Cache cleared");
}, 5 * 60 * 1000);
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
