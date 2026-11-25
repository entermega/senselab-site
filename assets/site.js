/* SenseLab — navegação, preferências de leitura, demonstração háptica, explorador 3D e contacto (PT / EN) */
(function () {
  'use strict';
  var root = document.documentElement, D = Math.PI / 180;
  var EN = (root.getAttribute('lang') || '').toLowerCase().indexOf('en') === 0;
  function L(pt, en) { return EN ? en : pt; }
  function $(id) { return document.getElementById(id); }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* ---------- preferências de leitura ---------- */
  var bs = $('btn-size'), bt = $('btn-theme'), bm = $('btn-menu'), nav = $('nav'), lang = $('lang');
  var SIZES = [100, 125, 150], size = 0, said = false;
  /* o menu colapsa quando não cabe, e não só por largura do ecrã */
  var BAR = document.querySelector('.bar');
  function fitNav() {
    if (nav.classList.contains('open')) menu(false);
    root.classList.remove('nav-c'); if (innerWidth <= 1080) return;
    var last = $('btn-theme').getBoundingClientRect().right, br = BAR.getBoundingClientRect().right;
    if (last > br + 1 || BAR.scrollWidth > BAR.clientWidth + 1) root.classList.add('nav-c');
  }
  addEventListener('resize', fitNav); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);
  function setSize(i) {
    size = i; if (i) root.setAttribute('data-size', SIZES[i]); else root.removeAttribute('data-size');
    bs.setAttribute('aria-label', L('Tamanho do texto: ', 'Text size: ') + SIZES[i] + ' %'); bs.textContent = i ? SIZES[i] + '%' : 'A+'; store('sl-size', String(i)); fitNav(); if (said) document.dispatchEvent(new Event('sl-size')); if (said) { var st = $('say'); st.textContent = L('Texto a ', 'Text at ') + SIZES[i] + ' %'; } said = true;
  }
  function isDark() { var t = root.getAttribute('data-theme'); if (t) return t === 'dark'; return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
  function syncTheme() {
    var d = isDark();
    bt.setAttribute('aria-label', d ? L('Mudar para tema claro', 'Switch to light theme') : L('Mudar para tema escuro', 'Switch to dark theme'));
  }
  bs.removeAttribute('aria-pressed'); bt.removeAttribute('aria-pressed');
  bs.addEventListener('click', function () { setSize((size + 1) % SIZES.length); });
  bt.addEventListener('click', function () { var n = isDark() ? 'light' : 'dark'; root.setAttribute('data-theme', n); store('sl-theme', n); syncTheme(); });
  setSize(clampSize(+load('sl-size')));
  function clampSize(n) { return n === 1 || n === 2 ? n : 0; }
  var mos = [].slice.call(document.querySelectorAll('.motion-t'));
  function setMotion(off) { root.classList.toggle('no-motion', off); mos.forEach(function (m) { m.setAttribute('aria-pressed', off ? 'true' : 'false'); }); store('sl-motion', off ? '1' : '0'); document.dispatchEvent(new Event('sl-motion')); }
  mos.forEach(function (m) { m.addEventListener('click', function () { setMotion(!root.classList.contains('no-motion')); }); if (root.classList.contains('no-motion')) m.setAttribute('aria-pressed', 'true'); });
  var th = load('sl-theme'); if (th && !root.getAttribute('data-theme')) root.setAttribute('data-theme', th);
  syncTheme();
  var MAIN = $('conteudo'), FOOT = document.querySelector('footer');
  function menu(open, focus) {
    if (open === nav.classList.contains('open')) return;
    nav.classList.toggle('open', open); bm.setAttribute('aria-expanded', open ? 'true' : 'false'); bm.setAttribute('aria-label', open ? L('Fechar menu', 'Close menu') : L('Menu', 'Menu'));
    MAIN.inert = FOOT.inert = open; document.body.style.overflow = open ? 'hidden' : '';
    if (open && focus) nav.querySelector('a').focus({ preventScroll: true });
  }
  matchMedia('(min-width:1081px)').addEventListener('change', function () { menu(false); });
  var sk = document.querySelector('.skip');
  sk.addEventListener('click', function (e) { e.preventDefault(); var v = document.querySelector('.view.on'); var t = v && v.querySelector('h1'); if (t) { t.tabIndex = -1; t.focus(); window.scrollTo(0, 0); } });
  bm.addEventListener('click', function () { menu(!nav.classList.contains('open'), true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { menu(false); bm.focus(); } });

  /* ---------- rotas ---------- */
  var VIEWS = ['inicio', 'rumo', 'como-funciona', 'app', 'sobre', 'suporte', 'politicas'];
  var POLS = ['privacidade', 'termos', 'garantia', 'seguranca', 'acessibilidade', 'cookies'];
  var TITLES = EN
    ? { inicio: 'SenseLab · RUMO Smart Cane', rumo: 'RUMO Smart Cane · SenseLab', 'como-funciona': 'How it works · SenseLab', app: 'App and carers · SenseLab', sobre: 'About us · SenseLab', suporte: 'Support · SenseLab', politicas: 'Policies · SenseLab' }
    : { inicio: 'SenseLab · RUMO Smart Cane', rumo: 'RUMO Smart Cane · SenseLab', 'como-funciona': 'Como funciona · SenseLab', app: 'App e cuidadores · SenseLab', sobre: 'Sobre nós · SenseLab', suporte: 'Suporte · SenseLab', politicas: 'Políticas · SenseLab' };
  var first = true, current = null;
  function route() {
    var h = (location.hash || '').replace('#', '') || 'inicio';
    if (h === 'conteudo') return;
    var lab = h === 'vibracoes'; if (lab) h = 'inicio';
    var pol = POLS.indexOf(h) > -1 ? h : null, ct = /^contacto(-|$)/.test(h);
    var v = pol ? 'politicas' : ct ? 'suporte' : (VIEWS.indexOf(h) > -1 ? h : 'inicio');
    var els = document.querySelectorAll('.view'), i;
    for (i = 0; i < els.length; i++) els[i].classList.toggle('on', els[i].getAttribute('data-view') === v);
    var links = document.querySelectorAll('[data-nav]');
    for (i = 0; i < links.length; i++) { if (links[i].getAttribute('data-nav') === v) links[i].setAttribute('aria-current', 'page'); else links[i].removeAttribute('aria-current'); }
    var pl = document.querySelectorAll('[data-pol]');
    for (i = 0; i < pl.length; i++) { var is = pl[i].getAttribute('data-pol') === pol; pl[i].classList.toggle('cur', is); if (is) pl[i].setAttribute('aria-current', 'location'); else pl[i].removeAttribute('aria-current'); }
    root.removeAttribute('data-cold'); if (!first) root.classList.add('routed');
    document.title = ct ? L('Contacto · SenseLab', 'Contact · SenseLab') : pol ? $(pol).querySelector('h2').textContent + ' · SenseLab' : TITLES[v];
    if (lang) lang.setAttribute('href', lang.getAttribute('data-base') + (location.hash || ''));
    menu(false);
    if (pol) { var t = $(pol); if (t) { t.scrollIntoView(); var ph = t.querySelector('h2'); ph.tabIndex = -1; ph.focus({ preventScroll: true }); } }
    else if (ct) { var fs = $('f-topic'), fw = $('f-who'), k = { 'contacto-testes': [0, 1], 'contacto-lancamento': [0, 2], 'contacto-instituicao': [3, 3], 'contacto-cuidador': [2, 4] }[h] || [0, 0]; fw.selectedIndex = k[0]; fs.selectedIndex = k[1]; $('contacto').scrollIntoView(); var hc = $('h-contact'); hc.tabIndex = -1; hc.focus({ preventScroll: true }); }
    else if (!first || v !== 'inicio') window.scrollTo(0, 0);
    if (!first && v !== current && !pol && !ct) { var h1 = document.querySelector('.view.on h1'); if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); } }
    if (lab) { var ls = document.querySelector('.lab'); ls.scrollIntoView(); var lh = $('h-lab'); lh.tabIndex = -1; lh.focus({ preventScroll: true }); }
    first = false; current = v;
    if (v === 'rumo') initExplorer();
  }
  if (lang) lang.setAttribute('data-base', lang.getAttribute('href'));
  window.addEventListener('hashchange', route);

  /* ---------- formulário de contacto ---------- */
  (function () {
    var form = $('contact-form'); if (!form) return;
    var st = $('f-status'), to = form.getAttribute('data-to');
    var F = { name: $('f-name'), email: $('f-email'), msg: $('f-msg'), ok: $('f-ok') };
    function err(el, id, text) { $(id).textContent = text || ''; el.setAttribute('aria-invalid', text ? 'true' : 'false'); return !text; }
    function check() {
      var good = true, firstBad = null;
      function ck(el, id, text) { if (!err(el, id, text)) { good = false; if (!firstBad) firstBad = el; } }
      ck(F.name, 'e-name', F.name.value.trim() ? '' : L('Escreva o seu nome.', 'Please enter your name.'));
      var em = F.email.value.trim();
      ck(F.email, 'e-email', !em ? L('Escreva o seu email.', 'Please enter your email.') : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) ? L('Este email não parece completo. Exemplo: nome@exemplo.pt', 'This email does not look complete. Example: name@example.com') : '');
      var fw = $('f-who'), ft = $('f-topic');
      ck(fw, 'e-who', fw.selectedIndex ? '' : L('Escolha quem é.', 'Choose who you are.')); ck(ft, 'e-topic', ft.selectedIndex ? '' : L('Escolha um assunto.', 'Choose a subject.'));
      ck(F.msg, 'e-msg', F.msg.value.trim().length < 10 ? L('Escreva uma mensagem com pelo menos 10 caracteres.', 'Please write a message of at least 10 characters.') : '');
      ck(F.ok, 'e-ok', F.ok.checked ? '' : L('Para continuar, aceite o uso dos dados para resposta.', 'To continue, please agree to us using your details to reply.'));
      return { good: good, first: firstBad };
    }
    [F.name, F.email, F.msg].forEach(function (el) { el.addEventListener('blur', function () { if (el.getAttribute('aria-invalid') === 'true') check(); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = check();
      if (!r.good) { st.innerHTML = ''; r.first.focus(); return; }
      var who = $('f-who').value, topic = $('f-topic').value;
      var subject = 'RUMO · ' + topic;
      var body = F.msg.value.trim() + '\n\n— \n' + F.name.value.trim() + '\n' + F.email.value.trim() + '\n' + L('Perfil: ', 'Profile: ') + who;
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      st.innerHTML = '';
      var b = document.createElement('b'); b.textContent = L('O seu programa de email deve abrir agora.', 'Your email app should open now.');
      var p = document.createElement('span');
      p.appendChild(document.createTextNode(L('Confirme e carregue em enviar. Se nada abrir, escreva diretamente para ', 'Check it and press send. If nothing opens, write to us directly at ')));
      var a = document.createElement('a'); a.href = href; a.textContent = to; p.appendChild(a); p.appendChild(document.createTextNode('.'));
      st.appendChild(b); st.appendChild(p);
      var cp = document.createElement('button'); cp.type = 'button'; cp.className = 'btn line'; cp.textContent = L('Copiar mensagem', 'Copy message'); cp.addEventListener('click', function () { navigator.clipboard.writeText(to + '\n' + subject + '\n\n' + body).then(function () { cp.textContent = L('Copiada', 'Copied'); }, function () {}); }); st.appendChild(cp);
      window.location.href = href;
    });
  })();

  /* ---------- 3D ---------- */
  var HOME_T = [0, 0.049, 0.008];
  var PARTS = [
    { g: 'ext', hi: ['A02YYUW_frontal'], p: [0, -0.095, 0.037], n: [0, -0.6, 0.8], o: [8, 104, 0.3],
      k: L('Deteção', 'Detection'), t: L('Sensor frontal', 'Front sensor'),
      d: L('Ultrassónico à prova de água, apontado em frente. Deteta obstáculos de 20 cm a 4,5 m e faz vibrar o motor do dedo indicador.', 'Waterproof ultrasonic sensor pointing straight ahead. It detects obstacles from 20 cm to 4.5 m and drives the index-finger motor.') },
    { g: 'ext', hi: ['A02YYUW_cima'], p: [0, -0.03, 0.041], n: [0, 0, 1], o: [10, 66, 0.3],
      k: L('Deteção', 'Detection'), t: L('Sensor de cabeça', 'Head-height sensor'),
      d: L('Segundo ultrassónico, inclinado para cima, para ramos, placas e outros obstáculos entre a cintura e a cabeça. Avisa pelo motor do polegar.', 'A second ultrasonic sensor, tilted upwards, for branches, signs and other obstacles between waist and head. It warns through the thumb motor.') },
    { g: 'ext', hi: ['Botao_'], p: [0, 0.02, 0.021], n: [0, 0, 1], o: [14, 70, 0.24],
      k: L('Controlo', 'Control'), t: L('Botão', 'Button'),
      d: L('O único botão, à prova de água, debaixo do polegar. Bateria, descrição do ambiente, bloqueio de rumo e SOS, conforme o gesto.', 'The only button, waterproof, under the thumb. Battery level, scene description, heading lock and SOS, depending on the gesture.') },
    { g: 'ext', hi: ['LED_estado'], p: [0.012, 0.003, 0.018], n: [0.4, 0, 1], o: [34, 70, 0.3],
      k: L('Estado', 'Status'), t: L('Luz de estado', 'Status light'),
      d: L('Mostra a carga e a ligação ao telemóvel a quem acompanha o utilizador.', 'Shows the charge level and phone connection to whoever is with the user.') },
    { g: 'ext', hi: ['USB-C_'], p: [0, 0.2065, 0], n: [0, 1, 0.2], o: [30, 30, 0.24],
      k: L('Energia', 'Power'), t: L('Entrada USB-C', 'USB-C port'),
      d: L('Carregamento por cabo, na ponta da pega, protegido por uma tampa de borracha.', 'Cable charging at the end of the handle, protected by a rubber cap.') },
    { g: 'int', hi: ['Celula_'], p: [0, 0.1425, 0.004], n: [0, 0, 1], o: [20, 74, 0.3],
      k: L('Energia', 'Power'), t: L('Bateria', 'Battery'),
      d: L('Célula de iões de lítio de 3350 mAh, em invólucro metálico rígido. Fica ao longo do eixo, junto à mão, para a pega não pesar no pulso.', '3350 mAh lithium-ion cell in a rigid metal case. It sits along the axis, close to the hand, so the handle does not strain the wrist.') },
    { g: 'int', hi: ['Bobina_', 'Recetor_'], p: [0, 0.173, -0.0141], n: [0, 0, -1], o: [160, 80, 0.3],
      k: L('Energia', 'Power'), t: L('Bobina de carregamento', 'Charging coil'),
      d: L('Recebe energia por indução quando a pega é pousada na base. Sem fichas para acertar.', 'Receives power by induction when the handle rests on the base. No plugs to line up.') },
    { g: 'int', hi: ['ESP32-S3_'], p: [-0.0132, -0.058, 0.0037], n: [-1, 0, 0.2], o: [-70, 80, 0.28],
      k: L('Eletrónica', 'Electronics'), t: L('Processador', 'Processor'),
      d: L('O cérebro da bengala. Lê os sensores dez vezes por segundo, comanda os motores e liga-se ao telemóvel por Bluetooth encriptado.', 'The brain of the cane. It reads the sensors ten times a second, drives the motors and connects to the phone over encrypted Bluetooth.') },
    { g: 'int', hi: ['BNO085_'], p: [0.0127, -0.065, 0.004], n: [1, 0, 0.2], o: [70, 84, 0.26],
      k: L('Eletrónica', 'Electronics'), t: L('Sensor de movimento', 'Motion sensor'),
      d: L('Acelerómetro, giroscópio e bússola num só componente. Dá a direção ao bloqueio de rumo e percebe quando a bengala cai.', 'Accelerometer, gyroscope and compass in one part. It gives the heading lock its direction and notices when the cane falls.') },
    { g: 'int', hi: ['Buzzer'], p: [0, -0.015, -0.0105], n: [0, 0, -1], o: [170, 84, 0.26],
      k: L('Eletrónica', 'Electronics'), t: L('Sinal sonoro', 'Buzzer'),
      d: L('Ajuda a encontrar a bengala caída e funciona como sirene de emergência.', 'Helps you find a dropped cane and doubles as an emergency siren.') },
    { g: 'int', hi: ['Motor_frente'], p: [-0.0109, 0.009, 0.0107], n: [-0.4, 0, 1], o: [-16, 74, 0.24],
      k: L('Vibração', 'Vibration'), t: L('Motor da frente', 'Front motor'),
      d: L('Junto ao dedo indicador. Vibra mais depressa à medida que um obstáculo à frente se aproxima.', 'By the index finger. It vibrates faster as an obstacle ahead gets closer.') },
    { g: 'int', hi: ['Motor_cima'], p: [0, 0.06, 0.0144], n: [0, 0, 1], o: [10, 66, 0.24],
      k: L('Vibração', 'Vibration'), t: L('Motor de cima', 'Top motor'),
      d: L('Debaixo do polegar. Avisa de obstáculos à altura da cabeça.', 'Under the thumb. It warns of obstacles at head height.') },
    { g: 'int', hi: ['Motor_esquerdo'], p: [-0.0153, 0.065, -0.0008], n: [-1, 0, 0], o: [-80, 80, 0.24],
      k: L('Vibração', 'Vibration'), t: L('Motor esquerdo', 'Left motor'),
      d: L('Na palma da mão. Pede uma correção para a esquerda quando se desvia do rumo fixado.', 'In the palm. It asks you to correct to the left when you drift off the locked heading.') },
    { g: 'int', hi: ['Motor_direito'], p: [0.0141, 0.05, -0.0068], n: [1, 0, 0], o: [80, 80, 0.24],
      k: L('Vibração', 'Vibration'), t: L('Motor direito', 'Right motor'),
      d: L('Sob as pontas dos dedos. Pede uma correção para a direita.', 'Under the fingertips. It asks you to correct to the right.') }
  ];
  var explorer = null, loading = false;
  function loadModel() {
    if (loading) return; loading = true; var w = $('viewer'); w.classList.add('loading');
    var s = document.createElement('script'); s.src = (document.body.getAttribute('data-assets') || 'assets') + '/rumo_model.js';
    s.onload = function () { w.classList.remove('loading'); initExplorer(); };
    s.onerror = function () { w.classList.remove('loading'); loading = false; $('mv').classList.add('nogl'); };
    document.head.appendChild(s);
  }
  function initExplorer() {
    if (explorer || !window.RumoViewer) return;
    if (!window.RUMO_MODEL_B64) { loadModel(); return; }
    var host = $('mv'), wrap = $('viewer'), layer = $('hs-layer'), list = $('parts');
    var mode = 'ext', asp = 1.4, selected = null;
    function homeView() { return { theta: 34 * D, phi: 100 * D, target: HOME_T, radius: asp > 1.15 ? Math.min(0.9, Math.max(0.46, 0.185 / (0.268 * asp))) : 0.8 }; }
    function fullView() { return { theta: 24 * D, phi: 76 * D, target: [0, -0.26, 0], radius: asp > 1.15 ? Math.min(2.5, 0.52 / (0.268 * asp)) : 1.95 }; }
    var V = RumoViewer.create(host, {
      fov: 30, exposure: 1.05, zoom: true, maxRadius: 4, autoRotate: !root.classList.contains('no-motion'), speed: 9, touchAction: 'pan-y',
      onLayout: function (v, a) {
        var was = asp > 1.15; asp = a; var now = a > 1.15;
        v.setView({ roll: now ? -90 * D : 0 }, true);
        if (!selected || was !== now) v.setView(mode === 'full' ? fullView() : homeView(), true);
      },
      onError: function () { host.classList.add('nogl'); }
    });
    explorer = V || true;
    if (V) document.addEventListener('sl-motion', function () { V.setAutoRotate(!root.classList.contains('no-motion') && !selected); });
    if (!V) return;
    var bE = $('mode-ext'), bI = $('mode-int'), bF = $('mode-full');
    function setMode(m, keepCam) {
      mode = m;
      V.setGhost(m === 'int'); wrap.classList.toggle('xray', m === 'int'); wrap.classList.toggle('full', m === 'full');
      bE.setAttribute('aria-pressed', m === 'ext' ? 'true' : 'false'); bI.setAttribute('aria-pressed', m === 'int' ? 'true' : 'false'); bF.setAttribute('aria-pressed', m === 'full' ? 'true' : 'false');
      if (keepCam) return;
      clearSel(); V.setView(m === 'full' ? fullView() : homeView());
    }
    function clearSel() {
      selected = null; V.highlight(null);
      PARTS.forEach(function (q) { q.hs.classList.remove('active'); q.li.setAttribute('aria-current', 'false'); });
    }
    function select(p) {
      setMode(p.g, true); selected = p;
      PARTS.forEach(function (q) { q.hs.classList.toggle('active', q === p); q.li.setAttribute('aria-current', q === p ? 'true' : 'false'); });
      p.li.scrollIntoView({ block: 'nearest', inline: 'nearest' }); $('part-k').textContent = p.k; $('part-t').textContent = p.t; $('part-d').textContent = p.d;
      V.setAutoRotate(false); V.highlight(p.hi);
      V.setView({ theta: p.o[0] * D, phi: p.o[1] * D, radius: p.o[2] * (asp > 1.15 ? 1.3 : 1.5), target: p.p });
    }
    var num = 0;
    [['ext', L('Exterior', 'Outside')], ['int', L('Interior', 'Inside')]].forEach(function (grp) {
      var gh = document.createElement('li'); gh.className = 'grp'; gh.textContent = grp[1]; gh.setAttribute('aria-hidden', 'true'); list.appendChild(gh);
      PARTS.filter(function (p) { return p.g === grp[0]; }).forEach(function (p) {
        num++;
        var b = document.createElement('button'); b.type = 'button'; b.className = 'hs ' + p.g; b.textContent = num; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true');
        b.addEventListener('click', function () { select(p); }); layer.appendChild(b); V.addHotspot(b, p.p, p.n); p.hs = b;
        var li = document.createElement('li'), lb = document.createElement('button'); lb.type = 'button';
        var n = document.createElement('span'); n.className = 'n ' + p.g; n.setAttribute('aria-hidden', 'true'); n.textContent = num;
        lb.appendChild(n); lb.appendChild(document.createTextNode(p.t)); lb.setAttribute('aria-current', 'false');
        lb.addEventListener('click', function () { select(p); }); li.appendChild(lb); list.appendChild(li); p.li = lb;
      });
    });
    bE.addEventListener('click', function () { setMode('ext'); });
    bI.addEventListener('click', function () { setMode('int'); });
    bF.addEventListener('click', function () { setMode('full'); });
    function nb(id, a, z) { $(id).addEventListener('click', function () { V.nudge(a, 0, z); }); }
    nb('cam-left', -40, 1); nb('cam-right', 40, 1); nb('cam-in', 0, 0.72); nb('cam-out', 0, 1.39);
    window.__explorer = { V: V, select: select, setMode: setMode, parts: PARTS };
  }

  function start() { route(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
