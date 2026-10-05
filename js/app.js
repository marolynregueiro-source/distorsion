(function () {
  var menuBtn = document.getElementById('menuBtn');
  var mobileNav = document.getElementById('mobileNav');
  var closeBtn = document.getElementById('closeMenu');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () { mobileNav.classList.add('open'); });
    if (closeBtn) closeBtn.addEventListener('click', function () { mobileNav.classList.remove('open'); });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { mobileNav.classList.remove('open'); });
    });
  }

  document.querySelectorAll('[data-player]').forEach(function (root) {
    var duration = parseFloat(root.getAttribute('data-duration') || '262');
    var elapsed = 0, playing = false, raf = null, last = null;
    var playBtn = root.querySelector('[data-play]');
    var bars = root.querySelector('.bars');
    var fill = root.querySelector('.progress > i');
    var cur = root.querySelector('[data-cur]');
    var tot = root.querySelector('[data-tot]');
    function fmt(s) {
      s = Math.max(0, Math.floor(s));
      var m = Math.floor(s / 60), r = s % 60;
      return m + ':' + String(r).padStart(2, '0');
    }
    if (tot) tot.textContent = fmt(duration);
    function render() {
      if (fill) fill.style.width = (duration ? (elapsed / duration) * 100 : 0) + '%';
      if (cur) cur.textContent = fmt(elapsed);
    }
    function tick(t) {
      if (last == null) last = t;
      var d = (t - last) / 1000; last = t;
      elapsed = Math.min(duration, elapsed + d);
      render();
      if (elapsed >= duration) { playing = false; last = null; if (bars) bars.classList.remove('on'); playBtn.setAttribute('aria-label', 'Reproducir'); playBtn.innerHTML = '\u25b6'; return; }
      raf = requestAnimationFrame(tick);
    }
    if (playBtn) playBtn.addEventListener('click', function () {
      if (elapsed >= duration) elapsed = 0;
      playing = !playing;
      if (playing) {
        playBtn.setAttribute('aria-label', 'Pausar'); playBtn.innerHTML = '\u275a\u275a';
        if (bars) bars.classList.add('on');
        last = null; raf = requestAnimationFrame(tick);
      } else {
        playBtn.setAttribute('aria-label', 'Reproducir'); playBtn.innerHTML = '\u25b6';
        if (bars) bars.classList.remove('on');
        if (raf) cancelAnimationFrame(raf);
      }
    });
    var prog = root.querySelector('.progress');
    if (prog) prog.addEventListener('click', function (e) {
      var rect = prog.getBoundingClientRect();
      var ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      elapsed = ratio * duration; render();
    });
    if (bars) {
      for (var i = 0; i < 28; i++) {
        var sp = document.createElement('span');
        sp.style.height = (30 + ((i * 37) % 70)) + '%';
        sp.style.animationDelay = (i * 40) + 'ms';
        bars.appendChild(sp);
      }
    }
    render();
  });

  var SEED = { si: 184, depende: 97, no: 41 };
  var KEY = 'distorsion-pogo-poll';
  function loadPoll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { votes: Object.assign({}, SEED), choice: null }; }
    catch (e) { return { votes: Object.assign({}, SEED), choice: null }; }
  }
  function savePoll(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
  function renderPoll(box) {
    var state = loadPoll();
    var total = Object.values(state.votes).reduce(function (a, b) { return a + b; }, 0) || 1;
    box.querySelectorAll('[data-vote]').forEach(function (btn) {
      var id = btn.getAttribute('data-vote');
      var pct = Math.round((state.votes[id] / total) * 100);
      var bar = btn.querySelector('.bar');
      var pctEl = btn.querySelector('[data-pct]');
      btn.classList.toggle('selected', state.choice === id);
      btn.disabled = !!state.choice;
      if (state.choice) {
        if (bar) bar.style.width = pct + '%';
        if (pctEl) pctEl.textContent = pct + '%';
      } else {
        if (bar) bar.style.width = '0%';
        if (pctEl) pctEl.textContent = '';
      }
    });
    var meta = box.querySelector('[data-poll-meta]');
    if (meta) {
      meta.textContent = state.choice
        ? total.toLocaleString('es-AR') + ' votos \u00b7 ya participaste'
        : total.toLocaleString('es-AR') + ' votos \u00b7 eleg\u00ed una';
    }
  }
  document.querySelectorAll('[data-poll]').forEach(function (box) {
    renderPoll(box);
    box.querySelectorAll('[data-vote]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var state = loadPoll();
        if (state.choice) return;
        var id = btn.getAttribute('data-vote');
        state.choice = id;
        state.votes[id] = (state.votes[id] || 0) + 1;
        savePoll(state);
        document.querySelectorAll('[data-poll]').forEach(renderPoll);
      });
    });
  });

  var POGO_KEY = 'distorsion-pogo-board';
  var SEED_MSG = [
    { id: 'm1', nick: 'guada.404', text: 'Si Enriquez lee en el San Mart\u00edn, armo el pogo contra el palco.', at: Date.now() - 54 * 60000 },
    { id: 'm2', nick: 'ruido.blanco', text: 'Mand\u00edbula en voz alta es otra cosa.', at: Date.now() - 33 * 60000 },
    { id: 'm3', nick: 'canal.seco', text: 'Schweblin no se recita: se susurra.', at: Date.now() - 12 * 60000 }
  ];
  function loadPogo() {
    try { return JSON.parse(localStorage.getItem(POGO_KEY)) || { nick: '', joined: false, messages: SEED_MSG }; }
    catch (e) { return { nick: '', joined: false, messages: SEED_MSG.slice() }; }
  }
  function savePogo(s) { localStorage.setItem(POGO_KEY, JSON.stringify(s)); }
  var pogoRoot = document.getElementById('pogo');
  if (pogoRoot) {
    var state = loadPogo();
    var list = document.getElementById('pogoList');
    var joinForm = document.getElementById('joinForm');
    var postForm = document.getElementById('postForm');
    var joinedLabel = document.getElementById('joinedLabel');
    function timeLabel(at) {
      var m = Math.max(1, Math.round((Date.now() - at) / 60000));
      if (m < 60) return 'hace ' + m + ' min';
      var h = Math.round(m / 60);
      if (h < 48) return 'hace ' + h + ' h';
      return 'hace unos d\u00edas';
    }
    function renderMsgs() {
      if (!list) return;
      list.innerHTML = state.messages.map(function (msg) {
        return '<div><p class="nick">' + msg.nick + ' <span style="color:var(--faint)">' + timeLabel(msg.at) + '</span></p><p style="margin:0.25rem 0 0">' + String(msg.text).replace(/</g,'<') + '</p></div>';
      }).join('');
      list.scrollTop = list.scrollHeight;
    }
    function syncUI() {
      if (state.joined) {
        if (joinForm) joinForm.style.display = 'none';
        if (postForm) postForm.style.display = 'flex';
        if (joinedLabel) { joinedLabel.style.display = 'block'; joinedLabel.textContent = 'Conectada/o como ' + state.nick; }
      } else {
        if (joinForm) joinForm.style.display = 'flex';
        if (postForm) postForm.style.display = 'none';
        if (joinedLabel) joinedLabel.style.display = 'none';
      }
    }
    if (joinForm) joinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nick = (document.getElementById('nickInput').value || '').trim().slice(0, 24);
      if (!nick) return;
      state.nick = nick; state.joined = true; savePogo(state); syncUI();
    });
    if (postForm) postForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = (document.getElementById('msgInput').value || '').trim().slice(0, 240);
      if (!text || !state.nick) return;
      state.messages.push({ id: state.nick + '-' + state.messages.length, nick: state.nick, text: text, at: Date.now() });
      savePogo(state);
      document.getElementById('msgInput').value = '';
      renderMsgs();
    });
    renderMsgs(); syncUI();
  }

  var q = document.getElementById('archivoQ');
  if (q) {
    function applyFilter() {
      var query = (q.value || '').trim().replace(/^#/, '').toLowerCase();
      document.querySelectorAll('[data-article]').forEach(function (el) {
        var hay = (el.getAttribute('data-article') || '').toLowerCase();
        el.style.display = !query || hay.indexOf(query) !== -1 ? '' : 'none';
      });
      document.querySelectorAll('[data-filter-tag]').forEach(function (btn) {
        var t = (btn.getAttribute('data-filter-tag') || '').toLowerCase();
        btn.classList.toggle('on', query && query === t);
      });
      var allBtn = document.querySelector('[data-filter-all]');
      if (allBtn) allBtn.classList.toggle('on', !query);
    }
    q.addEventListener('input', applyFilter);
    document.querySelectorAll('[data-filter-tag]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        q.value = btn.getAttribute('data-filter-tag') || '';
        applyFilter();
      });
    });
    var allBtn = document.querySelector('[data-filter-all]');
    if (allBtn) allBtn.addEventListener('click', function () { q.value = ''; applyFilter(); });
    var params = new URLSearchParams(location.search);
    if (params.get('q')) { q.value = params.get('q'); applyFilter(); }
  }

  document.querySelectorAll('[data-ep]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-ep');
      document.querySelectorAll('[data-ep]').forEach(function (b) { b.classList.toggle('on', b === btn); });
      document.querySelectorAll('[data-ep-panel]').forEach(function (p) {
        p.style.display = p.getAttribute('data-ep-panel') === id ? '' : 'none';
      });
    });
  });
})();
