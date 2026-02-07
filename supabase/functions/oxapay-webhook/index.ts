import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    
    console.log("OxaPay Webhook received:", JSON.stringify(body, null, 2));

    const { trackId, status, orderId, amount, payCurrency, network, txID } = body;

    // Validate required fields
    if (!orderId) {
      console.error("Missing orderId in webhook");
      return new Response("Missing orderId", { status: 400 });
    }

    // Only process when payment is confirmed
    if (status !== "Paid") {
      console.log(`Payment status: ${status}, skipping processing`);
      return new Response("OK", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find deposit by orderId (which is the deposit.id)
    const { data: deposit, error: fetchError } = await supabase
      .from("deposits")
      .select("id, user_id, status, amount")
      .eq("id", orderId)
      .single();

    if (fetchError || !deposit) {
      console.error("Deposit not found:", orderId, fetchError);
      return new Response("Deposit not found", { status: 404 });
    }

    console.log("Found deposit:", deposit);

    // Check if already processed
    if (deposit.status === "approved") {
      console.log("Deposit already processed, skipping");
      return new Response("Already processed", { status: 200 });
    }

    // Update deposit to approved
    const { error: updateError } = await supabase
      .from("deposits")
      .update({
        status: "approved",
        processed_at: new Date().toISOString(),
        admin_notes: `Pago via OxaPay - ${payCurrency || 'CRYPTO'} (${network || 'N/A'}) - TxID: ${txID || 'N/A'}`,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating deposit:", updateError);
      return new Response("Error updating deposit", { status: 500 });
    }

    console.log("Deposit updated to approved");

    // Credit user balance using the deposit amount (not the crypto amount)
    const depositAmount = parseFloat(String(deposit.amount));
    
    const { error: balanceError } = await supabase.rpc("increment_balance", {
      p_user_id: deposit.user_id,
      p_amount: depositAmount,
    });

    if (balanceError) {
      console.error("Error crediting balance via RPC:", balanceError);
      
      // Fallback: update balance directly
      const { data: profile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", deposit.user_id)
        .single();

      if (profileFetchError) {
        console.error("Error fetching profile:", profileFetchError);
        return new Response("Error crediting balance", { status: 500 });
      }

      const newBalance = (parseFloat(String(profile.balance)) || 0) + depositAmount;
      
      const { error: directUpdateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", deposit.user_id);

      if (directUpdateError) {
        console.error("Error with direct balance update:", directUpdateError);
        return new Response("Error crediting balance", { status: 500 });
      }

      console.log("Balance credited via direct update:", depositAmount);
    } else {
      console.log("Balance credited via RPC:", depositAmount);
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: deposit.user_id,
        type: "deposit",
        amount: depositAmount,
        reference_id: orderId,
        description: `Depósito via OxaPay - ${payCurrency || 'CRYPTO'}`,
      });

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError);
      // Don't fail the webhook for this, balance is already credited
    }

    console.log(`Deposit ${orderId} approved successfully, balance credited: $${depositAmount}`);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error in oxapay-webhook:", error);
    return new Response("Internal server error", { status: 500 });
  }
});
