import { corsHeaders } from "../_shared/cors.ts";

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin",
  DOT: "polkadot",
  USDT: "tether",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  UNI: "uniswap",
  ATOM: "cosmos",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  NEAR: "near",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { symbols } = await req.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: "symbols array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching prices for symbols:", symbols);

    // Map symbols to CoinGecko IDs
    const ids = symbols
      .map((s: string) => COINGECKO_IDS[s.toUpperCase()])
      .filter(Boolean)
      .join(",");

    if (!ids) {
      return new Response(
        JSON.stringify({ error: "No valid symbols found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("CoinGecko IDs:", ids);

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error("CoinGecko API error:", response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: `CoinGecko API error: ${response.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("CoinGecko response:", data);

    // Transform response to expected format
    const prices: Record<string, { price: number; change: number }> = {};

    for (const symbol of symbols) {
      const geckoId = COINGECKO_IDS[symbol.toUpperCase()];
      if (geckoId && data[geckoId]) {
        prices[symbol] = {
          price: data[geckoId].usd,
          change: data[geckoId].usd_24h_change || 0,
        };
      }
    }

    console.log("Transformed prices:", prices);

    return new Response(JSON.stringify(prices), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
