/* Modo normal: fundo 3D único (Canvas 2D com projeção própria, sem WebGL).
   Uma "rede da stack" gira ao fundo: as tecnologias são nós, os projetos são núcleos que se ligam às tecnologias que usam.
   Reage ao mouse, ao scroll e à seção/projeto que está na tela (acende os nós usados naquele projeto). */
window.Bg3D = (function () {
  let cv, g, W = 1, H = 1, DPR = 1, running = false, raf = 0, last = 0, t = 0, theme = 'dark';
  let mx = 0, my = 0, tmx = 0, tmy = 0, focus = null, sy = 0, side = 0.68, sideT = 0.68, reduced = false, onScreen = true;
  const nodes = [], edges = [], stars = [], rings = [], tilt = { a: 0 };
  const PAL = {
    dark: { line: [255, 180, 84], tech: '#5fd3b0', core: '#ffb454', text: '#eef2f5', dim: '#9eacb8', star: 'rgba(255,225,180,', glow: true },
    light: { line: [190, 90, 10], tech: '#1a8f6e', core: '#e07a1a', text: '#1d2329', dim: '#5b6670', star: 'rgba(120,80,30,', glow: false }
  };
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const rnd = (() => { let z = 21; return () => ((z = (z * 16807) % 2147483647) / 2147483647); })();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function build() {
    const techs = DATA.techs, n = techs.length;
    techs.forEach((tc, i) => {                                   // esfera de Fibonacci
      const y = 1 - (i + 0.5) * 2 / n, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      nodes.push({ id: 't' + i, kind: 'tech', label: (window.App ? App.t(tc.label || tc.name) : tc.name), x: Math.cos(th) * r, y, z: Math.sin(th) * r, g: 0.5, tg: 0.5, norm: norm(tc.name) });
    });
    DATA.projects.forEach((p, i) => {
      const a = (i / 3) * Math.PI * 2 + 0.6;
      nodes.push({ id: p.id, kind: 'hub', label: p.name.split(' ')[0], x: Math.cos(a) * 0.48, y: (i - 1) * 0.28, z: Math.sin(a) * 0.48, color: p.color, g: 0.6, tg: 0.6, stack: p.stack.map(norm) });
    });
    nodes.push({ id: 'core', kind: 'core', label: 'RC', x: 0, y: 0, z: 0, g: 0.8, tg: 0.8 });
    const T = nodes.filter((o) => o.kind === 'tech'), H3 = nodes.filter((o) => o.kind === 'hub'), core = nodes[nodes.length - 1];
    H3.forEach((h) => {
      edges.push({ a: core, b: h, ph: rnd(), k: 'core' });
      T.forEach((tc) => { if (h.stack.some((s) => s && (tc.norm.includes(s) || s.includes(tc.norm)))) edges.push({ a: h, b: tc, ph: rnd(), k: 'use', hub: h.id }); });
    });
    T.forEach((a) => { T.map((b) => ({ b, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 })).filter((o) => o.b !== a).sort((p, q) => p.d - q.d).slice(0, 2).forEach((o) => { if (!edges.some((e) => (e.a === a && e.b === o.b) || (e.a === o.b && e.b === a))) edges.push({ a, b: o.b, ph: rnd(), k: 'near' }); }); });
    for (let i = 0; i < 160; i++) stars.push({ x: (rnd() - 0.5) * 5, y: (rnd() - 0.5) * 3.5, z: (rnd() - 0.5) * 4, p: rnd() * 6 });
    [[0.4, 0.2, 1.35], [-0.5, 0.9, 1.6], [1.1, -0.4, 1.9]].forEach(([rx, rz, r], i) => rings.push({ rx, rz, r, sp: 0.35 + i * 0.12, ph: i * 2 }));
  }

  function setFocus(f) {
    focus = f;
    nodes.forEach((n) => {
      if (!f) n.tg = n.kind === 'tech' ? 0.5 : 0.7;
      else if (f === 'all') n.tg = 1;
      else if (f === 'techs') n.tg = n.kind === 'tech' ? 1 : 0.5;
      else if (n.kind === 'hub') n.tg = n.id === f ? 1.2 : 0.25;
      else if (n.kind === 'core') n.tg = 0.6;
      else n.tg = edges.some((e) => e.hub === f && e.b === n) ? 1 : 0.18;
    });
  }

  function rotate(p, yaw, pitch) {
    const cy = Math.cos(yaw), sy2 = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = p.x * cy + p.z * sy2, z1 = -p.x * sy2 + p.z * cy, y1 = p.y * cp - z1 * sp, z2 = p.y * sp + z1 * cp;
    return [x1, y1, z2];
  }

  function frame(now) {
    if (!running) return;
    if (!reduced) { raf = requestAnimationFrame(frame); if (now - last < (W < 700 ? 1000 / 24 : 1000 / 30)) return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!reduced) t += dt;
    side += (sideT - side) * Math.min(1, dt * 2.2); mx += (tmx - mx) * Math.min(1, dt * 3); my += (tmy - my) * Math.min(1, dt * 3);
    const pal = PAL[theme], wide = W > H * 1.1;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    const yaw = t * 0.12 + sy * 0.0016 + mx * 0.7, pitch = -0.28 + my * 0.4 + Math.sin(t * 0.25) * 0.06;
    const R = Math.min(W, H) * (wide ? 0.4 : 0.36), cx = W * (wide ? side : 0.5) + Math.sin(sy * 0.0011) * W * (wide ? 0.07 : 0.05), cyy = H * (wide ? 0.5 : 0.36) + Math.cos(sy * 0.0009) * H * 0.04, F = 3.2;
    const proj = (p) => { const [x, y, z] = rotate(p, yaw, pitch), s = F / (F - z); return { x: cx + x * R * s, y: cyy + y * R * s, z, s }; };

    /* poeira 3D (paralaxe com o mouse e o scroll) */
    g.fillStyle = pal.star + '1)';
    stars.forEach((s) => {
      const [x, y, z] = rotate(s, yaw * 0.35, pitch * 0.35), sc = F / (F - z * 0.5);
      const px = cx + x * R * 0.55 * sc, py = cyy + (y + ((t * 0.03 + s.p) % 1 - 0.5) * 0.4) * R * 0.55 * sc;
      g.globalAlpha = clamp(0.12 + (z + 2) / 8 + 0.2 * Math.sin(t + s.p), 0.05, 0.7); g.fillRect(px, py, 1.4 + sc, 1.4 + sc);
    });
    g.globalAlpha = 1;

    /* anéis orbitais com satélites */
    rings.forEach((r) => {
      g.beginPath();
      for (let i = 0; i <= 72; i++) { const a = i / 72 * 6.283, p = proj(rot2(Math.cos(a) * r.r, 0, Math.sin(a) * r.r, r.rx, r.rz)); i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }
      g.strokeStyle = 'rgba(' + pal.line.join(',') + ',.10)'; g.lineWidth = 1; g.stroke();
      const a = t * r.sp + r.ph, p = proj(rot2(Math.cos(a) * r.r, 0, Math.sin(a) * r.r, r.rx, r.rz));
      g.fillStyle = pal.core; g.globalAlpha = clamp(0.4 + p.z * 0.4, 0.2, 0.9); g.beginPath(); g.arc(p.x, p.y, 3 * p.s, 0, 6.283); g.fill(); g.globalAlpha = 1;
    });

    const P = new Map(); nodes.forEach((n) => { n.g += (n.tg - n.g) * Math.min(1, dt * 4); P.set(n, proj(n)); });
    /* arestas + pulsos */
    edges.forEach((e) => {
      const a = P.get(e.a), b = P.get(e.b), act = Math.min(e.a.g, e.b.g), z = (a.z + b.z) / 2, al = clamp((z + 1.3) / 2.6, 0.12, 1) * (e.k === 'near' ? 0.35 : 0.9) * (0.25 + act * 0.75) * (pal.glow ? 1 : 1.7);
      const col = e.k === 'use' ? hex(e.a.color) : pal.line;
      g.strokeStyle = 'rgba(' + col.join(',') + ',' + (al * 0.55).toFixed(3) + ')'; g.lineWidth = (e.k === 'near' ? 0.8 : 1.4) * ((a.s + b.s) / 2); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      if (e.k !== 'near' && act > 0.4) { const u = (t * 0.35 + e.ph) % 1; g.fillStyle = 'rgba(' + col.join(',') + ',' + Math.min(1, al + 0.2) + ')'; g.beginPath(); g.arc(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, 2.2 * a.s, 0, 6.283); g.fill(); }
    });
    /* nós, do fundo para a frente */
    [...nodes].sort((p, q) => P.get(p).z - P.get(q).z).forEach((n) => {
      const p = P.get(n), al = clamp((p.z + 1.3) / 2.6, 0.2, 1) * (0.3 + n.g * 0.7), base = n.kind === 'core' ? 15 : n.kind === 'hub' ? 12 : 6.5, rad = base * p.s * (0.85 + n.g * 0.35), col = n.kind === 'hub' ? n.color : n.kind === 'core' ? pal.core : pal.tech;
      g.save(); g.globalAlpha = al;
      if (pal.glow) { g.shadowColor = col; g.shadowBlur = 8 + n.g * 22; }
      g.fillStyle = col; g.beginPath(); g.arc(p.x, p.y, rad, 0, 6.283); g.fill();
      g.shadowBlur = 0; g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,255,255,' + (pal.glow ? 0.5 : 0.8) + ')'; g.beginPath(); g.arc(p.x, p.y, rad + 3 + Math.sin(t * 2 + p.x) * 1.2, 0, 6.283); g.stroke();
      const size = n.kind === 'tech' ? 12 : 14;
      if (n.kind !== 'core' && (n.g > 0.45 || p.z > 0.1)) { g.font = '700 ' + (size * p.s).toFixed(1) + 'px "Plus Jakarta Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = n.kind === 'hub' ? pal.text : pal.dim; g.globalAlpha = al * (n.kind === 'hub' ? 1 : clamp(0.4 + n.g * 0.8, 0, 1)); g.fillText(n.label, p.x, p.y - rad - 8); }
      if (n.kind === 'core') { g.font = '800 ' + (13 * p.s).toFixed(1) + 'px Sora, sans-serif'; g.textAlign = 'center'; g.fillStyle = pal.glow ? '#2a1a00' : '#fff'; g.globalAlpha = 1; g.fillText('RC', p.x, p.y + 5 * p.s); }
      g.restore();
    });
  }
  function rot2(x, y, z, rx, rz) { const y1 = y * Math.cos(rx) - z * Math.sin(rx), z1 = y * Math.sin(rx) + z * Math.cos(rx), x2 = x * Math.cos(rz) - y1 * Math.sin(rz), y2 = x * Math.sin(rz) + y1 * Math.cos(rz); return { x: x2, y: y2, z: z1 }; }
  function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

  function resize() { W = window.innerWidth; H = window.innerHeight; DPR = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.25 : 1.5); cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  function init() {
    cv = document.querySelector('#bg3d'); g = cv.getContext('2d'); build(); setFocus(null); resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (e) => { tmx = (e.clientX / W - 0.5) * 2; tmy = (e.clientY / H - 0.5) * 2; document.documentElement.style.setProperty('--mx', tmx.toFixed(3)); document.documentElement.style.setProperty('--my', tmy.toFixed(3)); }, { passive: true });
    window.addEventListener('scroll', () => { sy = window.scrollY; }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (running && !reduced) { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(frame); } } });
  }
  function setActive(a) { if (a && !running) { running = true; resize(); last = performance.now(); raf = requestAnimationFrame(frame); } else if (!a) { running = false; cancelAnimationFrame(raf); } }
  function setReduced(r) { if (reduced === r) return; reduced = r; if (r) { cancelAnimationFrame(raf); if (running) requestAnimationFrame(frame); } else if (running) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  return { init, setLabels: () => { nodes.filter(n => n.kind === 'tech').forEach(n => { const tc = DATA.techs[+n.id.slice(1)]; n.label = App.t(tc.label || tc.name); }); }, setActive, setReduced, setFocus, setSide: (v) => { sideT = v; }, setTheme: (th) => { theme = th === 'light' ? 'light' : 'dark'; if (reduced && running) { last = performance.now() - 50; frame(performance.now()); } }, _t: { frame, get focus() { return focus; } } };
})();
