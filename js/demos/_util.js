/* Utilitários das mini-demos: contagem animada, gráficos SVG que se desenham sozinhos, toasts. */
window.DemoUtil = (function () {
  const FMT = {
    brl: (n) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    int: (n) => Math.round(n).toLocaleString('pt-BR'),
    h: (n) => Math.round(n) + 'h',
    pct: (n) => Math.round(n) + '%'
  };
  function count(el, to, fmt, ms) {
    if (document.documentElement.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), d = ms || 900;
    (function f(now) {
      const p = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e);
      if (p < 1 && el.isConnected) requestAnimationFrame(f); else el.textContent = fmt(to);
    })(t0);
  }
  /* procura [data-count] dentro de root e anima (data-fmt = brl | int | h | pct) */
  function countAll(root) { root.querySelectorAll('[data-count]').forEach((el) => count(el, +el.dataset.count, FMT[el.dataset.fmt] || FMT.int)); }

  /* gráfico de linha/área: pts = [valores]; retorna svg */
  function line(vals, o) {
    o = o || {}; const w = o.w || 420, h = o.h || 160, pad = 18, max = Math.max(...vals, 1) * 1.15, min = Math.min(0, ...vals);
    const x = (i) => pad + (i * (w - pad * 2)) / (vals.length - 1), y = (v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    const d = vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const c = o.color || '#6c63ff', id = 'g' + Math.random().toString(36).slice(2, 7);
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${o.label || 'gráfico'}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>
      ${[0.25, 0.5, 0.75].map((f) => `<line x1="${pad}" x2="${w - pad}" y1="${(h - pad - f * (h - pad * 2)).toFixed(1)}" y2="${(h - pad - f * (h - pad * 2)).toFixed(1)}" stroke="rgba(120,130,150,.25)" stroke-dasharray="3 4"/>`).join('')}
      <path d="${d} L${x(vals.length - 1)} ${h - pad} L${pad} ${h - pad}Z" fill="url(#${id})" class="area"/>
      <path d="${d}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" class="draw"/>
      ${vals.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.4" fill="#fff" stroke="${c}" stroke-width="2" class="dot" style="animation-delay:${0.5 + i * 0.07}s"><title>${o.labels ? o.labels[i] + ': ' : ''}${v}</title></circle>`).join('')}
      ${(o.labels || []).map((l, i) => `<text x="${x(i).toFixed(1)}" y="${h - 3}" font-size="10" text-anchor="middle" fill="currentColor" opacity=".6">${l}</text>`).join('')}</svg>`;
  }
  /* barras horizontais/verticais */
  function bars(items, o) {
    o = o || {}; const w = o.w || 420, h = o.h || 160, pad = 22, max = Math.max(...items.map((i) => i.v), 1) * 1.1, bw = (w - pad * 2) / items.length * 0.62;
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${o.label || 'barras'}">${items.map((it, i) => {
      const bh = (it.v / max) * (h - pad * 2), x = pad + i * ((w - pad * 2) / items.length) + ((w - pad * 2) / items.length - bw) / 2;
      return `<rect x="${x.toFixed(1)}" y="${(h - pad - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="${it.c || o.color || '#6c63ff'}" class="bar-v" style="animation-delay:${i * 0.08}s"><title>${it.l}: ${it.v}</title></rect><text x="${(x + bw / 2).toFixed(1)}" y="${h - 6}" font-size="10" text-anchor="middle" fill="currentColor" opacity=".65">${it.l}</text>`;
    }).join('')}</svg>`;
  }
  /* rosca */
  function donut(segs, o) {
    o = o || {}; const r = 52, c = 2 * Math.PI * r, tot = segs.reduce((a, s) => a + s.v, 0) || 1; let off = 0;
    return `<svg class="chart donut" viewBox="0 0 140 140" role="img" aria-label="${o.label || 'rosca'}"><circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(120,130,150,.2)" stroke-width="18"/>${segs.map((s, i) => { const len = (s.v / tot) * c, el = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${s.c}" stroke-width="18" stroke-dasharray="${len.toFixed(1)} ${(c - len).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 70 70)" class="seg" style="animation-delay:${i * 0.15}s"><title>${s.l}: ${s.v}</title></circle>`; off += len; return el; }).join('')}<text x="70" y="75" text-anchor="middle" font-size="18" font-weight="800" fill="currentColor">${o.center || ''}</text></svg>`;
  }
  /* toast dentro de um container (position: absolute) */
  function toast(box, msg, kind) {
    if (!box) return; const t = document.createElement('div'); t.className = 'dm-toast ' + (kind || 'ok'); t.textContent = msg; box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2200);
  }
  return { FMT, count, countAll, line, bars, donut, toast };
})();
