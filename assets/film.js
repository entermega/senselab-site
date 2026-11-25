/* SenseLab: filme do herói, sequência por scroll, osciloscópio háptico, interruptor do telemóvel e demonstração do SOS */
(function () {
  'use strict';
  var EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  function L(pt, en) { return EN ? en : pt; }
  function $(id) { return document.getElementById(id); }
  var BASE = document.body.getAttribute('data-assets') || 'assets';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frozen() { return RM || document.documentElement.classList.contains('no-motion'); }
  function onMotion(cb) { document.addEventListener('sl-motion', cb); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function near(el, cb, margin) { new IntersectionObserver(function (es) { cb(es[es.length - 1].isIntersecting); }, { rootMargin: margin || '0px' }).observe(el); }

  /* ---------- herói ---------- */
  (function () {
    var v = $('hero-video'); if (!v || RM) return;
    function go() {
      if (v.src || frozen() || !/^(#inicio)?$/.test(location.hash)) return;
      v.src = v.getAttribute('data-hero'); v.playbackRate = .75;
      var p = v.play(); if (p && p.catch) p.catch(function () { v.removeAttribute('src'); v.load(); });
    }
    go(); addEventListener('hashchange', function () { setTimeout(go, 60); });
    onMotion(function () { if (frozen()) v.pause(); else if (v.src && !v.ended) v.play(); else go(); });
  })();

  /* ---------- imagens só quando se aproximam ---------- */
  [].forEach.call(document.querySelectorAll('[data-href],[data-poster]'), function (e) {
    near(e, function (on) { if (!on) return; var h = e.getAttribute('data-href'), p = e.getAttribute('data-poster'); if (h) { e.setAttribute('href', h); e.removeAttribute('data-href'); } if (p) { e.setAttribute('poster', p); e.removeAttribute('data-poster'); } }, '800px');
  });

  /* ---------- vídeos em ciclo ---------- */
  [].forEach.call(document.querySelectorAll('video[data-src]'), function (v) {
    var btn = document.querySelector('[data-video="' + v.id + '"]'), paused = frozen();
    function label() { btn.textContent = paused ? L('Reproduzir vídeo', 'Play video') : L('Pausar vídeo', 'Pause video'); }
    label();
    var seen = false;
    function sync() { if (seen && !paused) { if (!v.src) v.src = v.getAttribute('data-src'); var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }
    near(v, function (on) { seen = on; sync(); });
    onMotion(function () { paused = frozen(); label(); sync(); });
    btn.addEventListener('click', function () { paused = !paused; label(); sync(); });
  });

  /* ---------- sequência por scroll ---------- */
  (function () {
    var sec = $('scrub'); if (!sec) return; var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var c = $('scrub-c'), x = c.getContext('2d'), li = [].slice.call($('chapters').children), ticks = $('ticks'), mark = $('scrub-mark');
    var N = 72, CUT = 37, RING = 65, imgs = [], started = false, dirty = true, shown = -1, seen = false, cur = null;
    function big() { return innerWidth <= 760 && (document.documentElement.hasAttribute('data-size') || innerHeight < 600); }
    if (big()) RM = true; document.addEventListener('sl-size', function () { if (big() && !sec.classList.contains('still')) location.reload(); });
    if (RM) sec.classList.add('still');
    function src(i) { return BASE + '/film/x/' + (i < 10 ? '0' : '') + i + '.webp'; }
    function get(i) {
      if (imgs[i]) return; var m = new Image(); m.decoding = 'async'; m.src = src(i); imgs[i] = m;
      m.onload = function () { m.ok = true; dirty = true; kick(); };
      m.onerror = function () { if (!m.tries) m.tries = 0; if (m.tries++ < 3) setTimeout(function () { m.src = src(i); }, 600 * m.tries); };
    }
    function load() {
      if (started) return; started = true;
      if (RM) { get(65); return; }
      var order = [], s, i; for (s = 8; s >= 1; s = s / 2) for (i = 0; i < N; i += s) if (order.indexOf(i) < 0) order.push(i);
      get(0); get(71); get(36); order.forEach(get);
    }
    function best(i) { for (var d = 0; d < N; d++) { if (imgs[i - d] && imgs[i - d].ok && (i - d < CUT) === (i < CUT)) return imgs[i - d]; if (imgs[i + d] && imgs[i + d].ok && (i + d < CUT) === (i < CUT)) return imgs[i + d]; } return null; }
    /* pontos de câmara em coordenadas do fotograma: x, y, zoom */
    var CAM = [[800, 330, 1], innerWidth < 1000 ? [500, 325, 1.25] : [680, 330, 1.3], [455, 285, 1.75], [752, 325, 1.95], [1085, 350, 1.85]];
    /* x, y, legenda, deslocação da legenda, alinhamento */
    var MARKS = { 1: [[428, 318, 'ESP32-S3', -64, 92, 'middle']], 2: [[366, 248, L('Frontal', 'Front'), -74, -56, 'end'], [512, 226, L('Superior', 'Top'), 30, -92, 'middle']], 3: [[679, 288, L('Indicador', 'Index'), -34, -84, 'middle'], [786, 298, L('Polegar', 'Thumb'), 40, -96, 'middle'], [809, 334, L('Palma', 'Palm'), 92, 106, 'middle'], [747, 361, L('Dedos', 'Fingers'), -40, 100, 'middle']], 4: [[1035, 350, '3350 mAh', -20, -104, 'middle'], [1120, 393, L('Indução', 'Induction'), 30, 92, 'middle']] };
    var SPOT = [null, [430, 318, 190], [440, 245, 200], [752, 325, 165], [1090, 352, 230]];
    var MID = [.1, .42, .575, .735, .93], BND = [.31, .49, .645, .8];
    function chapter(p) { for (var i = 0; i < 4; i++) if (p < BND[i]) return i; return 4; }
    function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
    function cam(p) {
      var k = [[.2, .3, 0, 1], [.475, .535, 1, 2], [.63, .7, 2, 3], [.785, .855, 3, 4]], o = CAM[0].slice();
      k.forEach(function (s) { if (p > s[0]) { var t = ease(seg(p, s[0], s[1])); for (var i = 0; i < 3; i++) o[i] = CAM[s[2]][i] + (CAM[s[3]][i] - CAM[s[2]][i]) * t; } });
      return o;
    }
    function size() {
      var d = Math.min(devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) { c.width = Math.round(w * d); c.height = Math.round(h * d); dirty = true; }
      return d;
    }
    function draw(p) {
      var d = size(), W = c.width, H = c.height, vw = W / d, narrow = vw < 1000;
      var k = cam(p), base = Math.max(W / 1600, vw < 620 ? W / 820 : narrow ? W / 1180 : 0);
      var z = base * (vw >= 620 && narrow ? 1.18 : 1) * (1 + (k[2] - 1) * (vw < 620 ? 1.05 : narrow ? .9 : .62));
      var px = .5 + ((narrow ? .5 : .56) - .5) * ease(seg(p, .465, .535)), fy = vw < 620 ? .4 : narrow ? .43 : .45;
      var ox = W * px - k[0] * z, oy = H * fy - k[1] * z;
      if (vw < 620) ox -= ease(seg(p, 0, .22)) * 30 * z;
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.fillStyle = '#05070d'; x.fillRect(0, 0, W, H);
      function put(i, a, dx, dy) { var m = best(i); if (!m) return; x.globalAlpha = a; x.drawImage(m, ox + dx * z, oy + dy * z, 1600 * z, 668 * z); }
      var A = seg(p, 0, .2), al = ease(seg(p, .08, .2)), mix = seg(p, .2, .222);
      var f1 = Math.round(A * (CUT - 1)), rings = seg(p, .64, .69) - seg(p, .785, .81);
      var f2 = CUT + Math.round(ease(seg(p, .222, .37)) * (RING - CUT) + rings * (N - 1 - RING));
      /* as duas tomadas alinham-se antes da passagem: mesma posição da pega */
      if (mix < 1) put(f1, 1, -52 * al, -34 * al); if (mix > 0) put(f2, mix, 0, 0);
      x.globalAlpha = 1;
      var e = 668 * z * .16, g = x.createLinearGradient(0, oy - 34 * z, 0, oy + e); g.addColorStop(0, '#05070d'); g.addColorStop(.2, '#05070d'); g.addColorStop(1, 'rgba(5,7,13,0)'); x.fillStyle = g; x.fillRect(0, oy - 36 * z, W, e + 36 * z);
      var yb = oy + 634 * z; g = x.createLinearGradient(0, yb - e * 1.6, 0, yb - 4); g.addColorStop(0, 'rgba(5,7,13,0)'); g.addColorStop(1, '#05070d'); x.fillStyle = g; x.fillRect(0, yb - e * 1.6, W, e * 1.6 + 40 * z);
      function side(x0, x1) { g = x.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#05070d'); g.addColorStop(1, 'rgba(5,7,13,0)'); x.fillStyle = g; x.fillRect(Math.min(x0, x1) - 2, 0, Math.abs(x1 - x0) + 4, H); }
      if (ox > 0) side(ox, ox + 180 * z); var rx = ox + 1548 * z; if (rx < W) { side(rx, rx - 180 * z); x.fillStyle = '#05070d'; x.fillRect(rx, 0, W - rx, H); }
      /* luz só no que está a ser explicado */
      var ch = chapter(p), amt = [0, seg(p, .34, .39) * (1 - seg(p, .48, .51)), seg(p, .5, .55) * (1 - seg(p, .63, .66)), seg(p, .665, .7) * (1 - seg(p, .785, .81)), seg(p, .83, .87)], sp, j;
      for (j = 1; j < 5; j++) if (amt[j] > 0) { sp = SPOT[j]; var sx = ox + sp[0] * z, sy = oy + sp[1] * z, sr = sp[2] * z; g = x.createRadialGradient(sx, sy, sr * .62, sx, sy, sr * 1.7); g.addColorStop(0, 'rgba(5,7,13,0)'); g.addColorStop(1, 'rgba(5,7,13,' + (.84 * amt[j]).toFixed(3) + ')'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
      if (ch !== shown) {
        shown = ch; sec.classList.toggle('deep-in', ch > 0); li.forEach(function (n, i) { n.classList.toggle('on', i === ch); n.classList.toggle('past', i < ch); });
        [].forEach.call(ticks.children, function (b, i) { if (i === ch) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
        var k2 = vw < 620 ? .62 : 1;
        mark.innerHTML = (MARKS[ch] || []).map(function (m, i) { var lx = m[3] * k2, ly = m[4] * k2, up = ly < 0, an = m[5]; if (vw < 620 && an === 'end') { an = 'start'; lx = -14; ly = -78; } return '<g><g class="mk" style="--i:' + i + '"><path class="ld" d="M0 0L' + (an === 'start' ? lx + 14 : an === 'end' ? lx + 6 : lx) + ' ' + (up ? ly + 8 : ly - 18) + '"/><circle class="pg" r="22"/><circle class="in" r="5"/><text x="' + lx + '" y="' + ly + '" text-anchor="' + an + '">' + m[2] + '</text></g></g>'; }).join('');
      }
      (MARKS[ch] || []).forEach(function (m, i) { mark.children[i].setAttribute('transform', 'translate(' + ((ox + m[0] * z) / d).toFixed(1) + ' ' + ((oy + m[1] * z) / d).toFixed(1) + ')'); });
      mark.classList.toggle('show', ch > 0 && amt[ch] > .3);
    }
    function prog() { var r = sec.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight), 0, 1); }
    var raf = 0, lastT = 0;
    function kick() { if (!raf && seen) raf = requestAnimationFrame(frame); }
    function frame() {
      raf = 0; var t = prog(); if (cur === null) cur = t;
      var dd = t - cur; var now = performance.now(), dt = Math.min(.05, (now - lastT) / 1000); lastT = now; cur = Math.abs(dd) < .0004 ? t : cur + dd * (1 - Math.exp(-dt * 14));
      if (cur !== t || dirty) { dirty = false; draw(cur); if (cur !== t) kick(); }
    }
    li.forEach(function (n, i) {
      var b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<span class="tl"></span>'; b.firstChild.textContent = [L('Peso', 'Weight'), L('Processador', 'Processor'), L('Sensores', 'Sensors'), L('Motores', 'Motors'), L('Energia', 'Power')][i];
      b.addEventListener('click', function () { var r = sec.getBoundingClientRect(); scrollTo({ top: scrollY + r.top + MID[i] * (r.height - innerHeight), behavior: RM ? 'auto' : 'smooth' }); });
      ticks.appendChild(b);
    });
    if (RM) {
      near(sec, function (on) { if (on) { seen = true; load(); } });
      var done = function () { if (imgs[65] && imgs[65].ok) { mark.classList.remove('show'); draw(.44); mark.classList.remove('show'); } else setTimeout(done, 200); }; near(sec, function (on) { if (on) done(); });
      return;
    }
    near(sec, function (on) { if (on) load(); }, '1200px');
    near(sec, function (on) { seen = on; if (on) { dirty = true; kick(); } });
    addEventListener('scroll', kick, { passive: true }); addEventListener('resize', function () { dirty = true; kick(); });
  })();

  /* ---------- osciloscópio háptico ---------- */
  (function () {
    var f = $('d-front'), t = $('d-top'), h = $('d-head'); if (!f) return;
    var c = $('scope-c'), x = c.getContext('2d'), out = $('readout'), SPAN = 4;
    var G = ['front', 'top', 'left', 'right'].map(function (n) { return $('m-' + n); });
    var paused = frozen(), seen = false, raf = 0, clock = 0, last = 0, S = { f: 0, t: 0, l: 0, r: 0 }, hist = [[], [], [], []], lastReadout = '';
    function rate(d, a, b, cc, e) { return d > a ? 0 : d > b ? 1 : d > cc ? 2.5 : d > e ? 5 : -1; }
    function m(cm) { var v = (cm / 100).toFixed(2); return (EN ? v : v.replace('.', ',')) + ' m'; }
    function txt(r) { return r === 0 ? L('sem vibração', 'no vibration') : r === -1 ? L('vibração contínua', 'continuous') : r === 1 ? L('1 pulso por segundo', '1 pulse per second') : r === 2.5 ? L('2 a 3 pulsos por segundo', '2 to 3 pulses per second') : L('5 pulsos por segundo', '5 pulses per second'); }
    function side(r) { return r ? L('direita', 'right') : L('esquerda', 'left'); }
    function fill(el) { el.style.setProperty('--p', (el.value - el.min) / (el.max - el.min) * 100 + '%'); }
    var rt;
    function update() {
      var dh = +h.value, dev = Math.abs(dh) >= 5;
      S = { f: rate(+f.value, 250, 150, 80, 40), t: rate(+t.value, 150, 100, 60, 30), l: dev && dh > 0 ? 1.5 : 0, r: dev && dh < 0 ? 1.5 : 0 };
      $('o-front').textContent = m(f.value); $('o-top').textContent = m(t.value);
      $('o-head').textContent = dh === 0 ? L('no rumo', 'on course') : Math.abs(dh) + '° ' + side(dh > 0);
      f.setAttribute('aria-valuetext', m(f.value) + ', ' + txt(S.f)); t.setAttribute('aria-valuetext', m(t.value) + ', ' + txt(S.t)); h.setAttribute('aria-valuetext', $('o-head').textContent);
      [f, t, h].forEach(fill);
      var s = L('À frente: ', 'Ahead: ') + txt(S.f) + '. ' + L('Em cima: ', 'Overhead: ') + txt(S.t) + '. ' + L('Rumo: ', 'Heading: ') + (dev ? L('virar à ', 'turn ') + side(dh < 0) : L('alinhado', 'aligned')) + '.';
      clearTimeout(rt); rt = setTimeout(function () { if (s !== lastReadout) { lastReadout = s; out.textContent = s; } }, 160);
      if (paused) still();
    }
    /* intensidade 0..1 do motor k no instante T, segundo a codificação do D2.a (ranhuras de 100 ms intercaladas) */
    function level(k, T, s) {
      var r = [s.f, s.t, s.l, s.r][k], both = s.f !== 0 && s.t !== 0;
      if (r === 0) return 0;
      if (k < 2) {
        if (r === -1) { if (!both) return 1; var o = k ? s.f : s.t; if (o === -1) return Math.floor(T / .3) % 2 === k ? 1 : 0; if (o === 5) return T % .7 < .3 ? 1 : 0; return level(1 - k, T, s) ? 0 : 1; }
        if (r === 5 && (k ? s.f : s.t) === -1) { var q = T % .7; return (q >= .35 && q < .45) || (q >= .55 && q < .65) ? 1 : 0; }
        var per = 1 / r, ph = both ? (((T - k * .1) % per) + per) % per : T % per; return ph < (both ? .1 : Math.min(.2, per * .5)) - 1e-6 ? 1 : 0;
      }
      return (T % (1 / r)) < .12 ? (s.f !== 0 || s.t !== 0 ? .3 : .55) : 0;
    }
    function size() { var d = Math.min(devicePixelRatio || 1, 2), w = c.clientWidth, hh = c.clientHeight; if (c.width !== Math.round(w * d)) { c.width = Math.round(w * d); c.height = Math.round(hh * d); } return d; }
    var DT = 1 / 60, acc = 0, tone = null, env = [0, 0, 0, 0];
    function push(dt) {
      for (var T = clock; T < clock + dt - 1e-6; T += DT) for (var k = 0; k < 4; k++) {
        var g = level(k, T, S); env[k] += (g - env[k]) * (g > env[k] ? .55 : .34); hist[k].push(env[k]); if (hist[k].length > SPAN * 60) hist[k].shift();
      }
      clock += dt;
    }
    function paint() {
      var d = size(), W = c.width, H = c.height, lane = H / 4; x.clearRect(0, 0, W, H);
      x.lineWidth = d; x.strokeStyle = 'rgba(255,255,255,.07)'; x.beginPath();
      for (var i = 1; i < 8; i++) { var gx = Math.round(W * i / 8) + .5; x.moveTo(gx, 0); x.lineTo(gx, H); } x.stroke();
      for (var k = 0; k < 4; k++) {
        var y0 = lane * (k + 1) - lane * .2, amp = lane * .58, col = k < 2 ? '#F0705F' : '#B08BE6', n = hist[k].length, s;
        x.beginPath(); x.moveTo(W - n / (SPAN * 60) * W, y0);
        for (s = 0; s < n; s++) x.lineTo(W - (n - 1 - s) / (SPAN * 60 - 1) * W, y0 - hist[k][s] * amp);
        x.strokeStyle = col; x.lineWidth = 1.75 * d; x.lineJoin = 'round'; x.stroke();
        x.lineTo(W, y0); x.lineTo(W - n / (SPAN * 60) * W, y0); x.closePath(); x.fillStyle = col; x.globalAlpha = .16; x.fill(); x.globalAlpha = 1;
        x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(0, y0, W, d);
        G[k].style.setProperty('--e', env[k].toFixed(3));
      }
    }
    function still() { hist = [[], [], [], []]; env = [0, 0, 0, 0]; clock = 0; push(SPAN); paint(); G.forEach(function (g, k) { g.style.setProperty('--e', [S.f, S.t, S.l, S.r][k] ? (k < 2 ? 1 : .5) : 0); }); }
    function frame(now) { raf = 0; if (!seen || paused) return; var dt = Math.min(.05, last ? (now - last) / 1000 : DT); last = now; acc += dt; var n = Math.floor(acc / DT); if (n) { push(n * DT); acc -= n * DT; paint(); if (tone) tone(); } raf = requestAnimationFrame(frame); }
    function go() { if (!raf && seen && !paused) { last = 0; raf = requestAnimationFrame(frame); } }
    var pb = $('scope-pause');
    function lab() { pb.textContent = paused ? L('Retomar sinal', 'Resume signal') : L('Pausar sinal', 'Pause signal'); }
    pb.addEventListener('click', function () { paused = !paused; lab(); go(); }); lab();
    [f, t, h].forEach(function (el) { el.addEventListener('input', update); });
    update(); push(SPAN);
    near(c, function (on) { seen = on; if (on) { paused ? still() : go(); } else if (tone) mute(); });
    onMotion(function () { paused = frozen(); lab(); if (paused) still(); go(); });
    /* ouvir: um tom por motor, esquerda e direita separadas */
    var ls = $('listen'), AC = null, gs = [];
    function mute() { tone = null; gs.forEach(function (g) { g.gain.setTargetAtTime(0, AC.currentTime, .02); }); ls.setAttribute('aria-pressed', 'false'); }
    ls.addEventListener('click', function () {
      if (tone) { mute(); return; }
      if (!AC) {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        [[150, 0], [330, 0], [220, -1], [220, 1]].forEach(function (q) { var o = AC.createOscillator(), g = AC.createGain(), p = AC.createStereoPanner ? AC.createStereoPanner() : null; o.type = 'triangle'; o.frequency.value = q[0]; g.gain.value = 0; o.connect(g); if (p) { p.pan.value = q[1]; g.connect(p); p.connect(AC.destination); } else g.connect(AC.destination); o.start(); gs.push(g); });
      }
      AC.resume(); ls.setAttribute('aria-pressed', 'true');
      tone = function () { for (var i = 0; i < 4; i++) gs[i].gain.setTargetAtTime(env[i] * .22, AC.currentTime, .008); };
      if (paused) { paused = false; lab(); } go();
    });
    addEventListener('resize', function () { paint(); });
    var feel = $('feel');
    if (navigator.vibrate && matchMedia('(pointer: coarse)').matches) {
      feel.hidden = false;
      feel.addEventListener('click', function () { var p = [], on = 0, off = 0, st = null; for (var T = 0; T < 2; T += .02) { var v = Math.max(level(0, T, S), level(1, T, S)) > .5; if (st === null) { if (!v) continue; st = true; } if (v === st) on += 20; else { p.push(on); on = 20; st = v; } } p.push(on); navigator.vibrate(p); });
    }
  })();

  /* ---------- interruptor do telemóvel ---------- */
  (function () {
    var b = $('sw-phone'), d = $('link-demo'); if (!b) return;
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-checked') !== 'true'; b.setAttribute('aria-checked', on ? 'true' : 'false'); d.setAttribute('data-on', on ? 'true' : 'false');
      [].forEach.call(d.querySelectorAll('.unit-phone .caps li'), function (e, i) { e.style.setProperty('--i', i); var s = e.querySelector('.sr'); if (!on && !s) { s = document.createElement('span'); s.className = 'sr'; s.textContent = L(' (indisponível)', ' (unavailable)'); e.appendChild(s); } else if (on && s) s.remove(); });
      $('sw-msg').textContent = on ? L('Ligado. O telemóvel acrescenta alertas, localização e voz.', 'Connected. The phone adds alerts, location and voice.') : L('Desligado. A bengala avisa com três pulsos longos e continua a proteger.', 'Off. The cane warns you with three long pulses and keeps protecting you.');
    });
  })();

  /* ---------- bússola ---------- */
  (function () {
    var g = $('dial-r'); if (!g) return; var s = '';
    for (var a = 0; a < 360; a += 5) { var big = a % 30 === 0, r = 222, r2 = big ? 204 : 212, q = a * Math.PI / 180; s += '<path d="M' + (160 + r * Math.sin(q)).toFixed(1) + ' ' + (250 - r * Math.cos(q)).toFixed(1) + 'L' + (160 + r2 * Math.sin(q)).toFixed(1) + ' ' + (250 - r2 * Math.cos(q)).toFixed(1) + '"/>'; if (big) s += '<text transform="rotate(' + a + ' 160 250) translate(160 62)" text-anchor="middle">' + (a % 90 === 0 ? L(['N', 'E', 'S', 'O'], ['N', 'E', 'S', 'W'])[a / 90] : a) + '</text>'; }
    g.innerHTML = s;
  })();

  /* ---------- SOS: manter premido ---------- */
  (function () {
    var b = $('hold'), box = $('sos-demo'); if (!b) return;
    var T = [$('hold-t'), $('hold-t2')], live = $('sos-live'), st = [].slice.call($('sos-steps').children), timer = 0, n = 0, state = 'idle', auto = false, pressed = 0;
    function set(s, text, say) {
      var changed = state !== s; state = s; box.setAttribute('data-s', s); T.forEach(function (e) { e.textContent = text; }); if (say) live.textContent = say;
      $('sos-auto').textContent = s === 'idle' || s === 'cancel' ? L('Simular sem premir', 'Simulate without holding') : L('Parar simulação', 'Stop simulation');
      if (changed) { b.classList.remove('sw'); void b.offsetWidth; b.classList.add('sw'); }
      var k = { idle: -1, hold: 0, count: 1, sent: 2, ack: 2 }[s]; st.forEach(function (e, i) { e.classList.toggle('on', i === k); e.classList.toggle('done', i < k || s === 'ack' && i <= k); });
    }
    function idle(say) { clearTimeout(timer); auto = false; set('idle', L('Manter premido 3 s', 'Hold for 3 s'), typeof say === 'string' ? say : ''); }
    function down() {
      if (state === 'hold' && auto) { idle(L('Simulação parada.', 'Simulation stopped.')); return; }
      if (state === 'count') { clearTimeout(timer); auto = false; set('cancel', L('Cancelado', 'Cancelled'), L('SOS cancelado.', 'SOS cancelled.')); timer = setTimeout(idle, 1600); return; }
      if (state !== 'idle' && state !== 'cancel') return;
      clearTimeout(timer); set('hold', auto ? L('A simular', 'Simulating') : L('Continue a premir', 'Keep holding'), L('A premir. Três segundos.', 'Holding. Three seconds.'));
      timer = setTimeout(function () { n = 5; tick(); }, 3000);
    }
    function tick() {
      if (n === 0) { set('sent', L('Alerta enviado', 'Alert sent'), L('Demonstração: alerta enviado aos contactos.', 'Demonstration: alert sent to contacts.')); timer = setTimeout(function () { set('ack', L('O João vai ajudar', 'João is on the way'), L('O João confirmou que vai ajudar.', 'João confirmed they are on the way.')); timer = setTimeout(idle, 4200); }, 2200); return; }
      set('count', L('Tocar para cancelar, ', 'Tap to cancel, ') + n, n === 5 ? L('Contagem de cinco segundos. Toque para cancelar.', 'Five-second countdown. Tap to cancel.') : ''); n--; timer = setTimeout(tick, 1000);
    }
    function up() { if (state === 'hold' && !auto) idle(L('Largou antes dos três segundos. Nada foi enviado.', 'Released before three seconds. Nothing was sent.')); }
    b.addEventListener('pointerdown', function (e) { if (e.button) return; pressed = Date.now(); if (state !== 'hold') auto = false; down(); });
    ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(function (e) { b.addEventListener(e, up); });
    /* leitores de ecrã enviam apenas um clique: a sequência corre sozinha */
    b.addEventListener('click', function (e) { if (e.detail === 0 && Date.now() - pressed > 800) { if (state === 'idle' || state === 'cancel') auto = true; down(); } });
    var sa = $('sos-auto'); sa.addEventListener('click', function () { if (state === 'idle' || state === 'cancel') { auto = true; down(); } else idle(L('Simulação parada.', 'Simulation stopped.')); });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    b.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) { pressed = Date.now(); if (state !== 'hold') auto = false; down(); } } });
    b.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); up(); } });
  })();

  /* ---------- cabeçalho ---------- */
  (function () { var h = document.querySelector('header.site'); function f() { h.classList.toggle('solid', scrollY > 24); } addEventListener('scroll', f, { passive: true }); f(); })();
})();
