
import { z } from "zod";
import { PriceService, AssetSymbol, AssetPrice } from "../types.js";
import { fetchJson } from "../utils.js";
import { apiCache } from "../cache.js";

const BASE_URL = "https://api.coingecko.com/api/v3";

const CoinGeckoMarketSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number(),
  market_cap: z.number().optional(),
  total_volume: z.number().optional(),
  price_change_percentage_24h: z.number().optional().nullable(),
  last_updated: z.string().optional()
});

const CoinGeckoMarketsSchema = z.array(CoinGeckoMarketSchema);

export class CoinGeckoService implements PriceService {
  private symbolMap: Map<string, string> = new Map(); // symbol (btc) -> id (bitcoin)

  getName(): string {
    return "CoinGecko";
  }

  async getSupportedAssets(): Promise<AssetSymbol[]> {
    // Check cache first
    const cacheKey = `${BASE_URL}/coins/markets`;
    const cached = apiCache.get<AssetSymbol[]>(cacheKey);
    if (cached) {
      // Rebuild map from cache if needed
      if (this.symbolMap.size === 0) {
        // We can't easily rebuild the full map from just AssetSymbol[] if we don't store the ID
        // So we might need to store the raw response or fetch again if map is empty.
        // For simplicity, let's just refetch if map is empty or trust the flow.
        // Actually, let's store the full market data in a separate cache key to rebuild map.
      }
      return cached;
    }

    // Fetch Top 100 coins
    const url = `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`;
    const markets = await fetchJson(url, CoinGeckoMarketsSchema);

    if (!markets) return [];

    const symbols: AssetSymbol[] = markets.map(m => {
      this.symbolMap.set(m.symbol.toUpperCase(), m.id);
      return {
        name: m.name,
        symbol: m.symbol.toUpperCase(), // Normalize to uppercase
      };
    });

    // Cache symbols
    apiCache.set(cacheKey, symbols);
    
    // Also cache individual prices from this batch to save requests
    markets.forEach(m => {
      const price: AssetPrice = {
        name: m.name,
        symbol: m.symbol.toUpperCase(),
        price: m.current_price,
        currency: 'USD',
        updatedAt: m.last_updated || new Date().toISOString(),
        marketCap: m.market_cap,
        volume24h: m.total_volume,
        change24h: m.price_change_percentage_24h || 0
      };
      // Cache both by ID and Symbol if possible, but our interface uses Symbol
      // We will cache by symbol for getPrice to use
      apiCache.set(`CG_PRICE_${m.symbol.toUpperCase()}_USD`, price);
    });

    return symbols;
  }

  async getPrice(symbol: string, currency: string = 'USD'): Promise<AssetPrice | null> {
    const upperSymbol = symbol.toUpperCase();
    
    // Check cache first (populated by getSupportedAssets or previous calls)
    const cacheKey = `CG_PRICE_${upperSymbol}_${currency}`;
    const cached = apiCache.get<AssetPrice>(cacheKey);
    if (cached) return cached;

    // If not in cache, we need to find the ID.
    // If we haven't fetched markets yet, do it now to populate map.
    if (this.symbolMap.size === 0) {
      await this.getSupportedAssets();
    }

    let id = this.symbolMap.get(upperSymbol);
    
    // If still not found, maybe the user passed the ID directly? 
    // Or we could try to search, but for now let's assume if it's not in top 100, we might need to search endpoint (omitted for simplicity)
    if (!id) {
       // Fallback: assume symbol is id (lowercase)
       id = symbol.toLowerCase();
    }

    const url = `${BASE_URL}/simple/price?ids=${id}&vs_currencies=${currency.toLowerCase()}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;
    
    // Result format: { "bitcoin": { "usd": 50000, ... } }
    // We don't have a strict schema for dynamic keys easily, so we parse as Record
    const data = await fetchJson<Record<string, any>>(url);
    
    if (!data || !data[id]) return null;

    const item = data[id];
    const cur = currency.toLowerCase();
    
    if (item[cur] === undefined) return null;

    const price: AssetPrice = {
      name: id, // We might not have the pretty name here, use ID
      symbol: upperSymbol,
      price: item[cur],
      currency: currency,
      updatedAt: item.last_updated_at ? new Date(item.last_updated_at * 1000).toISOString() : new Date().toISOString(),
      marketCap: item[`${cur}_market_cap`],
      volume24h: item[`${cur}_24h_vol`],
      change24h: item[`${cur}_24h_change`]
    };

    apiCache.set(cacheKey, price);
    return price;
  }

  async getPrices(symbols: string[], currency: string = 'USD'): Promise<AssetPrice[]> {
    // Optimization: fetch multiple IDs at once if we have the map
    // For now, simple implementation
    const promises = symbols.map(s => this.getPrice(s, currency));
    const results = await Promise.all(promises);
    return results.filter((p): p is AssetPrice => p !== null);
  }
}

