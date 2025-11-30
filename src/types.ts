
import { z } from "zod";

export const AssetSymbolSchema = z.object({
  name: z.string(),
  symbol: z.string(),
});

export const AssetPriceSchema = z.object({
  name: z.string(),
  price: z.number(),
  symbol: z.string(),
  updatedAt: z.string(),
  updatedAtReadable: z.string().optional(),
  currency: z.string().default('USD'),
  marketCap: z.number().optional(),
  volume24h: z.number().optional(),
  change24h: z.number().optional(),
});

export type AssetSymbol = z.infer<typeof AssetSymbolSchema>;
export type AssetPrice = z.infer<typeof AssetPriceSchema>;

export interface PriceService {
  getName(): string;
  getSupportedAssets(): Promise<AssetSymbol[]>;
  getPrice(symbol: string, currency?: string): Promise<AssetPrice | null>;
  getPrices(symbols: string[], currency?: string): Promise<AssetPrice[]>;
}

