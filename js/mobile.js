// =====================================================================
// MOBILE / TABLET SUPPORT
//   1. Touch → mouse bridge for the floor canvas (single-finger draw/drag,
//      two-finger pinch-zoom + pan, double-tap = finish polygon).
//   2. Slide-in drawers for the left toolbar & right panel + a "⋯" action
//      sheet, with floating Tool/Panel buttons. All additive — no edits to
//      the existing desktop event handlers.
// Relies on globals from the app: canvas, panOffset, zoomLevel, render,
// updateScaleIndicator (all declared by render.js / interact.js).
// =====================================================================
(function () {
  'use strict';

  var MOBILE_MAX = 860;
  function isMobile() { return window.innerWidth <= MOBILE_MAX; }

  // ---------------------------------------------------------------
  // 1. TOUCH → MOUSE BRIDGE
  // ---------------------------------------------------------------
  function bridgeTouch() {
    var cv = (typeof canvas !== 'undefined') ? canvas : document.getElementById('floorCanvas');
    if (!cv) return;

    var active = false;     // single-finger gesture in progress
    var pinch = false;      // two-finger gesture in progress
    var last = null;        // {clientX, clientY} of last single touch
    var lastTap = 0;
    var pData = null;       // {dist, midX, midY}

    function pt(t) { return { clientX: t.clientX, clientY: t.clientY }; }
    function fire(type, p) {
      cv.dispatchEvent(new MouseEvent(type, {
        clientX: p.clientX, clientY: p.clientY,
        button: 0, bubbles: true, cancelable: true
      }));
    }
    function pinchInfo(e) {
      var a = e.touches[0], b = e.touches[1];
      var dx = b.clientX - a.clientX, dy = b.clientY - a.clientY;
      return { dist: Math.hypot(dx, dy), midX: (a.clientX + b.clientX) / 2, midY: (a.clientY + b.clientY) / 2 };
    }

    cv.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1 && !pinch) {
        active = true;
        last = pt(e.touches[0]);
        fire('mousedown', last);
        var now = Date.now();
        if (now - lastTap < 300) {
          cv.dispatchEvent(new MouseEvent('dblclick', { clientX: last.clientX, clientY: last.clientY, bubbles: true }));
        }
        lastTap = now;
      } else if (e.touches.length >= 2) {
        if (active) { fire('mouseup', last); active = false; }
        pinch = true;
        pData = pinchInfo(e);
      }
      e.preventDefault();
    }, { passive: false });

    cv.addEventListener('touchmove', function (e) {
      if (pinch && e.touches.length >= 2) {
        var info = pinchInfo(e);
        if (pData && typeof panOffset !== 'undefined') {
          var rect = cv.getBoundingClientRect();
          var mx = info.midX - rect.left, my = info.midY - rect.top;
          var factor = info.dist / (pData.dist || info.dist);
          var nz = Math.max(0.2, Math.min(5, zoomLevel * factor));
          // zoom around the pinch midpoint
          panOffset.x = mx - (mx - panOffset.x) * (nz / zoomLevel);
          panOffset.y = my - (my - panOffset.y) * (nz / zoomLevel);
          zoomLevel = nz;
          // pan by midpoint travel
          panOffset.x += (info.midX - pData.midX);
          panOffset.y += (info.midY - pData.midY);
          if (typeof updateScaleIndicator === 'function') updateScaleIndicator();
          render();
        }
        pData = info;
      } else if (active && e.touches.length === 1) {
        last = pt(e.touches[0]);
        fire('mousemove', last);
      }
      e.preventDefault();
    }, { passive: false });

    function end(e) {
      if (e.touches.length === 0) {
        if (active) { fire('mouseup', last); active = false; }
        pinch = false; pData = null;
      } else {
        // a finger lifted but others remain — stop any single-finger drag
        if (active) { fire('mouseup', last); active = false; }
      }
    }
    cv.addEventListener('touchend', end);
    cv.addEventListener('touchcancel', end);
  }

  // ---------------------------------------------------------------
  // 2. DRAWERS + ACTION SHEET
  // ---------------------------------------------------------------
  var toolbar, panel, backdrop, sheet;

  function closeAll() {
    [toolbar, panel, sheet, backdrop].forEach(function (el) { if (el) el.classList.remove('m-open'); });
  }
  function openDrawer(el) {
    var wasOpen = el.classList.contains('m-open');
    closeAll();
    if (!wasOpen) { el.classList.add('m-open'); if (backdrop) backdrop.classList.add('m-open'); }
  }

  function build() {
    toolbar = document.querySelector('.toolbar');
    panel = document.querySelector('.right-panel');

    // backdrop
    backdrop = document.createElement('div');
    backdrop.className = 'm-backdrop';
    backdrop.addEventListener('click', closeAll);
    document.body.appendChild(backdrop);

    // floating buttons
    var fabT = document.createElement('button');
    fabT.className = 'm-fab m-fab-tools';
    fabT.innerHTML = '<span class="mf-ic">🧰</span> Alat';
    fabT.addEventListener('click', function () { openDrawer(toolbar); });

    var fabP = document.createElement('button');
    fabP.className = 'm-fab m-fab-panel';
    fabP.innerHTML = '<span class="mf-ic">⚙️</span> Panel';
    fabP.addEventListener('click', function () { openDrawer(panel); });

    document.body.appendChild(fabT);
    document.body.appendChild(fabP);

    // floating Undo / Redo (mobile) — selalu tampil saat mengedit
    var undoWrap = document.createElement('div');
    undoWrap.className = 'm-undo-wrap';
    undoWrap.innerHTML =
      '<button class="m-undo-btn" data-uact="undo" title="Urungkan">↩</button>' +
      '<button class="m-undo-btn" data-uact="redo" title="Ulangi">↪</button>';
    document.body.appendChild(undoWrap);
    undoWrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-uact]'); if (!b) return;
      var a = b.getAttribute('data-uact');
      if (a === 'undo' && typeof undo === 'function') undo();
      if (a === 'redo' && typeof redo === 'function') redo();
    });

    // header "⋯" button
    var menuBtn = document.createElement('button');
    menuBtn.className = 'm-menu-btn';
    menuBtn.innerHTML = '⋯';
    menuBtn.title = 'Menu';
    menuBtn.addEventListener('click', function () { openDrawer(sheet); });
    var header = document.querySelector('header');
    if (header) header.appendChild(menuBtn);

    // action sheet
    sheet = document.createElement('div');
    sheet.className = 'm-sheet';
    sheet.innerHTML = buildSheetHTML();
    document.body.appendChild(sheet);
    sheet.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      closeAll();
      runAction(act);
    });

    // selecting a drawing tool closes the tools drawer so the canvas is visible
    if (toolbar) {
      toolbar.addEventListener('click', function (e) {
        if (e.target.closest('.tool-btn') && isMobile()) setTimeout(closeAll, 120);
      });
    }
    // switching main view closes any drawer
    ['vtab-2d', 'vtab-3d', 'vtab-rab'].forEach(function (id) {
      var t = document.getElementById(id);
      if (t) t.addEventListener('click', closeAll);
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
    window.addEventListener('resize', function () { if (!isMobile()) closeAll(); });
  }

  function item(act, ic, label, cls) {
    return '<button class="m-sheet-btn' + (cls ? ' ' + cls : '') + '" data-act="' + act + '">' +
           '<span class="msb-ic">' + ic + '</span>' + label + '</button>';
  }

  function buildSheetHTML() {
    return '<div class="m-sheet-grip"></div>' +
      '<div class="m-sheet-grp-label">Edit</div>' +
      '<div class="m-sheet-grid">' +
        item('undo', '↩', 'Urungkan') +
        item('redo', '↪', 'Ulangi') +
      '</div>' +
      '<div class="m-sheet-grp-label">Proyek</div>' +
      '<div class="m-sheet-grid">' +
        item('new', '🆕', 'Baru') +
        item('save', '💾', 'Simpan') +
        item('load', '📂', 'Muat') +
        item('cloud', '☁️', 'Cloud') +
      '</div>' +
      '<div class="m-sheet-grp-label">Buat & Periksa</div>' +
      '<div class="m-sheet-grid">' +
        item('ai', '✨', 'AI Studio', 'accent') +
        item('view3d', '🎲', 'Preview 3D') +
        item('drawings', '📐', 'Gambar Kerja') +
        item('plan', '💎', 'Paket') +
      '</div>' +
      '<div class="m-sheet-grp-label">Ekspor & Data</div>' +
      '<div class="m-sheet-grid">' +
        item('png', '🖼️', 'PNG') +
        item('pdf', '📄', 'PDF') +
        item('dxf', '📂', 'DXF') +
        item('csv', '📊', 'RAB CSV') +
        item('expProj', '📦', 'Ekspor .json') +
        item('impProj', '📥', 'Impor') +
        item('account', '👤', 'Akun') +
        item('install', '⬇️', 'Pasang App') +
        item('tour', '❓', 'Panduan') +
      '</div>';
  }

  function call(fn) { try { if (typeof window[fn] === 'function') window[fn](); } catch (e) { console.warn(e); } }

  function runAction(act) {
    switch (act) {
      case 'undo': call('undo'); break;
      case 'redo': call('redo'); break;
      case 'new': call('newProject'); break;
      case 'save': call('saveProject'); break;
      case 'load': call('loadProject'); break;
      case 'cloud': call('openCloudProjects'); break;
      case 'ai': call('openAIStudio'); break;
      case 'view3d': if (typeof setView === 'function') setView('3d'); break;
      case 'drawings': call('openDrawings'); break;
      case 'plan': call('openPlanModal'); break;
      case 'png': if (typeof exportImage === 'function') exportImage('png'); break;
      case 'pdf': call('exportPDF'); break;
      case 'dxf': call('exportDXF'); break;
      case 'csv': call('exportRABExcel'); break;
      case 'expProj': call('exportProject'); break;
      case 'impProj': call('importProject'); break;
      case 'account': window.location.href = 'Akun.html'; break;
      case 'install': if (typeof window.__pwaInstall === 'function') window.__pwaInstall(); break;
      case 'tour': if (typeof openOnboarding === 'function') openOnboarding(); break;
    }
  }

  // ---------------------------------------------------------------
  // BOOT
  // ---------------------------------------------------------------
  function boot() {
    bridgeTouch();
    build();
  }
  if (document.readyState === 'loading') window.addEventListener('load', boot);
  else boot();
})();
