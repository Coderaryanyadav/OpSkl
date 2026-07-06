import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Secure constant-time comparison helper to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyRazorpaySignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body)
    );
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const generatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return constantTimeCompare(generatedSignature, signature);
  } catch (_e) {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";

    // Signature verification check using constant-time comparison
    if (secret && !(await verifyRazorpaySignature(bodyText, signature, secret))) {
      return new Response(JSON.stringify({ error: "Invalid signature verification" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event === "payment.captured") {
      const payment = payload.payload.payment.entity;
      const amount = payment.amount / 100; // Razorpay amounts are in paise
      const currency = payment.currency;
      
      const userId = payment.notes?.user_id;
      const transactionId = payment.notes?.transaction_id;

      if (userId) {
        // Run database queries in order
        // 1. Update wallet balance via Postgres function RPC
        const { error: rpcError } = await supabase.rpc("update_wallet_balance", {
          p_user_id: userId,
          p_amount: amount,
          p_operation: "add"
        });

        if (rpcError) throw rpcError;

        // 2. Log transaction or update pending deposit record
        if (transactionId) {
          await supabase
            .from("transactions")
            .update({
              status: "completed",
              payment_gateway_transaction_id: payment.id,
              payment_method: payment.method,
              completed_at: new Date().toISOString()
            })
            .eq("id", transactionId);
        } else {
          // Create transaction directly
          await supabase.from("transactions").insert({
            to_user_id: userId,
            amount: amount,
            currency: currency,
            type: "deposit",
            status: "completed",
            payment_gateway: "razorpay",
            payment_gateway_transaction_id: payment.id,
            payment_method: payment.method,
            description: "Razorpay Webhook Wallet Deposit",
            completed_at: new Date().toISOString()
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
