// =====================================================================
// Supabase Edge Function: scan-plan
// ---------------------------------------------------------------------
// Membaca FOTO (sertifikat tanah / denah kertas) dengan AI Vision (OpenAI),
// lalu mengembalikan data terstruktur (ukuran tanah + daftar ruangan).
//   • API key OpenAI dibaca dari tabel app_settings (diisi admin).
//   • Wajib login. Kuota bulanan ringan: free 2×, pro 20×, dev 100×.
//   • mode = "sertifikat"  → { landW, landH, luas, alamat }
//   • mode = "denah"       → { landW, landH, rooms:[{type,w,h,x,y}] }
//
// Deploy: Supabase → Edge Functions → New function "scan-plan" → tempel ini.
// =====================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

const QUOTA: Record<string, number> = { free: 2, pro: 20, dev: 100 };

const PROMPT_SERTIFIKAT = `Kamu membaca foto SERTIFIKAT TANAH / surat ukur Indonesia.
Ekstrak ukuran tanah. Jika ada gambar bidang tanah, perkirakan lebar (sisi menghadap jalan) dan panjang dalam meter.
Jika hanya luas (m2) yang tertulis, perkirakan bentuk persegi panjang yang wajar (rasio ~2:3).
Balas HANYA JSON valid tanpa teks lain:
{"landW": <meter lebar>, "landH": <meter panjang>, "luas": <m2 jika ada, atau null>, "alamat": <string atau null>, "catatan": <ringkas, string>}`;

const PROMPT_DENAH = `Kamu membaca foto DENAH RUMAH (floor plan) di atas kertas.
Identifikasi ukuran keseluruhan bangunan (lebar x panjang, meter) dan daftar ruangan.
Untuk tiap ruangan beri: type (nama Indonesia: Ruang Tamu, Kamar Tidur, Dapur, Kamar Mandi, Ruang Makan, Garasi, Teras, dll),
w (lebar m), h (panjang m), x (posisi kiri m dari sudut kiri-atas bangunan), y (posisi atas m).
Perkirakan angka yang masuk akal bila tidak terbaca jelas. Maksimal 12 ruangan.
Balas HANYA JSON valid tanpa teks lain:
{"landW": <m>, "landH": <m>, "rooms": [{"type":"...","w":<m>,"h":<m>,"x":<m>,"y":<m>}], "catatan": <ringkas>}`;

function extractJSON(txt: string) {
  if (!txt) return null;
  // buang code fence
  let s = txt.replace(/```json|```/gi, "").trim();
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try { return JSON.parse(s); } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "Tidak ada sesi login." }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: ud, error: uErr } = await db.auth.getUser(jwt);
    if (uErr || !ud?.user) return json({ error: "Sesi tidak valid." }, 401);
    const user = ud.user;

    const { data: sub } = await db.from("subscriptions").select("plan").eq("user_id", user.id).maybeSingle();
    const plan = (sub?.plan as string) || "free";
    const quota = QUOTA[plan] ?? 2;

    // kuota bulanan (pakai tabel render_account kolom scan_used, atau hitung sederhana)
    const period = new Date().toISOString().slice(0, 7);
    let { data: acct } = await db.from("scan_account").select("*").eq("user_id", user.id).maybeSingle();
    if (!acct) {
      const ins = await db.from("scan_account").insert({ user_id: user.id, period, used: 0 }).select().single();
      acct = ins.data;
    } else if (acct.period !== period) {
      const upd = await db.from("scan_account").update({ period, used: 0 }).eq("user_id", user.id).select().single();
      acct = upd.data;
    }
    const used = acct?.used ?? 0;
    const remaining = Math.max(0, quota - used);

    const body = await req.json().catch(() => ({}));
    if (body?.action === "status") return json({ plan, quota, used, remaining });

    if (remaining <= 0) return json({ error: "QUOTA_EMPTY", plan, quota, remaining: 0 }, 402);

    const { imageBase64, mode } = body || {};
    if (!imageBase64) return json({ error: "Tidak ada gambar." }, 400);

    const { data: settings } = await db.from("app_settings").select("openai_key").eq("id", 1).maybeSingle();
    const key = settings?.openai_key;
    if (!key) return json({ error: "Admin belum mengatur API key OpenAI di Panel Admin." }, 503);

    const prompt = mode === "denah" ? PROMPT_DENAH : PROMPT_SERTIFIKAT;
    const dataUrl = imageBase64.startsWith("data:") ? imageBase64 : ("data:image/jpeg;base64," + imageBase64);

    const oai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Kamu asisten arsitektur yang membaca dokumen & denah. Balas hanya JSON." },
          { role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ] },
        ],
        max_tokens: 900,
        temperature: 0.1,
      }),
    });
    const oaiData = await oai.json().catch(() => ({}));
    if (!oai.ok) return json({ error: oaiData?.error?.message || ("OpenAI HTTP " + oai.status) }, 502);
    const txt = oaiData?.choices?.[0]?.message?.content || "";
    const parsed = extractJSON(txt);
    if (!parsed) return json({ error: "AI tidak bisa membaca gambar. Coba foto lebih jelas / terang.", raw: txt }, 422);

    // potong kuota setelah sukses
    await db.from("scan_account").update({ used: used + 1, updated_at: new Date().toISOString() }).eq("user_id", user.id);

    return json({ mode: mode || "sertifikat", result: parsed, remaining: remaining - 1 });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
