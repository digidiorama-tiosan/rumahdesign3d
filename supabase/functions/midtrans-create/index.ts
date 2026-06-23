// Supabase Edge Function: midtrans-create
// Deploy: supabase functions deploy midtrans-create
// Env vars needed: MIDTRANS_SERVER_KEY, MIDTRANS_ENV (sandbox|production)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { orderId, amount, items, customerName, customerEmail } = await req.json();

    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    const isProduction = Deno.env.get("MIDTRANS_ENV") === "production";
    const baseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY not set");

    const payload = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: items || [{ id: "plan", price: amount, quantity: 1, name: "RumahDesign3D" }],
      customer_details: { first_name: customerName || "User", email: customerEmail || "" },
      callbacks: {
        finish: "https://rumahdesign3d.vercel.app/Akun.html?payment=success",
        error: "https://rumahdesign3d.vercel.app/Akun.html?payment=error",
        pending: "https://rumahdesign3d.vercel.app/Akun.html?payment=pending",
      },
    };

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(serverKey + ":"),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error("Midtrans error: " + err);
    }

    const data = await response.json();
    return new Response(JSON.stringify({ token: data.token, redirect_url: data.redirect_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
