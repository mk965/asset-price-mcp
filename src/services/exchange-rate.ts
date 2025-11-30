
import { fetchJson } from "../utils.js";
import { apiCache } from "../cache.js";

const RATE_API_PRIMARY = 'https://open.er-api.com/v6/latest/USD';
const RATE_API_BACKUP = 'https://api.exchangerate-api.com/v4/latest/USD';

interface RatesResponse {
  base_code?: string;
  base?: string;
  rates: Record<string, number>;
}

export class ExchangeRateService {
  async getRate(from: string, to: string): Promise<number | null> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (fromUpper === toUpper) return 1;

    // Currently our APIs are USD based
    // If from is USD, we just look up the rate
    // If from is not USD, we might need cross rate (not implemented fully for efficiency, assuming base is USD)
    
    // Check cache for USD rates
    const cacheKey = "EXCHANGE_RATES_USD";
    let rates = apiCache.get<Record<string, number>>(cacheKey);

    if (!rates) {
      rates = await this.fetchRates();
      if (rates) {
        apiCache.set(cacheKey, rates); // Cache default TTL
      }
    }

    if (!rates) return null;

    // If source is USD
    if (fromUpper === 'USD') {
      return rates[toUpper] || null;
    }

    // If source is not USD, convert to USD then to Target
    // e.g. EUR -> CNY = (USD -> CNY) / (USD -> EUR)
    const usdToFrom = rates[fromUpper];
    const usdToTo = rates[toUpper];

    if (usdToFrom && usdToTo) {
      return usdToTo / usdToFrom;
    }

    return null;
  }

  private async fetchRates(): Promise<Record<string, number> | null> {
    // Try primary
    let data = await fetchJson<RatesResponse>(RATE_API_PRIMARY);
    
    if (!data) {
      // Try backup
      console.warn("Primary exchange rate API failed, trying backup...");
      data = await fetchJson<RatesResponse>(RATE_API_BACKUP);
    }

    return data?.rates || null;
  }
}

