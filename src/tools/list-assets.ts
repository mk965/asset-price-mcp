
import { PriceService, AssetSymbol } from "../types.js";

export const registerListAssetsTool = (server: any, services: PriceService[]) => {
  server.tool(
    "list_assets",
    "List all supported assets available for price queries",
    {},
    async () => {
      const allAssets: AssetSymbol[] = [];
      
      for (const service of services) {
        try {
          const assets = await service.getSupportedAssets();
          // Add source info or handle duplicates?
          // For now, just concat and maybe dedupe by symbol
          allAssets.push(...assets);
        } catch (error) {
          console.error(`Failed to fetch assets from ${service.getName()}:`, error);
        }
      }

      // Deduplicate by symbol
      const seen = new Set();
      const uniqueAssets = allAssets.filter(asset => {
        if (seen.has(asset.symbol)) return false;
        seen.add(asset.symbol);
        return true;
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(uniqueAssets, null, 2)
        }]
      };
    }
  );
};

