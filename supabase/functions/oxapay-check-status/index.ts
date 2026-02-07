import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OXAPAY_MERCHANT_KEY = Deno.env.get("OXAPAY_MERCHANT_KEY");
    
    if (!OXAPAY_MERCHANT_KEY) {
      console.error("OXAPAY_MERCHANT_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { trackId, depositId } = await req.json();

    console.log("Checking OxaPay status:", { trackId, depositId });

    if (!trackId) {
      return new Response(
        JSON.stringify({ error: "trackId is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Call OxaPay inquiry API
    const response = await fetch("https://api.oxapay.com/merchants/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: OXAPAY_MERCHANT_KEY,
        trackId: trackId,
      }),
    });

    const data = await response.json();
    console.log("OxaPay inquiry response:", JSON.stringify(data));

    // OxaPay returns result: 100 for success
    if (data.result !== 100) {
      console.error("OxaPay inquiry failed:", data);
      return new Response(
        JSON.stringify({ 
          error: data.message || "Error checking payment status",
          result: data.result
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Return status info to frontend
    const statusResponse = {
      status: data.status,
      amount: data.amount,
      payAmount: data.payAmount,
      payCurrency: data.payCurrency,
      network: data.network,
      address: data.address,
      txID: data.txID,
      expiredAt: data.expiredAt,
      trackId: data.trackId,
    };

    console.log("Returning status:", JSON.stringify(statusResponse));

    return new Response(
      JSON.stringify(statusResponse),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in oxapay-check-status:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
