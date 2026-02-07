import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OXAPAY_MERCHANT_KEY = Deno.env.get("OXAPAY_MERCHANT_KEY");
    if (!OXAPAY_MERCHANT_KEY) {
      console.error("OXAPAY_MERCHANT_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount, depositId, returnUrl } = await req.json();

    console.log("Creating OxaPay invoice:", { amount, depositId, returnUrl });

    // Validate inputs
    if (!amount || !depositId || !returnUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, depositId, returnUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount < 50) {
      return new Response(
        JSON.stringify({ error: "Minimum deposit amount is $50" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const callbackUrl = `${SUPABASE_URL}/functions/v1/oxapay-webhook`;

    console.log("OxaPay callbackUrl:", callbackUrl);

    // Create invoice on OxaPay
    const response = await fetch("https://api.oxapay.com/merchants/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: OXAPAY_MERCHANT_KEY,
        amount: amount,
        currency: "USD",
        callbackUrl: callbackUrl,
        returnUrl: returnUrl,
        orderId: depositId,
        description: `Depósito #${depositId}`,
        lifeTime: 60, // 60 minutes to pay
        feePaidByPayer: 1, // Fees paid by customer
      }),
    });

    const data = await response.json();

    console.log("OxaPay response:", data);

    // Result 100 means success according to OxaPay docs
    if (data.result !== 100) {
      console.error("OxaPay error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Error creating payment invoice" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update deposit with trackId and payLink
    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: updateError } = await supabase
      .from("deposits")
      .update({
        oxapay_track_id: data.trackId,
        oxapay_pay_link: data.payLink,
      })
      .eq("id", depositId);

    if (updateError) {
      console.error("Error updating deposit with OxaPay data:", updateError);
    }

    console.log("Invoice created successfully:", { trackId: data.trackId, payLink: data.payLink });

    return new Response(
      JSON.stringify({
        trackId: data.trackId,
        payLink: data.payLink,
        expiredAt: data.expiredAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in oxapay-create-invoice:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
