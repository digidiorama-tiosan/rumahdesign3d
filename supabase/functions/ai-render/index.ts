// =====================================================================
// Supabase Edge Function: ai-render
// ---------------------------------------------------------------------
// Memproses AI Render fotorealistik DENGAN AMAN:
//   • API key OpenAI dibaca dari tabel app_settings (diisi admin) — tidak
//     pernah dikirim ke browser user.
//   • Kuota dicek di server: Free = 0 (tidak bisa render), Pro = 1×/bulan,
//     Dev = 3×/bulan (reset bulanan). Model: gpt-image-1-mini.
//   • Kalau kuota gratis habis tapi punya kredit berbayar → pakai 1 kredit.
//   • Kalau habis total → balas 402 QUOTA_EMPTY (app menampilkan tombol beli).
//
// Cara deploy: lihat DEPLOY-AI-RENDER.md.
// =====================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function b64ToBlob(b64: string, type: string) {
  const clean = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(clean);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type });
}

const QUOTA: Record<string, number> = { free: 0, pro: 1, dev: 3 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "Tidak ada sesi login." }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    // siapa yang memanggil?
    const { data: ud, error: uErr } = await db.auth.getUser(jwt);
    if (uErr || !ud?.user) return json({ error: "Sesi tidak valid." }, 401);
    const user = ud.user;

    // paket
    const { data: sub } = await db.from("subscriptions").select("plan").eq("user_id", user.id).maybeSingle();
    const plan = (sub?.plan as string) || "free";
    const freeQuota = QUOTA[plan] ?? 0;

    // akun render (reset bulanan)
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM (UTC)
    let { data: acct } = await db.from("render_account").select("*").eq("user_id", user.id).maybeSingle();
    if (!acct) {
      const ins = await db.from("render_account")
        .insert({ user_id: user.id, period, used: 0, credits: 0 }).select().single();
      acct = ins.data;
    } else if (acct.period !== period) {
      const upd = await db.from("render_account")
        .update({ period, used: 0, updated_at: new Date().toISOString() })
        .eq("user_id", user.id).select().single();
      acct = upd.data;
    }

    const used = acct?.used ?? 0;
    const credits = acct?.credits ?? 0;
    const remainingFree = Math.max(0, freeQuota - used);

    const body = await req.json().catch(() => ({}));

    // hanya minta status kuota
    if (body?.action === "status") {
      return json({ plan, freeQuota, used, remainingFree, credits });
    }

    // butuh kuota untuk render
    let useCredit = false;
    if (remainingFree <= 0) {
      if (credits > 0) useCredit = true;
      else return json({ error: "QUOTA_EMPTY", plan, freeQuota, remainingFree: 0, credits: 0 }, 402);
    }

    // ambil key OpenAI (admin-set)
    const { data: settings } = await db.from("app_settings").select("openai_key").eq("id", 1).maybeSingle();
    const key = settings?.openai_key;
    if (!key) return json({ error: "Admin belum mengatur API key OpenAI di Panel Admin." }, 503);

    const { imageBase64, prompt, size, quality } = body || {};
    if (!imageBase64 || !prompt) return json({ error: "Data render tidak lengkap." }, 400);

    // panggil OpenAI images/edits
    const fd = new FormData();
    fd.append("model", "gpt-image-1-mini");
    fd.append("image", b64ToBlob(imageBase64, "image/png"), "scene.png");
    fd.append("prompt", String(prompt));
    fd.append("size", String(size || "1024x1024"));
    fd.append("quality", String(quality || "medium"));
    fd.append("n", "1");

    const oai = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: "Bearer " + key },
      body: fd,
    });
    const oaiData = await oai.json().catch(() => ({}));
    if (!oai.ok) {
      const eMsg = oaiData?.error?.message || "";
      const eType = (oaiData?.error?.type || "") + " " + (oaiData?.error?.code || "");
      // Kredit/kuota OpenAI (admin) habis → pemotongan kuota BELUM terjadi (hanya setelah sukses),
      // jadi kuota render pelanggan tetap aman. Balas pesan ramah + kode khusus.
      const providerOut = oai.status === 429 || /quota|billing|insufficient|exceeded|hard_limit|payment/i.test(eType + " " + eMsg);
      if (providerOut) {
        return json({
          code: "PROVIDER_QUOTA",
          error: "Maaf, layanan Render AI sedang tidak tersedia sementara. Kuota render Anda TIDAK terpotong dan tetap aman — silakan coba lagi beberapa menit lagi.",
        }, 503);
      }
      return json({ error: oaiData?.error?.message || ("OpenAI HTTP " + oai.status) }, 502);
    }
    const b64 = oaiData?.data?.[0]?.b64_json;
    if (!b64) return json({ error: "Respons OpenAI kosong." }, 502);

    // potong kuota SETELAH sukses
    if (useCredit) {
      await db.from("render_account").update({ credits: credits - 1, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    } else {
      await db.from("render_account").update({ used: used + 1, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    }
    const newRemainingFree = useCredit ? remainingFree : Math.max(0, freeQuota - (used + 1));
    const newCredits = useCredit ? credits - 1 : credits;

    return json({ image: "data:image/png;base64," + b64, remainingFree: newRemainingFree, credits: newCredits });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
