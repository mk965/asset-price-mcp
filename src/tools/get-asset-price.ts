
import { z } from "zod";
import { PriceService, AssetPrice } from "../types.js";
import { ExchangeRateService } from "../services/exchange-rate.js";

const GetAssetPriceArgs = z.object({
  symbol: z.string().optional().describe("The asset symbol to query (e.g., XAU, BTC, AAPL). If omitted, returns a default list of major assets."),
  currency: z.string().default("USD").describe("The currency to express the price in (default: USD)")
});

const DEFAULT_ASSETS = ["XAU", "XAG", "BTC", "ETH"];

export const registerGetAssetPriceTool = (server: any, services: PriceService[], exchangeService: ExchangeRateService) => {
  server.tool(
    "get_asset_price",
    "Retrieves current pricing information for specific assets or a default list of major assets. Supports automatic currency conversion.",
    GetAssetPriceArgs.shape, 
    async (args: any) => {
      const { symbol, currency } = GetAssetPriceArgs.parse(args);
      const targetCurrency = currency.toUpperCase();
      
      const symbolsToQuery = symbol ? [symbol.toUpperCase()] : DEFAULT_ASSETS;
      const results: AssetPrice[] = [];
      const errors: string[] = [];

      for (const sym of symbolsToQuery) {
        let found = false;
        let priceData: AssetPrice | null = null;

        // Try each service
        for (const service of services) {
            try {
                // First try to get price in requested currency directly (if service supports it)
                // Most of our services default to USD or might ignore currency param if not supported
                priceData = await service.getPrice(sym, targetCurrency);
                
                if (priceData) {
                    // Check if the service returned the price in the requested currency
                    if (priceData.currency.toUpperCase() !== targetCurrency) {
                        // Need conversion
                        const rate = await exchangeService.getRate(priceData.currency, targetCurrency);
                        if (rate) {
                            priceData = {
                                ...priceData,
                                price: priceData.price * rate,
                                currency: targetCurrency,
                                marketCap: priceData.marketCap ? priceData.marketCap * rate : undefined,
                                // Percent change remains the same
                            };
                        } else {
                            // If conversion failed, we keep original currency but maybe warn?
                            // For now, just return original currency price
                        }
                    }

                    results.push(priceData);
                    found = true;
                    break;
                }
            } catch (e) {
                console.error(`Error fetching ${sym} from ${service.getName()}:`, e);
            }
        }
        if (!found) {
            errors.push(`Could not find price for ${sym}`);
        }
      }

      if (results.length === 0 && errors.length > 0) {
        return {
          content: [{
            type: "text",
            text: `Failed to retrieve prices: ${errors.join(", ")}`
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text",
          text: formatPrices(results)
        }]
      };
    }
  );
};

function formatPrices(prices: AssetPrice[]): string {
  return prices.map(p => {
    let output = `Symbol: ${p.symbol}\nName: ${p.name}\nPrice: ${p.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${p.currency}`;
    if (p.change24h !== undefined) {
        const sign = p.change24h >= 0 ? "+" : "";
        output += `\n24h Change: ${sign}${p.change24h.toFixed(2)}%`;
    }
    if (p.marketCap) {
        output += `\nMarket Cap: ${p.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${p.currency}`;
    }
    output += `\nUpdated: ${p.updatedAt}`;
    if (p.updatedAtReadable) {
        output += ` (${p.updatedAtReadable})`;
    }
    return output;
  }).join("\n---\n");
}
