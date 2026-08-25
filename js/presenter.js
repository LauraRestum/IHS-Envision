/* Presenter window: synced over BroadcastChannel with the main deck. */
(function () {
  'use strict';
  var channel = ('BroadcastChannel' in window) ? new BroadcastChannel('ihs-mspv-deck') : null;
  var t0 = Date.now();

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  setInterval(function () {
    var s = Math.floor((Date.now() - t0) / 1000);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    document.getElementById('pTimer').textContent = (h ? h + ':' : '') + pad(m) + ':' + pad(ss);
  }, 1000);

  if (!channel) {
    document.getElementById('pMeta').textContent =
      'This browser does not support the synced presenter channel. Use the main deck with the notes drawer (N) instead.';
    return;
  }
  channel.addEventListener('message', function (e) {
    var m = e.data || {};
    if (m.type !== 'state') return;
    document.getElementById('pTitle').textContent = m.title;
    document.getElementById('pMeta').textContent = 'Slide ' + m.slide + ' of ' + m.total;
    document.getElementById('pNext').textContent = m.next;
    document.getElementById('pNotes').innerHTML = m.notes || '<p class="waiting">No notes for this slide.</p>';
  });
  function send(cmd) { channel.postMessage({ type: 'cmd', cmd: cmd }); }
  document.getElementById('pPrev').addEventListener('click', function () { send('prev'); });
  document.getElementById('pNextBtn').addEventListener('click', function () { send('next'); });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); send('next'); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); send('prev'); }
  });
  send('hello');
})();
