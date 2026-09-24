(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  const menu = document.getElementById('menu');
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a') && menu.classList.contains('show') && window.bootstrap) {
      bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  });

  // Keeps a canvas' 2D context sized to its box at device pixel ratio
  const fitCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    const box = { w: 0, h: 0 };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      box.w = canvas.clientWidth; box.h = canvas.clientHeight;
      canvas.width = box.w * dpr; canvas.height = box.h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return { ctx, box };
  };
  const onScreen = (el) => {
    const state = { visible: true };
    new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; }).observe(el);
    return state;
  };

  // Matrix rain
  const matrix = document.getElementById('matrix');
  if (matrix && !reduce) {
    const { ctx, box } = fitCanvas(matrix);
    const seen = onScreen(matrix);
    const glyphs = 'アイウエオカキクケコサシスセソ0123456789{}<>/=+*#$ABCDEF';
    const size = 16;
    let drops = [];
    let last = 0;
    const frame = (t) => {
      requestAnimationFrame(frame);
      if (!seen.visible || t - last < 50) return;
      last = t;
      const cols = Math.ceil(box.w / size);
      if (drops.length !== cols) drops = Array.from({ length: cols }, () => Math.random() * -50);
      ctx.fillStyle = 'rgba(3, 8, 6, .14)';
      ctx.fillRect(0, 0, box.w, box.h);
      ctx.font = `${size}px JetBrains Mono, monospace`;
      drops.forEach((y, i) => {
        ctx.fillStyle = Math.random() > 0.975 ? '#d7ffe6' : '#39ff88';
        ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * size, y * size);
        drops[i] = y * size > box.h && Math.random() > 0.975 ? 0 : y + 1;
      });
    };
    requestAnimationFrame(frame);
  }

  // Scramble-decode headline
  const chars = '!<>-_\\/[]{}—=+*^?#01';
  document.querySelectorAll('.scramble').forEach((el, idx) => {
    const text = el.dataset.text;
    if (reduce) return;
    const start = performance.now() + idx * 180;
    const dur = 900;
    const step = (now) => {
      const p = Math.max(0, Math.min((now - start) / dur, 1));
      const done = Math.floor(p * text.length);
      el.textContent = text.slice(0, done) + [...text.slice(done)].map((c) => (c === ' ' ? ' ' : chars[(Math.random() * chars.length) | 0])).join('');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  // Typing terminal
  const term = document.querySelector('#term code');
  const script = [
    ['c', '$ stg init --cliente "tu-empresa"'],
    ['m', '  analizando requerimientos…'],
    ['g', '  ✓ arquitectura cloud lista'],
    ['c', '$ stg deploy --region global'],
    ['m', '  ▸ us-east   ▸ eu-west   ▸ sa-east'],
    ['g', '  ✓ 3 regiones · 99.99% uptime'],
    ['c', '$ stg status'],
    ['a', '  ⚡ rendimiento +240%  costos −35%'],
    ['g', '  ✓ transformación digital completa'],
  ];
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const render = (n, partial = '') => {
    term.innerHTML = script.slice(0, n).map(([c, t]) => `<span class="${c}">${esc(t)}</span>`).join('\n') +
      (n < script.length ? `${n ? '\n' : ''}<span class="${script[n][0]}">${esc(partial)}</span>` : '') + '<span class="caret"></span>';
  };
  if (reduce) {
    render(script.length);
  } else {
    let line = 0; let ch = 0;
    const type = () => {
      if (line >= script.length) { setTimeout(() => { line = 0; ch = 0; type(); }, 4000); return; }
      const text = script[line][1];
      ch++;
      render(line, text.slice(0, ch));
      if (ch >= text.length) { line++; ch = 0; render(line); setTimeout(type, script[line - 1][0] === 'c' ? 500 : 250); }
      else setTimeout(type, script[line][0] === 'c' ? 45 : 12);
    };
    setTimeout(type, 900);
  }

  // Tech stack tabs
  const STACK = {
    web: [['React', 95], ['Next.js', 90], ['Node.js', 92], ['Laravel', 85], ['PostgreSQL', 88], ['GraphQL', 80]],
    movil: [['Flutter', 90], ['React Native', 88], ['Kotlin', 78], ['Swift', 75], ['Firebase', 86]],
    cloud: [['AWS', 92], ['Azure', 82], ['Kubernetes', 88], ['Docker', 95], ['Terraform', 84], ['CI/CD', 90]],
    ia: [['Python', 94], ['TensorFlow', 82], ['PyTorch', 80], ['LLMs & RAG', 88], ['Visión artificial', 76]],
  };
  const stack = document.getElementById('stack');
  const tabs = document.querySelectorAll('[data-tab]');
  const showTab = (key) => {
    stack.innerHTML = STACK[key].map(([name, lvl], i) =>
      `<div style="animation-delay:${i * 60}ms"><b>${name}</b><span class="lvl"><i style="width:${lvl}%"></i></span><small>dominio ${lvl}%</small></div>`).join('');
  };
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((b) => { b.classList.toggle('active', b === t); b.setAttribute('aria-selected', String(b === t)); });
    showTab(t.dataset.tab);
  }));
  showTab('web');

  // Dotted globe: Fibonacci sphere, land approximated with a few spherical-harmonic blobs
  const globe = document.getElementById('globe');
  if (globe) {
    const { ctx, box } = fitCanvas(globe);
    const seen = onScreen(globe);
    const N = 2600;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pts = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      const x = Math.cos(th) * r; const z = Math.sin(th) * r;
      const lat = Math.asin(y); const lon = Math.atan2(z, x);
      const land = Math.sin(lon * 2 + 0.5) * Math.cos(lat * 3) + 0.6 * Math.sin(lon * 3 - lat * 2 + 1.3) + 0.35 * Math.cos(lon * 5 + lat * 4);
      pts.push({ x, y, z, land: land > 0.25 && Math.abs(lat) < 1.25 });
    }
    const cities = [[0.7, -1.3], [0.35, -0.8], [0.9, 0.2], [0.6, 2.2], [-0.4, -1.0], [-0.5, 2.5], [0.2, 0.6], [0.8, -2.1]];
    const toXYZ = ([lat, lon]) => ({ x: Math.cos(lat) * Math.cos(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.sin(lon) });
    const nodes = cities.map(toXYZ);
    const links = [[0, 2], [2, 3], [1, 4], [0, 7], [2, 6], [3, 5], [6, 4]];
    let rot = 0;
    const project = (p, R, cx, cy) => {
      const cos = Math.cos(rot); const sin = Math.sin(rot);
      const x = p.x * cos - p.z * sin; const z = p.x * sin + p.z * cos;
      const tilt = 0.35; const y = p.y * Math.cos(tilt) - z * Math.sin(tilt); const z2 = p.y * Math.sin(tilt) + z * Math.cos(tilt);
      return { sx: cx + x * R, sy: cy - y * R, z: z2 };
    };
    const draw = (t) => {
      if (seen.visible) {
        const { w, h } = box;
        const R = Math.min(w, h) * 0.42; const cx = w / 2; const cy = h / 2;
        ctx.clearRect(0, 0, w, h);
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(57,255,136,.25)'; ctx.lineWidth = 1; ctx.stroke();
        pts.forEach((p) => {
          const q = project(p, R, cx, cy);
          if (q.z < -0.05) return;
          const a = 0.25 + q.z * 0.75;
          ctx.fillStyle = p.land ? `rgba(57,255,136,${a})` : `rgba(34,225,255,${a * 0.35})`;
          ctx.fillRect(q.sx - 1.2, q.sy - 1.2, p.land ? 2.4 : 1.4, p.land ? 2.4 : 1.4);
        });
        links.forEach(([a, b], k) => {
          const A = nodes[a]; const B = nodes[b];
          const segs = 40; const phase = ((t || 0) / 1600 + k * 0.23) % 1;
          ctx.beginPath();
          let started = false; let head = null;
          for (let s = 0; s <= segs; s++) {
            const f = s / segs;
            const m = { x: A.x + (B.x - A.x) * f, y: A.y + (B.y - A.y) * f, z: A.z + (B.z - A.z) * f };
            const len = Math.hypot(m.x, m.y, m.z); const lift = 1 + 0.12 * Math.sin(Math.PI * f);
            const q = project({ x: m.x / len * lift, y: m.y / len * lift, z: m.z / len * lift }, R, cx, cy);
            if (q.z < -0.1) { started = false; continue; }
            started ? ctx.lineTo(q.sx, q.sy) : ctx.moveTo(q.sx, q.sy); started = true;
            if (Math.abs(f - phase) < 0.5 / segs) head = q;
          }
          ctx.strokeStyle = 'rgba(34,225,255,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
          if (head && !reduce) { ctx.beginPath(); ctx.arc(head.sx, head.sy, 2.6, 0, Math.PI * 2); ctx.fillStyle = '#d7ffe6'; ctx.fill(); }
        });
        nodes.forEach((n, i) => {
          const q = project(n, R, cx, cy);
          if (q.z < 0) return;
          const pulse = reduce ? 0 : (((t || 0) / 1000 + i * 0.3) % 1);
          ctx.beginPath(); ctx.arc(q.sx, q.sy, 3.5, 0, Math.PI * 2); ctx.fillStyle = '#ffcc4d'; ctx.fill();
          ctx.beginPath(); ctx.arc(q.sx, q.sy, 3.5 + pulse * 12, 0, Math.PI * 2); ctx.strokeStyle = `rgba(255,204,77,${1 - pulse})`; ctx.stroke();
        });
        if (!reduce) rot += 0.0035;
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    if (reduce) window.addEventListener('resize', () => requestAnimationFrame(draw));
  }

  // Reveal + count-up
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (reduce) { el.textContent = target; return; }
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / 1500, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    reveals.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(el); });
  } else {
    reveals.forEach((el) => { el.classList.add('visible'); el.querySelectorAll('[data-count]').forEach(countUp); });
  }

  // Typed CTA line
  const cta = document.getElementById('typed-cta');
  const phrase = 'enviar_correo --asunto "Quiero transformar mi empresa"';
  if (reduce) { cta.textContent = phrase; } else {
    let i = 0; let typedOnce = false;
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || typedOnce) return;
      typedOnce = true;
      const t = setInterval(() => { cta.textContent = phrase.slice(0, ++i); if (i >= phrase.length) clearInterval(t); }, 35);
    }).observe(cta);
  }
})();
