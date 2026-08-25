/* Deck engine: navigation, builds, presenter sync, modals, popovers,
   item explorer, liner picker, org chart and flow moments.
   Keyboard-first, screen-share safe, reduced-motion aware. */
(function () {
  'use strict';

  var STORE_KEY = 'env-a11y';
  var MODE_KEY = 'ihs-mspv-mode';
  var CHANNEL = 'ihs-mspv-deck';

  var root = document.documentElement;
  var stage = document.getElementById('stage');
  var viewport = document.getElementById('viewport');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var cur = 0;
  var stepIdx = 0;            /* steps revealed on the current slide (live mode) */
  var timeouts = [];
  var channel = ('BroadcastChannel' in window) ? new BroadcastChannel(CHANNEL) : null;
  var presenterWin = null;

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

  var mode = 'self';
  try { mode = localStorage.getItem(MODE_KEY) || 'self'; } catch (e) { /* default stands */ }

  /* ---------- stage scaling ---------- */

  function fit() {
    var chromeH = document.querySelector('.chrome').offsetHeight || 64;
    var w = window.innerWidth;
    var h = window.innerHeight - chromeH;
    var scale = Math.min(w / 1280, h / 720);
    stage.style.transform = 'scale(' + scale + ')';
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
    stepIdx = 0;

    var steps = stepsOf(slide);
    if (mode === 'live' && !opts.revealAll && !motionReduced()) {
      resetSteps(slide);
      /* moments that depend on completed builds run once steps are done */
      if (!steps.length) slideMoments(slide);
      else runCountups(slide);
    } else {
      if (motionReduced()) {
        revealAllSteps(slide);
        slideMoments(slide);
        stepIdx = steps.length;
      } else {
        resetSteps(slide);
        steps.forEach(function (el, i) {
          later(function () { el.classList.add('on'); }, 200 + i * 80);
        });
        stepIdx = steps.length;
        later(function () { slideMoments(slide); }, 200 + steps.length * 80);
      }
    }

    document.getElementById('counter').textContent = (cur + 1) + ' / ' + total;
    document.getElementById('progress').style.width = (((cur + 1) / total) * 100) + '%';
    if (!opts.silentHash) {
      try { history.replaceState(null, '', '#slide-' + (cur + 1)); } catch (e) { /* file:// */ }
    }
    announce('Slide ' + (cur + 1) + ' of ' + total + ': ' + (slide.getAttribute('data-title') || ''));
    updateNotes();
    broadcastState();
  }

  function advance() {
    var slide = slides[cur];
    var steps = stepsOf(slide);
    if (mode === 'live' && !motionReduced() && stepIdx < steps.length) {
      steps[stepIdx].classList.add('on');
      stepIdx++;
      if (stepIdx === steps.length) slideMoments(slide);
      broadcastState();
      return;
    }
    if (cur < total - 1) goTo(cur + 1);
  }

  function back() {
    var slide = slides[cur];
    if (mode === 'live' && stepIdx > 0) {
      var steps = stepsOf(slide);
      stepIdx--;
      steps[stepIdx].classList.remove('on');
      broadcastState();
      return;
    }
    if (cur > 0) goTo(cur - 1, { revealAll: true });
  }

  /* ---------- notes drawer ---------- */

  var notesDrawer = document.getElementById('notesDrawer');
  var notesBtn = document.getElementById('btnNotes');
  function notesOpen() { return !notesDrawer.hidden; }
  function updateNotes() {
    if (!notesDrawer) return;
    var src = slides[cur].querySelector('.presenter-notes');
    document.getElementById('notesBody').innerHTML = src ? src.innerHTML : '<p>No notes for this slide.</p>';
    document.getElementById('notesSlideLabel').textContent =
      'Presenter notes, slide ' + (cur + 1) + ': ' + (slides[cur].getAttribute('data-title') || '');
  }
  function toggleNotes(force) {
    var show = (typeof force === 'boolean') ? force : notesDrawer.hidden;
    notesDrawer.hidden = !show;
    notesBtn.setAttribute('aria-pressed', String(show));
    notesBtn.setAttribute('aria-expanded', String(show));
    if (show) updateNotes();
  }
  notesBtn.addEventListener('click', function () { toggleNotes(); });
  document.getElementById('notesClose').addEventListener('click', function () { toggleNotes(false); notesBtn.focus(); });

  /* ---------- presenter window ---------- */

  function notesTextOf(slide) {
    var src = slide.querySelector('.presenter-notes');
    return src ? src.innerHTML : '';
  }
  function broadcastState() {
    if (!channel) return;
    var slide = slides[cur];
    var steps = stepsOf(slide);
    var next;
    if (mode === 'live' && stepIdx < steps.length) {
      next = 'Next: build ' + (stepIdx + 1) + ' of ' + steps.length + ' on this slide';
    } else if (cur < total - 1) {
      next = 'Next slide: ' + (slides[cur + 1].getAttribute('data-title') || '');
    } else {
      next = 'End of deck';
    }
    channel.postMessage({
      type: 'state',
      slide: cur + 1,
      total: total,
      title: slide.getAttribute('data-title') || '',
      notes: notesTextOf(slide),
      next: next
    });
  }
  if (channel) {
    channel.addEventListener('message', function (e) {
      var m = e.data || {};
      if (m.type === 'cmd') {
        if (m.cmd === 'next') advance();
        if (m.cmd === 'prev') back();
        if (m.cmd === 'hello') broadcastState();
      }
    });
  }
  function openPresenter() {
    presenterWin = window.open('presenter.html', 'ihs-mspv-presenter', 'width=1000,height=680');
    if (presenterWin) { setMode('live'); later(broadcastState, 600); }
  }
  document.getElementById('btnPresenter').addEventListener('click', openPresenter);

  /* ---------- mode ---------- */

  var modeBtn = document.getElementById('btnMode');
  function setMode(m) {
    mode = m;
    try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* fine */ }
    modeBtn.textContent = (m === 'live') ? 'Mode: live' : 'Mode: self-guided';
    modeBtn.setAttribute('aria-pressed', String(m === 'live'));
    announce((m === 'live')
      ? 'Live mode. Advancing steps through each build before changing slides.'
      : 'Self-guided mode. Builds play automatically on each slide.');
  }
  modeBtn.addEventListener('click', function () { setMode(mode === 'live' ? 'self' : 'live'); });
  setMode(mode);

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
      if (left + 390 > 1280 - 72) left = 1280 - 72 - 390;
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
      stepIdx = steps.length;
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
  var exSize = document.getElementById('exSize');
  var exStatus = document.getElementById('exStatus');
  var exBody = document.getElementById('exRows');
  var exCount = document.getElementById('exCount');
  var exPending = document.getElementById('exPending');
  var exTableWrap = document.getElementById('exTableWrap');
  var exControls = document.getElementById('exControls');

  function fillSelect(sel, values, label) {
    sel.innerHTML = '<option value="">' + label + '</option>' +
      values.map(function (v) { return '<option value="' + v + '">' + v + '</option>'; }).join('');
  }
  function uniq(arr) {
    return arr.filter(function (v, i) { return v && arr.indexOf(v) === i; }).sort();
  }
  function renderExplorer() {
    var q = (exSearch.value || '').toLowerCase();
    var fam = exFamily.value, size = exSize.value, st = exStatus.value;
    var rows = DATA.items.filter(function (it) {
      if (fam && it.family !== fam) return false;
      if (size && it.size !== size) return false;
      if (st && it.medlineStatus !== st && it.chsStatus !== st) return false;
      if (q) {
        var hay = ((it.itemNumber || '') + ' ' + (it.description || '') + ' ' + (it.clin || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    exBody.innerHTML = rows.map(function (it) {
      return '<tr><td>' + (it.itemNumber || '') + '</td><td>' + (it.description || '') +
        '</td><td>' + (it.clin || '') + '</td><td>' + (it.medlinePvon || '') +
        (it.medlineStatus ? ' (' + it.medlineStatus + ')' : '') + '</td><td>' + (it.chsPvon || '') +
        (it.chsStatus ? ' (' + it.chsStatus + ')' : '') + '</td></tr>';
    }).join('');
    exCount.textContent = rows.length + ' of ' + DATA.items.length + ' items';
  }
  function initExplorer() {
    if (DATA.pending || !DATA.items.length) {
      exPending.hidden = false;
      exControls.hidden = true;
      exTableWrap.hidden = true;
      exCount.hidden = true;
      return;
    }
    exPending.hidden = true;
    exControls.hidden = false;
    exTableWrap.hidden = false;
    exCount.hidden = false;
    fillSelect(exFamily, uniq(DATA.items.map(function (i) { return i.family; })), 'All families');
    fillSelect(exSize, uniq(DATA.items.map(function (i) { return i.size; })), 'All sizes');
    fillSelect(exStatus, uniq(DATA.items.map(function (i) { return i.medlineStatus; })
      .concat(DATA.items.map(function (i) { return i.chsStatus; }))), 'All PVON statuses');
    [exSearch, exFamily, exSize, exStatus].forEach(function (el) {
      el.addEventListener('input', renderExplorer);
    });
    renderExplorer();
  }
  initExplorer();
  document.getElementById('openExplorer').addEventListener('click', function (e) {
    openModal('explorerModal', e.currentTarget);
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
      case 'n': case 'N': if (e.shiftKey) return; e.preventDefault(); toggleNotes(); break;
      case 'o': case 'O': if (e.shiftKey) return; e.preventDefault(); openOverview(document.getElementById('btnOverview')); break;
      case 'p': case 'P': if (e.shiftKey) return; e.preventDefault(); openPresenter(); break;
      case 'Escape': if (notesOpen()) toggleNotes(false); break;
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
