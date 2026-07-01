/* DadiOmah — pelacak kunjungan ringan.
   Load SETELAH js/supabase-config.js. Tidak butuh supabase-js.
   Mencatat 1 kunjungan per halaman tiap 30 menit per pengunjung. */
(function () {
  try {
    var URL = window.SUPABASE_URL, KEY = window.SUPABASE_ANON_KEY;
    if (!URL || !KEY) return;

    var path = location.pathname || '/';
    // jangan hitung halaman internal admin
    if (/admin\.html$/i.test(path)) return;

    // ID pengunjung anonim (tersimpan lokal, tanpa data pribadi)
    var vid = null;
    try { vid = localStorage.getItem('do_vid'); } catch (e) {}
    if (!vid) {
      vid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      try { localStorage.setItem('do_vid', vid); } catch (e) {}
    }

    // dedupe: satu hit per halaman per 30 menit
    var k = 'do_hit_' + path, now = Date.now(), last = 0;
    try { last = +(sessionStorage.getItem(k) || 0); } catch (e) {}
    if (now - last < 1800000) return;
    try { sessionStorage.setItem(k, String(now)); } catch (e) {}

    var body = JSON.stringify({
      path: path,
      referrer: document.referrer || null,
      visitor_id: vid
    });

    fetch(URL + '/rest/v1/page_views', {
      method: 'POST',
      headers: {
        'apikey': KEY,
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: body,
      keepalive: true
    }).catch(function () {});
  } catch (e) {}
})();
