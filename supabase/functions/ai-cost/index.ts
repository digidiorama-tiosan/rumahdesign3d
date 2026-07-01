// =====================================================================
// Supabase Edge Function: ai-cost
// ---------------------------------------------------------------------
// Estimasi RAB (biaya bangun) dengan AI — AMAN:
//   • API key OpenAI dibaca dari app_settings (admin) — tak pernah ke browser.
//   • Wajib login. Biaya teks sangat kecil (gpt-4o-mini) → tanpa kuota.
//   • Mengembalikan JSON RAB terstruktur (rentang bawah–atas + rincian).
//   • Jika kredit OpenAI habis → pesan ramah (kuota user tidak terpotong).
//
// Deploy: sama seperti ai-render (dashboard → Edge Functions → ai-cost).
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "Tidak ada sesi login." }, 401);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: ud, error: uErr } = await db.auth.getUser(jwt);
    if (uErr || !ud?.user) return json({ error: "Sesi tidak valid." }, 401);

    const { data: settings } = await db.from("app_settings").select("openai_key").eq("id", 1).maybeSingle();
    const key = settings?.openai_key;
    if (!key) return json({ error: "Admin belum mengatur API key OpenAI di Panel Admin." }, 503);

    const b = await req.json().catch(() => ({}));
    const w = Number(b.w) || 6, l = Number(b.l) || 10;
    const storeys = b.storeys === 2 ? 2 : 1;
    const buildArea = Math.round(w * l * (storeys === 2 ? 1.7 : 1));
    const style = String(b.style || "Minimalis Modern");
    const city = String(b.city || "rata-rata Indonesia");
    const quality = String(b.quality || "menengah");
    const beds = Number(b.beds) || 2;
    const jenis = String(b.jenis || "Rumah Tinggal");
    const needs = Array.isArray(b.needs) ? b.needs.join(", ") : "";

    const system =
      "Anda adalah Quantity Surveyor (estimator biaya konstruksi) profesional di Indonesia. " +
      "Susun estimasi RAB pembangunan bangunan baru berdasarkan data yang diberikan. " +
      "Gunakan harga satuan wajar pasar Indonesia terkini (Rupiah). Perhitungkan lokasi kota, kualitas finishing, jumlah lantai, dan fitur tambahan. " +
      "Berikan RENTANG (bawah & atas) yang realistis. Jangan bertele-tele. " +
      "Balas HANYA JSON valid dengan skema persis: " +
      '{"per_m2_low":number,"per_m2_high":number,"total_low":number,"total_high":number,' +
      '"items":[{"name":string,"amount":number,"pct":number,"note":string}],' +
      '"assumptions":[string],"summary":string}. ' +
      "items harus mencakup minimal: Pekerjaan Persiapan, Struktur & Pondasi, Dinding & Plester, Atap, Lantai & Keramik, Pintu & Jendela, Finishing & Cat, MEP (listrik/air/sanitasi). " +
      "amount dalam Rupiah (angka murni tanpa titik), pct = persen dari total_high. summary singkat 1-2 kalimat Bahasa Indonesia.";

    const user =
      `Jenis bangunan: ${jenis}\nUkuran tanah: ${w} x ${l} m\nJumlah lantai: ${storeys}\n` +
      `Perkiraan luas bangunan: ${buildArea} m²\nJumlah kamar tidur: ${beds}\nGaya: ${style}\n` +
      `Kualitas finishing: ${quality}\nLokasi/kota: ${city}\nFitur tambahan: ${needs || "-"}\n` +
      `Hitung estimasi RAB pembangunan.`;

    const oai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 900,
      }),
    });
    const data = await oai.json().catch(() => ({}));
    if (!oai.ok) {
      const em = data?.error?.message || "";
      const et = (data?.error?.type || "") + " " + (data?.error?.code || "");
      if (oai.status === 429 || /quota|billing|insufficient|exceeded|hard_limit|payment/i.test(et + " " + em)) {
        return json({ code: "PROVIDER_QUOTA", error: "Maaf, layanan estimasi AI sedang tidak tersedia sementara. Coba lagi beberapa menit lagi." }, 503);
      }
      return json({ error: em || ("OpenAI HTTP " + oai.status) }, 502);
    }
    let parsed: unknown = null;
    try { parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}"); } catch (_) { parsed = null; }
    if (!parsed) return json({ error: "Respons AI tidak valid." }, 502);
    return json({ estimate: parsed, buildArea });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
