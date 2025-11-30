
import { z } from "zod";
import { PriceService, AssetSymbol, AssetPrice, AssetSymbolSchema } from "../types.js";
import { fetchJson } from "../utils.js";
import { apiCache } from "../cache.js";

const BASE_URL = "https://api.gold-api.com";

// Gold API returns slightly different structure for symbols sometimes, but let's stick to the schema
const GoldApiSymbolSchema = z.array(AssetSymbolSchema);

// Gold API price response matches our schema closely
const GoldApiPriceSchema = z.object({
  name: z.string(),
  price: z.number(),
  symbol: z.string(),
  updatedAt: z.string(),
  updatedAtReadable: z.string().optional(),
});

export class GoldApiService implements PriceService {
  getName(): string {
    return "GoldAPI";
  }

  async getSupportedAssets(): Promise<AssetSymbol[]> {
    const cacheKey = `${BASE_URL}/symbols`;
    const cached = apiCache.get<AssetSymbol[]>(cacheKey);
    if (cached) return cached;

    const symbols = await fetchJson(cacheKey, GoldApiSymbolSchema);
    if (symbols) {
      apiCache.set(cacheKey, symbols);
      return symbols;
    }
    return [];
  }

  async getPrice(symbol: string, currency: string = 'USD'): Promise<AssetPrice | null> {
    // Gold API mostly supports USD, and currency conversion might not be supported directly in this endpoint
    // We will ignore currency for now or only support USD
    if (currency !== 'USD') {
        // TODO: Could implement manual conversion if needed
    }

    const url = `${BASE_URL}/price/${symbol}`;
    const cacheKey = `${url}?currency=${currency}`;
    const cached = apiCache.get<AssetPrice>(cacheKey);
    if (cached) return cached;

    const rawData = await fetchJson(url, GoldApiPriceSchema);
    
    if (rawData) {
      const priceData: AssetPrice = {
        ...rawData,
        currency: 'USD', // Gold API prices are in USD by default
      };
      apiCache.set(cacheKey, priceData);
      return priceData;
    }
    
    return null;
  }

  async getPrices(symbols: string[], currency: string = 'USD'): Promise<AssetPrice[]> {
    const promises = symbols.map(s => this.getPrice(s, currency));
    const results = await Promise.all(promises);
    return results.filter((p): p is AssetPrice => p !== null);
  }
}

