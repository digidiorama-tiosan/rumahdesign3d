// =====================================================================
// PWA GLUE — registers the service worker and handles "Install app".
// Exposes window.__pwaInstall() (used by the mobile ⋯ sheet) and shows a
// small floating Install chip when the browser offers installation.
// =====================================================================
(function () {
  'use strict';

  // --- register service worker ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) {
        console.warn('SW register failed', e);
      });
    });
  }

  // --- install prompt capture ---
  var deferred = null;

  window.__pwaInstall = function () {
    if (!deferred) {
      // Already installed, or browser doesn't support programmatic prompt (e.g. iOS)
      var iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (iOS) {
        alert('Untuk memasang di iPhone/iPad: tombol Bagikan (⬆) di Safari → "Tambah ke Layar Utama".');
      } else if (window.matchMedia('(display-mode: standalone)').matches) {
        alert('Aplikasi sudah terpasang. ✓');
      } else {
        alert('Buka menu browser (⋮) lalu pilih "Pasang aplikasi" / "Add to Home screen".');
      }
      return;
    }
    deferred.prompt();
    deferred.userChoice.finally(function () { deferred = null; hideChip(); });
  };

  function hideChip() { var c = document.getElementById('pwaInstallChip'); if (c) c.remove(); }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    showChip();
  });

  window.addEventListener('appinstalled', function () { deferred = null; hideChip(); });

  function showChip() {
    if (document.getElementById('pwaInstallChip')) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    var b = document.createElement('button');
    b.id = 'pwaInstallChip';
    b.type = 'button';
    b.textContent = '⬇ Pasang App';
    b.style.cssText = [
      'position:fixed', 'z-index:1150', 'top:58px', 'left:50%', 'transform:translateX(-50%)',
      'background:linear-gradient(135deg,#f5a623,#e8523a)', 'color:#fff', 'border:none',
      'font-family:inherit', 'font-size:12.5px', 'font-weight:800', 'padding:9px 16px',
      'border-radius:22px', 'box-shadow:0 6px 22px rgba(0,0,0,.45)', 'cursor:pointer'
    ].join(';');
    b.addEventListener('click', window.__pwaInstall);
    document.body.appendChild(b);
    // auto-dismiss the floating chip after a while (still available in ⋯ sheet)
    setTimeout(hideChip, 12000);
  }
})();
