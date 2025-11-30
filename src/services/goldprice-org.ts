
import { PriceService, AssetSymbol, AssetPrice } from "../types.js";
import { fetchJson } from "../utils.js";
import { apiCache } from "../cache.js";

const BASE_URL = 'https://data-asg.goldprice.org/dbXRates/USD';

interface GoldPriceOrgResponse {
  items: Array<{
    curr: string;
    xauPrice: number;
    xagPrice: number;
    chgXau: number;
    chgXag: number;
    pcXau: number;
    pcXag: number;
  }>;
  date: string;
}

export class GoldPriceOrgService implements PriceService {
  getName(): string {
    return "GoldPriceOrg";
  }

  async getSupportedAssets(): Promise<AssetSymbol[]> {
    return [
      { name: "Gold", symbol: "XAU" },
      { name: "Silver", symbol: "XAG" }
    ];
  }

  async getPrice(symbol: string, _currency: string = 'USD'): Promise<AssetPrice | null> {
    const upperSymbol = symbol.toUpperCase();
    if (upperSymbol !== 'XAU' && upperSymbol !== 'XAG') {
      return null;
    }

    // This API primarily supports USD. We return USD here and let the tool handle conversion.
    const cacheKey = "GOLD_PRICE_ORG_DATA";
    let data = apiCache.get<GoldPriceOrgResponse>(cacheKey);

    if (!data) {
      data = await fetchJson<GoldPriceOrgResponse>(BASE_URL);
      if (data) {
        apiCache.set(cacheKey, data);
      }
    }

    if (!data || !data.items || data.items.length === 0) return null;

    const item = data.items[0];
    const isGold = upperSymbol === 'XAU';
    
    const price = isGold ? item.xauPrice : item.xagPrice;
    // const changeAmount = isGold ? item.chgXau : item.chgXag;
    const changePercent = isGold ? item.pcXau : item.pcXag;

    return {
      name: isGold ? "Gold" : "Silver",
      symbol: upperSymbol,
      price: price,
      currency: "USD",
      updatedAt: new Date().toISOString(), // The API returns a formatted date string, using current time for simplicity or could parse `data.date`
      updatedAtReadable: data.date,
      change24h: changePercent
    };
  }

  async getPrices(symbols: string[], currency: string = 'USD'): Promise<AssetPrice[]> {
    const promises = symbols.map(s => this.getPrice(s, currency));
    const results = await Promise.all(promises);
    return results.filter((p): p is AssetPrice => p !== null);
  }
}

