/* So & Sato 仮サイト 共通スクリプト */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ARROW_L = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M10 3 5 8l5 5"/></svg>';
  var ARROW_R = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="m6 3 5 5-5 5"/></svg>';
  var PAUSE = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="3" y="2" width="2.6" height="10"/><rect x="8.4" y="2" width="2.6" height="10"/></svg>';
  var PLAY = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M4 2v10l8-5z"/></svg>';

  /* ---------- Carousel ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('.cr-track');
    var interval = parseInt(root.getAttribute('data-interval') || '5000', 10);
    var ctrl = document.createElement('div');
    ctrl.className = 'cr-ctrl';
    ctrl.innerHTML = '<div class="cr-dots" role="group" aria-label="スライド選択"></div>' +
      '<button type="button" class="cr-btn" data-act="toggle" aria-label="自動再生を停止">' + PAUSE + '</button>' +
      '<button type="button" class="cr-btn" data-act="prev" aria-label="前へ">' + ARROW_L + '</button>' +
      '<button type="button" class="cr-btn" data-act="next" aria-label="次へ">' + ARROW_R + '</button>';
    root.appendChild(ctrl);
    var dots = ctrl.querySelector('.cr-dots');
    var toggle = ctrl.querySelector('[data-act="toggle"]');
    var playing = !reduce, hover = false, timer = null;

    function items() { return Array.prototype.filter.call(track.children, function (el) { return !el.hidden; }); }
    function step() { var it = items(); return it.length > 1 ? it[1].offsetLeft - it[0].offsetLeft : track.clientWidth; }
    function pages() {
      var it = items(); if (!it.length) return 1;
      var per = Math.max(1, Math.round(track.clientWidth / step()));
      return Math.max(1, it.length - per + 1);
    }
    function index() { return Math.round(track.scrollLeft / step()); }
    function go(i) {
      var n = pages(); i = ((i % n) + n) % n;
      var it = items(); if (!it[i]) return;
      track.scrollTo({ left: it[i].offsetLeft - it[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    }
    function renderDots() {
      var n = pages(), cur = Math.min(index(), n - 1);
      if (dots.children.length !== n) {
        dots.innerHTML = '';
        for (var k = 0; k < n; k++) {
          var b = document.createElement('button');
          b.type = 'button'; b.setAttribute('aria-label', (k + 1) + '枚目へ');
          (function (k) { b.addEventListener('click', function () { go(k); }); })(k);
          dots.appendChild(b);
        }
      }
      Array.prototype.forEach.call(dots.children, function (b, k) { b.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
      ctrl.style.display = n > 1 ? '' : 'none';
    }
    function tick() { if (playing && !hover && !document.hidden) go(index() + 1); }
    function restart() { clearInterval(timer); timer = setInterval(tick, interval); }
    function setPlaying(p) {
      playing = p;
      toggle.innerHTML = p ? PAUSE : PLAY;
      toggle.setAttribute('aria-label', p ? '自動再生を停止' : '自動再生を開始');
    }
    ctrl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'toggle') setPlaying(!playing);
      if (act === 'prev') { go(index() - 1); restart(); }
      if (act === 'next') { go(index() + 1); restart(); }
    });
    root.addEventListener('mouseenter', function () { hover = true; });
    root.addEventListener('mouseleave', function () { hover = false; });
    root.addEventListener('focusin', function () { hover = true; });
    root.addEventListener('focusout', function () { hover = false; });
    var raf; track.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(renderDots); });
    window.addEventListener('resize', renderDots);
    root._refresh = function () { track.scrollLeft = 0; renderDots(); };
    setPlaying(playing); renderDots(); restart();
  });

  /* ---------- Tabs ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (list) {
    var tabs = list.querySelectorAll('[role="tab"]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          var p = document.getElementById(t.getAttribute('aria-controls'));
          if (p) p.hidden = !on;
        });
        var p = document.getElementById(tab.getAttribute('aria-controls'));
        if (p) p.querySelectorAll('[data-carousel]').forEach(function (c) { c._refresh && c._refresh(); });
      });
    });
  });

  /* ---------- Filter chips (data-filter-target) ---------- */
  document.querySelectorAll('[data-filter-target]').forEach(function (group) {
    var target = document.querySelector(group.getAttribute('data-filter-target'));
    var key = group.getAttribute('data-filter-key');
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var v = b.getAttribute('data-value');
      target.querySelectorAll('[data-' + key + ']').forEach(function (el) {
        el.hidden = v !== 'all' && el.getAttribute('data-' + key).split(' ').indexOf(v) < 0;
      });
      var c = target.closest('[data-carousel]'); if (c && c._refresh) c._refresh();
    });
  });

  /* ---------- 提案の切り替え（data-variants） ---------- */
  document.querySelectorAll('[data-variants]').forEach(function (group) {
    var target = document.querySelector(group.getAttribute('data-variants'));
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      target.setAttribute('data-variant', b.getAttribute('data-value'));
    });
  });

  /* ---------- Professionals：名前にカーソルで写真を表示 ---------- */
  document.querySelectorAll('[data-pf]').forEach(function (root) {
    var ph = root.querySelector('.pf-preview-photo');
    var nm = root.querySelector('.pf-preview-name');
    var rl = root.querySelector('.pf-preview-role');
    function show(a) {
      root.querySelectorAll('.pf-names a').forEach(function (x) { x.classList.toggle('is-on', x === a); });
      ph.textContent = a.getAttribute('data-initial') || 'PHOTO';
      nm.textContent = a.getAttribute('data-name');
      rl.textContent = a.getAttribute('data-role');
    }
    root.addEventListener('mouseover', function (e) { var a = e.target.closest('.pf-names a'); if (a) show(a); });
    root.addEventListener('focusin', function (e) { var a = e.target.closest('.pf-names a'); if (a) show(a); });
    root.querySelectorAll('[role="tab"]').forEach(function (t) {
      t.addEventListener('click', function () {
        var p = document.getElementById(t.getAttribute('aria-controls'));
        var first = p && p.querySelector('.pf-names a'); if (first) show(first);
      });
    });
  });

  /* ---------- FAQ アコーディオンは <details> を使用 ---------- */

  /* ---------- 修正No.ラベルの表示切替 ---------- */
  var rqBtn = document.querySelector('[data-rq-toggle]');
  if (rqBtn) {
    rqBtn.addEventListener('click', function () {
      var hidden = document.body.classList.toggle('hide-rq');
      rqBtn.textContent = hidden ? '修正No.を表示' : '修正No.を隠す';
    });
  }

  /* ---------- Contact フォーム（仮：送信はしない） ---------- */
  var form = document.querySelector('[data-demo-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      form.hidden = true;
      document.getElementById('form-done').hidden = false;
      window.scrollTo({ top: document.getElementById('form-done').offsetTop - 120, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
})();
