import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// 配置常量
const GOLD_API_BASE = "https://api.gold-api.com";
const USER_AGENT = "asset-price-tracker/1.0";
const DEFAULT_UNKNOWN = "Unknown";
const API_TIMEOUT = 10000; // 10秒超时
const CACHE_TTL = 60000; // 缓存1分钟
// Zod 模式验证
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
        // 检查是否过期
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
// 创建缓存实例
const apiCache = new SimpleCache();
// 创建 MCP 服务器实例
const server = new McpServer({
    name: "asset-price",
    version: "1.0.0",
});
/**
 * 带超时的fetch函数
 */
async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    }
    finally {
        clearTimeout(id);
    }
}
/**
 * 安全的 API 请求封装
 */
async function fetchApiData(url, schema, useCache = true) {
    // 检查缓存
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
        // 保存到缓存
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
/**
 * 格式化价格信息
 */
function formatAssetPrice(price) {
    return [
        `Name: ${price.name || DEFAULT_UNKNOWN}`,
        `Price: ${price.price.toLocaleString() || DEFAULT_UNKNOWN}`,
        `Symbol: ${price.symbol || DEFAULT_UNKNOWN}`,
        `Updated: ${price.updatedAtReadable || price.updatedAt || DEFAULT_UNKNOWN}`,
        "---",
    ].join("\n");
}
// 工具方法注册
server.tool("get_asset_price", "Retrieves current pricing information for various assets including precious metals and cryptocurrencies", {
    random_string: z.string().optional().describe("Dummy parameter for no-parameter tools")
}, async () => {
    try {
        // 获取可用的交易品种
        const symbols = await fetchApiData(`${GOLD_API_BASE}/symbols`, z.array(AssetSymbolSchema));
        if (!symbols?.length) {
            return {
                content: [{
                        type: "text",
                        text: "No available asset symbols found. Service might be temporarily unavailable.",
                    }]
            };
        }
        // 并发获取所有价格数据，设置并发限制
        const batchSize = 3; // 每批处理3个请求
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
        // 处理无有效价格数据的情况
        if (prices.length === 0) {
            return {
                content: [{
                        type: "text",
                        text: "Failed to retrieve pricing data. Please try again later.",
                    }]
            };
        }
        // 按资产类型分组
        const categorizedPrices = prices.reduce((acc, price) => {
            const category = getCategoryBySymbol(price.symbol);
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(price);
            return acc;
        }, {});
        // 格式化输出
        let formattedSections = ["Current Asset Prices:"];
        // 优先展示贵金属
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
/**
 * 根据符号判断资产类别
 */
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
// 服务器启动
async function main() {
    try {
        // 预热缓存
        console.error("Preheating cache...");
        fetchApiData(`${GOLD_API_BASE}/symbols`, z.array(AssetSymbolSchema), true).catch(() => {
            // 忽略预热错误
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
// 健康检查，每5分钟清除一次过期缓存
setInterval(() => {
    apiCache.clear();
    console.error("Cache cleared");
}, 5 * 60 * 1000);
// 启动服务器
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
