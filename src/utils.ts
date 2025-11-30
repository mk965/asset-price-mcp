
import nodeFetch from 'node-fetch';
import { z } from 'zod';

// @ts-ignore
const fetchToUse = globalThis.fetch || nodeFetch;

const DEFAULT_USER_AGENT = "asset-price-tracker/1.0";
const DEFAULT_TIMEOUT = 10000;

export async function fetchWithTimeout(url: string, options: any = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetchToUse(url, {
      ...options,
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "application/json",
        ...options.headers,
      },
      signal: controller.signal
    });
    return response;
  }
  finally {
    clearTimeout(id);
  }
}

export async function fetchJson<T>(url: string, schema?: z.ZodSchema<T>): Promise<T | null> {
  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      console.warn(`HTTP error! status: ${response.status}, url: ${url}`);
      return null;
    }

    const data = await response.json();
    
    if (schema) {
      return schema.parse(data);
    }
    
    return data as T;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error(`Schema validation failed for ${url}:`, error.errors);
    } else {
      console.error(`API request failed for ${url}:`, error.message);
    }
    return null;
  }
}

