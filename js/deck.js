/* Deck engine: navigation, builds, modals, popovers,
   item explorer, liner picker, org chart and flow moments.
   Keyboard-first, screen-share safe, reduced-motion aware. */
(function () {
  'use strict';

  var STORE_KEY = 'env-a11y';

  var root = document.documentElement;
  var stage = document.getElementById('stage');
  var viewport = document.getElementById('viewport');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var cur = 0;
  var timeouts = [];

  /* ---------- preferences ---------- */

  function prefs() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { return {}; }
  }
  function savePrefs(p) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { /* private mode */ }
  }
  function motionReduced() {
    if (root.getAttribute('data-motion') === 'reduce') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function applyMotionClass() {
    root.classList.toggle('motion-ok', !motionReduced());
  }
  applyMotionClass();
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', applyMotionClass);


  /* ---------- stage scaling ---------- */

  /* CSS zoom re-renders text and images at the final size; transform: scale()
     stretches a 1280x720 raster, which is what made the deck look soft. */
  var useZoom = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('zoom', '1');
  function fit() {
    var chromeH = document.querySelector('.chrome').offsetHeight || 64;
    var w = window.innerWidth;
    var h = window.innerHeight - chromeH;
    var scale = Math.min(w / 1280, h / 720);
    if (useZoom) {
      stage.style.zoom = scale;
    } else {
      stage.style.transform = 'scale(' + scale + ')';
    }
    stage.dataset.scale = String(scale);
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- announcements ---------- */

  var announcer = document.getElementById('announcer');
  function announce(msg) { if (announcer) { announcer.textContent = ''; announcer.textContent = msg; } }

  var toast = document.getElementById('toast');
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  /* ---------- steps ---------- */

  function stepsOf(slide) {
    return Array.prototype.slice.call(slide.querySelectorAll('[data-step]'))
      .sort(function (a, b) { return (+a.getAttribute('data-step')) - (+b.getAttribute('data-step')); });
  }
  function later(fn, ms) { timeouts.push(setTimeout(fn, ms)); }
  function clearTimers() { timeouts.forEach(clearTimeout); timeouts = []; }

  function revealAllSteps(slide) {
    stepsOf(slide).forEach(function (el) { el.classList.add('on'); });
  }
  function resetSteps(slide) {
    stepsOf(slide).forEach(function (el) { el.classList.remove('on'); });
  }

  /* ---------- per-slide moments ---------- */

  function runCountups(slide) {
    var els = slide.querySelectorAll('[data-count]');
    Array.prototype.forEach.call(els, function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      function render(v) {
        var s = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
        el.textContent = prefix + s + suffix;
      }
      if (motionReduced() || el.dataset.counted === '1') { render(target); el.dataset.counted = '1'; return; }
      el.dataset.counted = '1';
      var t0 = null, dur = 850;
      function frame(t) {
        if (t0 === null) t0 = t;
        var p = Math.max(0, Math.min(1, (t - t0) / dur));
        render(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(frame); else render(target);
      }
      requestAnimationFrame(frame);
    });
  }

  function playOrgPulse(slide) {
    var org = slide.querySelector('.org');
    if (!org) return;
    org.classList.remove('pulsing');
    if (motionReduced()) return;
    void org.offsetWidth;
    org.classList.add('pulsing');
  }

  function playFlow(slide) {
    var flow = slide.querySelector('.flow');
    if (!flow) return;
    var steps = flow.querySelectorAll('.flow-step');
    Array.prototype.forEach.call(steps, function (s) { s.classList.remove('lit'); });
    flow.classList.remove('playing');
    if (motionReduced()) {
      Array.prototype.forEach.call(steps, function (s) { s.classList.add('lit'); });
      return;
    }
    void flow.offsetWidth;
    flow.classList.add('playing');
    Array.prototype.forEach.call(steps, function (s, i) {
      later(function () { s.classList.add('lit'); }, 250 + i * 800);
    });
  }

  function playTicks(slide) {
    var items = slide.querySelectorAll('.next-steps li');
    if (!items.length) return;
    if (motionReduced()) {
      Array.prototype.forEach.call(items, function (li) { li.classList.add('done'); });
      return;
    }
    Array.prototype.forEach.call(items, function (li, i) {
      li.classList.remove('done');
      later(function () { li.classList.add('done'); }, 700 + i * 550);
    });
  }

  function slideMoments(slide) {
    runCountups(slide);
    if (slide.id === 'slide-4') later(function () { playOrgPulse(slide); }, motionReduced() ? 0 : 350);
    if (slide.id === 'slide-6') later(function () { playFlow(slide); }, motionReduced() ? 0 : 300);
    if (slide.id === 'slide-13') playTicks(slide);
  }

  /* ---------- navigation ---------- */

  function goTo(n, opts) {
    opts = opts || {};
    n = Math.max(0, Math.min(total - 1, n));
    clearTimers();
    closeAllPopovers();
    var prev = slides[cur];
    if (prev && prev !== slides[n]) prev.classList.remove('active');
    cur = n;
    var slide = slides[cur];
    slide.classList.add('active');

    var steps = stepsOf(slide);
    if (motionReduced()) {
      revealAllSteps(slide);
      slideMoments(slide);
    } else {
      resetSteps(slide);
      steps.forEach(function (el, i) {
        later(function () { el.classList.add('on'); }, 200 + i * 80);
      });
      later(function () { slideMoments(slide); }, 200 + steps.length * 80);
    }

    document.getElementById('counter').textContent = (cur + 1) + ' / ' + total;
    document.getElementById('progress').style.width = (((cur + 1) / total) * 100) + '%';
    if (!opts.silentHash) {
      try { history.replaceState(null, '', '#slide-' + (cur + 1)); } catch (e) { /* file:// */ }
    }
    announce('Slide ' + (cur + 1) + ' of ' + total + ': ' + (slide.getAttribute('data-title') || ''));
  }

  function advance() {
    if (cur < total - 1) goTo(cur + 1);
  }

  function back() {
    if (cur > 0) goTo(cur - 1, { revealAll: true });
  }

  /* ---------- generic modal handling ---------- */

  var openModalEl = null;
  var modalTrigger = null;
  function trapKeys(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closeModal(); return; }
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(
      openModalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openModal(id, trigger) {
    closeModal();
    var overlay = document.getElementById(id);
    if (!overlay) return;
    openModalEl = overlay;
    modalTrigger = trigger || document.activeElement;
    overlay.hidden = false;
    var candidates = overlay.querySelectorAll('input, select, button:not(.modal-close)');
    var focusable = Array.prototype.find.call(candidates, function (el) {
      return !el.disabled && el.offsetParent !== null;
    }) || overlay.querySelector('.modal-close');
    if (focusable) focusable.focus();
    document.addEventListener('keydown', trapKeys, true);
  }
  function closeModal() {
    if (!openModalEl) return;
    openModalEl.hidden = true;
    document.removeEventListener('keydown', trapKeys, true);
    var t = modalTrigger;
    openModalEl = null; modalTrigger = null;
    if (t && t.focus) t.focus();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.modal-overlay'), function (ov) {
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-modal-close]')) closeModal();
    });
  });

  /* ---------- overview ---------- */

  var ovGrid = document.getElementById('overviewGrid');
  slides.forEach(function (s, i) {
    var b = document.createElement('button');
    b.className = 'overview-item';
    b.innerHTML = '<span class="ov-num">' + (i + 1) + '</span>' + (s.getAttribute('data-title') || '');
    b.addEventListener('click', function () { closeModal(); goTo(i, { revealAll: true }); });
    ovGrid.appendChild(b);
  });
  function openOverview(trigger) {
    Array.prototype.forEach.call(ovGrid.children, function (b, i) {
      b.setAttribute('aria-current', String(i === cur));
    });
    openModal('overviewModal', trigger);
  }
  document.getElementById('btnOverview').addEventListener('click', function (e) { openOverview(e.currentTarget); });

  /* ---------- display options (motion toggle) ---------- */

  document.getElementById('btnDisplay').addEventListener('click', function (e) { openModal('displayModal', e.currentTarget); });
  function refreshMotionButtons() {
    var reduced = root.getAttribute('data-motion') === 'reduce';
    document.getElementById('motionOn').setAttribute('aria-pressed', String(!reduced));
    document.getElementById('motionOff').setAttribute('aria-pressed', String(reduced));
  }
  function setMotion(reduce) {
    var p = prefs();
    if (reduce) { p.motion = 'reduce'; root.setAttribute('data-motion', 'reduce'); }
    else { delete p.motion; root.removeAttribute('data-motion'); }
    savePrefs(p);
    applyMotionClass();
    refreshMotionButtons();
    revealAllSteps(slides[cur]);
    runCountups(slides[cur]);
    announce(reduce ? 'Motion reduced. Builds render complete.' : 'Motion on.');
  }
  document.getElementById('motionOn').addEventListener('click', function () { setMotion(false); });
  document.getElementById('motionOff').addEventListener('click', function () { setMotion(true); });
  refreshMotionButtons();

  /* ---------- glossary popovers ---------- */

  var GLOSSARY = {
    mspv: ['MSPV', 'The VA Medical/Surgical Prime Vendor program: a pre-competed national vehicle for medical, surgical, dental, laboratory and environmental supplies.'],
    boa: ['BOA', 'A Basic Ordering Agreement with the VA: a standing written agreement that sets the terms for orders placed as needs arise (FAR 16.703).'],
    pvon: ['PVON', 'The item-level Prime Vendor order number. Each contract item carries one, and your Prime Vendor can establish one on request.'],
    'procurement-list': ['AbilityOne Procurement List', 'The list of items that FAR 8.002 makes required sources for federal purchases. The U.S. AbilityOne Commission approves every item added and its fair market price.'],
    hhsar: ['HHSAR', 'The acquisition regulation covering HHS agencies, including IHS. Subpart 326.6 states when the Buy Indian Act does not apply.'],
    'micro-purchase': ['Micro-purchase threshold', 'The $15,000 ceiling on purchase-card micro-purchases, effective October 1, 2025. Orders through MSPV run against an existing federal contract instead.'],
    hdpe: ['HDPE', 'High density polyethylene: thin gauge with high strength for its weight, best for routine dry waste.'],
    lldpe: ['LLDPE', 'Linear low density polyethylene: stretch, puncture and tear resistance, best for heavy, wet or sharp-edged waste.']
  };
  var openPop = null;
  function closeAllPopovers() {
    if (openPop) {
      openPop.pop.remove();
      openPop.btn.setAttribute('aria-expanded', 'false');
      openPop = null;
    }
  }
  document.addEventListener('click', function (e) {
    if (openPop && !e.target.closest('.popover') && !e.target.closest('.term')) closeAllPopovers();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openPop) {
      var btn = openPop.btn;
      closeAllPopovers();
      btn.focus();
      e.stopPropagation();
    }
  }, true);
  Array.prototype.forEach.call(document.querySelectorAll('.term'), function (btn, idx) {
    var key = btn.getAttribute('data-term');
    if (!GLOSSARY[key]) return;
    var popId = 'pop-' + key + '-' + idx;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', popId);
    btn.addEventListener('click', function () {
      if (openPop && openPop.btn === btn) { closeAllPopovers(); return; }
      closeAllPopovers();
      var slide = btn.closest('.slide');
      var pop = document.createElement('div');
      pop.className = 'popover';
      pop.id = popId;
      pop.setAttribute('role', 'note');
      pop.innerHTML = '<span class="popover-term">' + GLOSSARY[key][0] + '</span>' + GLOSSARY[key][1];
      slide.appendChild(pop);
      var scale = parseFloat(stage.dataset.scale || '1');
      var br = btn.getBoundingClientRect();
      var sr = slide.getBoundingClientRect();
      var left = (br.left - sr.left) / scale;
      var top = (br.bottom - sr.top) / scale + 10;
      if (left + 430 > 1280 - 64) left = 1280 - 64 - 430;
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
      btn.setAttribute('aria-expanded', 'true');
      openPop = { btn: btn, pop: pop };
    });
  });

  /* ---------- org chart nodes ---------- */

  Array.prototype.forEach.call(document.querySelectorAll('[data-org-detail]'), function (btn) {
    var detail = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (detail) detail.hidden = open;
    });
  });
  var orgReplay = document.getElementById('orgReplay');
  if (orgReplay) {
    orgReplay.addEventListener('click', function () {
      var slide = document.getElementById('slide-4');
      clearTimers();
      if (motionReduced()) { revealAllSteps(slide); playOrgPulse(slide); return; }
      resetSteps(slide);
      var steps = stepsOf(slide);
      steps.forEach(function (el, i) { later(function () { el.classList.add('on'); }, 150 + i * 240); });
      later(function () { playOrgPulse(slide); }, 150 + steps.length * 240);
    });
  }
  var flowReplay = document.getElementById('flowReplay');
  if (flowReplay) {
    flowReplay.addEventListener('click', function () { playFlow(document.getElementById('slide-6')); });
  }

  /* ---------- copy contract number ---------- */

  var copyBtn = document.getElementById('copyContract');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var num = copyBtn.getAttribute('data-copy');
      function done() { showToast('Contract number copied'); announce('Contract number ' + num + ' copied to clipboard'); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(num).then(done, function () { showToast('Copy failed. The number is ' + num); });
      } else {
        showToast('Copy is unavailable here. The number is ' + num);
      }
    });
  }

  /* ---------- item explorer ---------- */

  var DATA = window.MSPV_ITEMS || { pending: true, items: [] };
  var exSearch = document.getElementById('exSearch');
  var exFamily = document.getElementById('exFamily');
  var exType = document.getElementById('exType');
  var exStatus = document.getElementById('exStatus');
  var exHead = document.getElementById('exHead');
  var exBody = document.getElementById('exRows');
  var exCount = document.getElementById('exCount');
  var exPending = document.getElementById('exPending');
  var exSummary = document.getElementById('exSummary');
  var exDownload = document.getElementById('exDownload');
  var exTableWrap = document.getElementById('exTableWrap');
  var exControls = document.getElementById('exControls');

  var NO_FAMILY = 'Not specified';
  var UNIT_NAMES = { BX: 'Box', CS: 'Case' };
  var EX_COLUMNS = [
    { key: 'itemNumber', label: 'Item number' },
    { key: 'nsn', label: 'NSN' },
    { key: 'description', label: 'Description' },
    { key: 'uop', label: 'Unit' },
    { key: 'qtyPerUop', label: 'Qty per unit', numeric: true },
    { key: 'clin', label: 'CLIN' },
    { key: 'medlinePvon', label: 'Medline PVON' },
    { key: 'chsPvon', label: 'CHS PVON' },
    { key: 'effectiveDate', label: 'On contract' }
  ];
  var exSort = { key: 'itemNumber', dir: 1 };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fillSelect(sel, values, label) {
    sel.innerHTML = '<option value="">' + esc(label) + '</option>' +
      values.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('');
  }
  function uniq(arr) {
    return arr.filter(function (v, i) { return v && arr.indexOf(v) === i; }).sort();
  }
  function unitName(u) { return UNIT_NAMES[u] || u || ''; }
  function pvonCell(pvon, status) {
    /* Show the number when there is one; show the status only when there is
       no number (e.g. "Contact Prime Vendor (PV) to Request a PVON"). */
    if (pvon) return esc(pvon);
    return status ? '<span class="pvon-status">' + esc(status) + '</span>' : '';
  }
  function cellValue(it, key) {
    if (key === 'uop') return unitName(it.uop);
    if (key === 'medlinePvon') return pvonCell(it.medlinePvon, it.medlineStatus);
    if (key === 'chsPvon') return pvonCell(it.chsPvon, it.chsStatus);
    if (key === 'effectiveDate') return esc(it.effectiveDate || '') + ' to ' + esc(it.completionDate || '');
    return esc(it[key]);
  }
  function sortValue(it, key) {
    var v = it[key];
    if (key === 'medlinePvon') v = it.medlinePvon || 'zz ' + (it.medlineStatus || '');
    if (key === 'chsPvon') v = it.chsPvon || 'zz ' + (it.chsStatus || '');
    if (v == null) return '';
    return v;
  }
  function renderHead() {
    exHead.innerHTML = '<tr>' + EX_COLUMNS.map(function (c) {
      var state = exSort.key === c.key ? (exSort.dir === 1 ? 'ascending' : 'descending') : 'none';
      return '<th scope="col" aria-sort="' + state + '"><button type="button" class="ex-sort" data-sort="' + c.key + '">' +
        esc(c.label) + '<span class="ex-sort-arrow" aria-hidden="true">' +
        (state === 'ascending' ? '▴' : state === 'descending' ? '▾' : '') + '</span></button></th>';
    }).join('') + '</tr>';
  }
  function renderExplorer() {
    var q = (exSearch.value || '').toLowerCase();
    var fam = exFamily.value, type = exType.value, st = exStatus.value;
    var rows = DATA.items.filter(function (it) {
      if (fam && (it.family || NO_FAMILY) !== fam) return false;
      if (type && it.productType !== type) return false;
      if (st && it.medlineStatus !== st && it.chsStatus !== st) return false;
      if (q) {
        var hay = ((it.itemNumber || '') + ' ' + (it.nsn || '') + ' ' + (it.description || '') + ' ' + (it.clin || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    var col = null;
    EX_COLUMNS.forEach(function (c) { if (c.key === exSort.key) col = c; });
    rows.sort(function (a, b) {
      var va = sortValue(a, exSort.key), vb = sortValue(b, exSort.key);
      if (col && col.numeric) { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
      if (va < vb) return -exSort.dir;
      if (va > vb) return exSort.dir;
      return 0;
    });
    renderHead();
    exBody.innerHTML = rows.map(function (it) {
      return '<tr>' + EX_COLUMNS.map(function (c) {
        return '<td data-label="' + esc(c.label) + '">' + cellValue(it, c.key) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    exCount.textContent = rows.length + ' of ' + DATA.items.length + ' items';
  }
  function initExplorer() {
    if (DATA.pending || !DATA.items.length) {
      exPending.hidden = false;
      exControls.hidden = true;
      exTableWrap.hidden = true;
      exCount.hidden = true;
      exSummary.hidden = true;
      exDownload.hidden = true;
      return;
    }
    exPending.hidden = true;
    exControls.hidden = false;
    exTableWrap.hidden = false;
    exCount.hidden = false;
    exDownload.hidden = false;

    /* Slide 7 card: both figures come from the data, never hand-typed. */
    var countCard = document.getElementById('itemCountCard');
    var asOfCard = document.getElementById('itemAsOfCard');
    if (countCard) countCard.textContent = DATA.items.length + ' items';
    if (asOfCard && DATA.itemListAsOf) asOfCard.textContent = 'On contract as of ' + DATA.itemListAsOf;

    /* Fields identical across every row, stated as contract-listing data. */
    exSummary.textContent = 'From the contract listing, identical across all ' + DATA.items.length +
      ' items: contract ' + (DATA.contractNumber || '') + ', category Environmental Services, ' +
      'minimum order quantity 1, no dropship-only items, country of origin United States, ' +
      'latex free, non-sterile.';
    exSummary.hidden = false;

    fillSelect(exType, uniq(DATA.items.map(function (i) { return i.productType; })), 'All product types');
    fillSelect(exFamily, uniq(DATA.items.map(function (i) { return i.family || NO_FAMILY; })), 'All families');
    fillSelect(exStatus, uniq(DATA.items.map(function (i) { return i.medlineStatus; })
      .concat(DATA.items.map(function (i) { return i.chsStatus; }))), 'All PVON statuses');
    [exSearch, exType, exFamily, exStatus].forEach(function (el) {
      el.addEventListener('input', renderExplorer);
    });
    exHead.addEventListener('click', function (e) {
      var btn = e.target.closest('.ex-sort');
      if (!btn) return;
      var key = btn.getAttribute('data-sort');
      if (exSort.key === key) { exSort.dir = -exSort.dir; }
      else { exSort.key = key; exSort.dir = 1; }
      renderExplorer();
      /* Re-focus the same header button: renderHead replaced the nodes. */
      var again = exHead.querySelector('[data-sort="' + key + '"]');
      if (again) again.focus();
    });
    renderExplorer();
  }
  initExplorer();
  Array.prototype.forEach.call(document.querySelectorAll('.js-open-explorer, #openExplorer'), function (btn) {
    btn.addEventListener('click', function (e) {
      openModal('explorerModal', e.currentTarget);
    });
  });

  /* ---------- HHSAR citation modal ---------- */

  document.getElementById('openCitation').addEventListener('click', function (e) {
    openModal('citationModal', e.currentTarget);
  });

  /* ---------- liner picker ---------- */

  var SCENARIOS = {
    dry: { fam: 'hdpe', why: 'High strength for its weight and economical case yields make HDPE the fit for routine dry waste.' },
    wet: { fam: 'lldpe', why: 'Stretch and tear resistance make LLDPE the fit for heavy, wet waste.' },
    sharp: { fam: 'lldpe', why: 'Puncture and tear resistance make LLDPE the fit for sharp-edged waste.' },
    food: { fam: 'lldpe', why: 'LLDPE is the workhorse for clinical and food service areas.' }
  };
  var scenarioBtns = document.querySelectorAll('.scenario-btn');
  Array.prototype.forEach.call(scenarioBtns, function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-scenario');
      var pick = SCENARIOS[key];
      Array.prototype.forEach.call(scenarioBtns, function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var hd = document.getElementById('panel-hdpe');
      var ll = document.getElementById('panel-lldpe');
      hd.classList.toggle('match', pick.fam === 'hdpe');
      ll.classList.toggle('match', pick.fam === 'lldpe');
      var why = document.getElementById('linerWhy');
      why.textContent = pick.why;
    });
  });

  /* ---------- support tiles expand ---------- */

  Array.prototype.forEach.call(document.querySelectorAll('.tile[aria-expanded]'), function (tile) {
    var more = tile.querySelector('.tile-more');
    var hint = tile.querySelector('.tile-hint');
    tile.addEventListener('click', function () {
      var open = tile.getAttribute('aria-expanded') === 'true';
      tile.setAttribute('aria-expanded', String(!open));
      if (more) more.hidden = open;
      if (hint) hint.textContent = open ? 'How to request' : 'Close';
    });
  });

  /* ---------- edge zones, buttons, swipe ---------- */

  document.getElementById('btnPrev').addEventListener('click', back);
  document.getElementById('btnNext').addEventListener('click', advance);
  document.querySelector('.nav-zone--prev').addEventListener('click', back);
  document.querySelector('.nav-zone--next').addEventListener('click', advance);

  var touchX = null, touchY = null;
  viewport.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
  }, { passive: true });
  viewport.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    touchX = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) advance(); else back();
    }
  }, { passive: true });

  /* ---------- keyboard: editable-target guard mandatory ---------- */

  function editable(t) {
    if (!t) return false;
    var tag = (t.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
  }
  document.addEventListener('keydown', function (e) {
    if (editable(e.target)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (openModalEl) return; /* modal trap owns keys while open */
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': e.preventDefault(); advance(); break;
      case ' ': if (e.target.closest('button, a, [role="button"]')) return; e.preventDefault(); advance(); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); back(); break;
      case 'Home': e.preventDefault(); goTo(0); break;
      case 'End': e.preventDefault(); goTo(total - 1, { revealAll: true }); break;
      case 'o': case 'O': if (e.shiftKey) return; e.preventDefault(); openOverview(document.getElementById('btnOverview')); break;
    }
  });

  /* ---------- print: everything visible ---------- */

  window.addEventListener('beforeprint', function () {
    slides.forEach(function (s) {
      revealAllSteps(s);
      runCountups(s);
      var items = s.querySelectorAll('.next-steps li');
      Array.prototype.forEach.call(items, function (li) { li.classList.add('done'); });
      var flowSteps = s.querySelectorAll('.flow-step');
      Array.prototype.forEach.call(flowSteps, function (f) { f.classList.add('lit'); });
      var orderSteps = s.querySelectorAll('.order-step');
      Array.prototype.forEach.call(orderSteps, function (f) { f.classList.add('lit'); });
    });
  });

  /* ---------- order steps illuminate ---------- */

  function playOrderSteps(slide) {
    var steps = slide.querySelectorAll('.order-step');
    if (motionReduced()) {
      Array.prototype.forEach.call(steps, function (s) { s.classList.add('lit'); });
      return;
    }
    Array.prototype.forEach.call(steps, function (s, i) {
      s.classList.remove('lit');
      later(function () { s.classList.add('lit'); }, 500 + i * 600);
    });
  }
  var _slideMoments = slideMoments;
  slideMoments = function (slide) {
    _slideMoments(slide);
    if (slide.id === 'slide-12') playOrderSteps(slide);
  };

  /* ---------- boot from hash ---------- */

  var start = 0;
  var m = (location.hash || '').match(/slide-(\d+)|^#(\d+)$/);
  if (m) {
    var n = parseInt(m[1] || m[2], 10);
    if (n >= 1 && n <= total) start = n - 1;
  }
  window.addEventListener('hashchange', function () {
    var mm = (location.hash || '').match(/slide-(\d+)/);
    if (mm) {
      var nn = parseInt(mm[1], 10) - 1;
      if (nn !== cur && nn >= 0 && nn < total) goTo(nn, { revealAll: true, silentHash: true });
    }
  });
  goTo(start, { revealAll: start > 0 });
})();
