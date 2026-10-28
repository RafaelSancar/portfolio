/* Mini-demo Uply: app do cliente com o parceiro simulado e guia passo a passo.
   Telas, textos e estados seguem o app: pedido → proposta → contrato → pagamento (escrow) → entrega → aprovação → avaliação. Dados fictícios. */
window.Demos = window.Demos || {};
window.Demos.uply = function (host, lang) {
  const pt = lang === 'pt';
  const L = (a, b) => (pt ? a : b);
  const U = window.DemoUtil;
  const labels = {"Elétrica": "Electrical", "Hidráulica": "Plumbing", "Pintura": "Painting", "Marcenaria": "Carpentry", "Climatização": "Heating & cooling", "Automotivo": "Automotive", "Eletricista": "Electrician", "Energia solar": "Solar energy", "Automação residencial": "Home automation", "Encanador": "Plumber", "Desentupidor": "Drain cleaning", "Pintor": "Painter", "Papel de parede": "Wallpaper", "Marceneiro": "Carpenter", "Montador de móveis": "Furniture assembly", "Ar-condicionado": "Air conditioning", "Reparo de eletrodomésticos": "Appliance repair", "Borracheiro": "Tire repair", "Outros": "Other", "Todas": "All", "Tomadas e iluminação": "Outlets and lighting", "Vazamento e torneira": "Leaks and faucets", "Pneu e estepe": "Tires and spares", "Ver o catálogo": "View catalog", "Baixa": "Low", "Média": "Medium", "Alta": "High"};
  const label = value => pt ? value : (labels[value] || value);
  const brl = (n) => 'R$ ' + n.toFixed(2).replace('.', ',');
  const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const SERVICES = [['Eletricista', 'Tomadas e iluminação'], ['Encanador', 'Vazamento e torneira'], ['Borracheiro', 'Pneu e estepe']];
  const STEPS = [L('Pagamento','Payment'),L('Confirmado','Confirmed'),L('Em execução','In progress'),L('Aprovação','Approval'),L('Concluído','Completed')];
  const CSTAT = { pending_payment: L('Aguardando Pagamento', 'Awaiting payment'), active: L('Em andamento', 'In progress'), delivered: L('Aguardando aprovação', 'Awaiting approval'), revision: L('Em ajuste', 'In revision'), completed: L('Concluído', 'Completed') };
  const S = { role: 'client', scr: { client: 'home' }, hist: { client: [] }, anim: '', req: null, msgs: [], prop: null, con: null, stars: 0, cur: 0, modal: null, filter: 'open', prof: 'Eletricista', title: '', desc: '', err: '', pt: null, unread: 0 };

  /* ---------- ações de domínio (usadas pela interface e pelo guia automático) ---------- */
  const say = (m, k) => { S.pt = [m, k || 'ok']; };
  function go(role, scr, dir) { U.resetScroll(host); if (role !== S.role) S.role = role; if (S.scr[role] !== scr) { S.hist[role].push(S.scr[role]); } S.scr[role] = scr; S.anim = dir || 'fwd'; }
  function back() { U.resetScroll(host); const h = S.hist[S.role]; S.scr[S.role] = h.pop() || 'home'; S.anim = 'back'; }
  const later = (ms, fn) => setTimeout(() => { if (host.isConnected && host.querySelector('.up-phone')) { fn(); draw(); } }, ms);
  function createRequest(t, d) {
    S.req = { title: t, desc: d, prof: S.prof, status: 'open' }; S.msgs = []; S.prop = null; S.con = null; S.stars = 0; S.typing = true;
    S.msgs.push({ from: 'sys', t: L('Pedido enviado. Parceiros da sua região foram avisados.', 'Request sent. Partners in your area were notified.') });
    say(L('Pedido enviado', 'Request sent'));
    const r = S.req;
    later(1600, () => { if (S.req !== r) return; S.typing = false; sendProposal(150, L('Inclui instalação e material básico', 'Includes installation and basic material')); });
  }
  function sendProposal(v, note) {
    if (!S.req) return;
    S.prop = { value: v, note: note || '', status: 'pending' }; S.req.status = 'open'; S.unread = 1;
    S.msgs.push({ from: 'partner', t: L('Olá! Vi seu pedido, posso atender amanhã.', 'Hi! I saw your request, I can come tomorrow.') });
    say(L('Carlos M. enviou uma proposta', 'Carlos M. sent a proposal'));
  }
  function acceptProposal() { S.prop.status = 'accepted'; S.req.status = 'in_progress'; S.con = { status: 'pending_payment', step: 0, value: S.prop.value, payout: 'retained' }; S.unread = 0; say(L('Proposta aceita!', 'Proposal accepted!')); }
  function pay() {
    S.con.status = 'active'; S.con.step = 2; say(L('Pagamento confirmado!', 'Payment confirmed!'));
    const c = S.con; later(4200, () => { if (S.con === c && c.status === 'active') deliver(); });
  }
  function deliver() { S.con.status = 'delivered'; S.con.step = 3; say(L('Entregue — aguardando sua aprovação', 'Delivered — awaiting your approval')); }
  function approve() { S.con.status = 'completed'; S.con.step = 4; S.con.payout = 'released'; S.req.status = 'completed'; say(L('Entrega aprovada — serviço concluído', 'Delivery approved — service completed')); }
  function rate(n) { S.stars = n; say(L('Avaliação enviada. Obrigado pelo feedback.', 'Review sent. Thanks for the feedback.')); }

  /* ---------- guia ---------- */
  const steps = () => [
    { t: L('Pedir um serviço', 'Request a service'), done: !!S.req, go: () => go('client', 'catalog'), auto: () => { S.title = L('Instalação de chuveiro', 'Shower installation'); S.desc = L('Trocar o chuveiro e revisar a fiação.', 'Replace the shower and check wiring.'); createRequest(S.title, S.desc); }, to: 'orders' },
    { t: L('Receber a proposta do parceiro', 'Receive the partner proposal'), done: !!S.prop, wait: true, go: () => go('client', 'chat') },
    { t: L('Aceitar a proposta', 'Accept the proposal'), done: !!S.prop && S.prop.status === 'accepted', go: () => go('client', 'chat'), auto: acceptProposal, to: 'contract' },
    { t: L('Pagar (Mercado Pago)', 'Pay (Mercado Pago)'), done: !!S.con && S.con.step >= 2, go: () => go('client', 'contract'), auto: pay, to: 'contract' },
    { t: L('Aguardar a entrega', 'Wait for delivery'), done: !!S.con && S.con.step >= 3, wait: true, go: () => go('client', 'contract') },
    { t: L('Aprovar a entrega', 'Approve delivery'), done: !!S.con && S.con.step >= 4, go: () => go('client', 'contract'), auto: approve, to: 'contract' },
    { t: L('Avaliar o serviço', 'Rate the service'), done: S.stars > 0, go: () => go('client', 'contract'), auto: () => rate(5), to: 'contract' }
  ];
  function guide() {
    const st = steps(), nx = st.findIndex((x) => !x.done), cur = st[nx];
    return `<div class="ph-side"><b>${L('Fluxo do Uply', 'Uply flow')}</b><p class="mini">${L('Você usa o app como cliente. O parceiro responde sozinho, como no app real.', 'You use the app as a client. The partner replies on their own, like in the real app.')}</p>
      <ol class="up-steps">${st.map((x, i) => `<li class="${x.done ? 'done' : i === nx ? 'now' : ''}"><i>${x.done ? '✓' : i + 1}</i><span>${x.t}</span>${i === nx ? (x.wait ? `<em class="wt">${L('aguardando…', 'waiting…')}</em>` : `<button class="up-go" data-a="goto" data-i="${i}">${L('Ir', 'Go')}</button>`) : ''}</li>`).join('')}</ol>
      ${nx < 0 ? `<button class="up-sim" data-a="reset">${L('↺ Recomeçar demo', '↺ Restart demo')}</button>` : cur.wait ? `<button class="up-sim off" disabled>${L('O parceiro está respondendo…', 'The partner is replying…')}</button>` : `<button class="up-sim" data-a="auto">${L('▶ Executar este passo para mim', '▶ Run this step for me')}</button>`}</div>`;
  }

  /* ---------- peças de interface ---------- */
  const logo = '<span class="up-logo">UPLY</span>';
  const hero = (title, sub, canBack, right) => `<div class="up-hero"><i class="blob"></i><div class="up-top">${logo}<span>${right || ''}${canBack ? '<button class="up-back" data-a="back">‹</button>' : ''}</span></div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>`;
  const cta = (label, a, d) => `<button class="up-cta" data-a="${a}" ${d || ''}><span>${label}</span><b>›</b></button>`;
  const badge = (t, c) => `<span class="up-badge ${c}">${t}</span>`;
  const reqBadge = (s) => ({ open: badge(L('Aberta', 'Open'), 'w'), in_progress: badge(L('Andamento', 'In progress'), 'g'), completed: badge(L('Concluída', 'Completed'), 'g') }[s]);
  const bell = (n) => `<span class="up-ic">🔔${n ? `<em>${n}</em>` : ''}</span>`;
  const tile = (i, t, a, n) => `<div class="up-tile" data-a="${a}">${n ? `<em class="bdg">${n}</em>` : ''}<span>${i}</span>${t}</div>`;

  function chatView(role) {
    const mine = role === 'client' ? 'client' : 'partner', p = S.prop;
    const bubbles = S.msgs.slice(-3).map((m) => (m.from === 'sys' ? `<div class="bub sys">${m.t}</div>` : `<div class="bub ${m.from === mine ? 'me' : 'you'}">${m.t}</div>`)).join('');
    const card = p ? `<div class="up-prop"><div class="r"><b>${L('Proposta', 'Proposal')}</b>${p.status === 'pending' ? badge(L('Aguardando resposta', 'Awaiting reply'), 'w') : p.status === 'accepted' ? badge(L('Aceita', 'Accepted'), 'g') : badge(L('Recusada', 'Declined'), 'r')}</div>
      <div class="val">${brl(p.value)}</div><small>${L('Data: amanhã 14:00', 'Date: tomorrow 2pm')}</small>${p.note ? `<small>${esc(p.note)}</small>` : ''}
      ${p.status === 'pending' && role === 'client' ? `<div class="r2"><button class="up-ghost" data-a="refuse">${L('Recusar', 'Decline')}</button><button class="up-ok" data-a="accept">${L('Aceitar', 'Accept')}</button></div>` : ''}</div>` : '';
    const acc = p && p.status === 'accepted' ? `<div class="up-alert"><b>${L('Proposta aceita!', 'Proposal accepted!')}</b>${L('Acompanhe o andamento na aba Pedidos.', 'Track progress in the Orders tab.')}<button class="up-ok" data-a="nav" data-r="${role}" data-s="${role === 'client' ? 'contract' : 'pcontract'}">${L('Ver contrato', 'View contract')}</button></div>` : '';
    return `<div class="up-chead"><button class="up-back" data-a="back">‹</button><span class="up-av">${role === 'client' ? 'C' : 'R'}</span><div><b>${role === 'client' ? 'Carlos M.' : L('Rafael (cliente)','Rafael (client)')}</b><small>${S.typing ? L('digitando…', 'typing…') : 'online'}</small></div></div>
      <div class="up-chat" id="upChat"><div class="up-day">${L('Hoje', 'Today')}</div>${bubbles || `<div class="up-empty"><b>${L('Nenhuma mensagem ainda.', 'No messages yet.')}</b>${L('Diga olá para começar.', 'Say hi to start.')}</div>`}${card}${acc}</div>
      <div class="up-compose">${role === 'partner' ? `<button class="up-doc" data-a="modal" data-m="prop" title="${L('Nova proposta', 'New proposal')}">📄</button>` : ''}<input class="up-in" id="upIn" placeholder="${L('Mensagem', 'Message')}"><button class="up-send" data-a="say" data-r="${role}">➤</button></div>`;
  }

  const SCREENS = {
    client: {
      home() {
        return `<div class="up-hero big"><i class="blob"></i><div class="up-top">${logo}</div><small>${L('Olá, Rafael', 'Hi, Rafael')}</small><h3 class="xl">${L('O que você<br>precisa?', 'What do you<br>need?')}</h3><p>${L('Peça. Negocie. Resolva.', 'Ask. Negotiate. Solve.')}</p>${cta(L('Pedir serviço', 'Request service'), 'nav', 'data-r="client" data-s="catalog"')}</div>
          <div class="up-body"><div class="up-tiles">${tile('📋', L('Pedidos','Orders'), 'nav" data-r="client" data-s="orders')}${tile('💬', L('Conversas','Chats'), 'nav" data-r="client" data-s="chat', S.unread)}${tile('📄', L('Contratos','Contracts'), 'nav" data-r="client" data-s="contract')}</div>
          ${S.prop && S.prop.status === 'pending' ? `<div class="up-banner pulse" data-a="nav" data-r="client" data-s="chat"><small>${L('NOVA PROPOSTA', 'NEW PROPOSAL')}</small><b>${esc(S.req.title)}</b><span>${brl(S.prop.value)}</span></div>` : ''}
          ${S.con ? `<div class="up-banner" data-a="nav" data-r="client" data-s="contract"><small>${L('CONTRATO', 'CONTRACT')}</small><b>${esc(S.req.title)}</b><span>${CSTAT[S.con.status]}</span></div>` : ''}
          ${S.con && S.con.status === 'delivered' ? `<div class="up-act" data-a="nav" data-r="client" data-s="contract"><b>${L('Confirmar entrega', 'Confirm delivery')}</b><small>${L('Toque para aprovar ou pedir ajuste', 'Tap to approve or request adjustment')}</small></div>` : ''}
          ${S.con && S.con.status === 'completed' && !S.stars ? `<div class="up-act" data-a="nav" data-r="client" data-s="review"><b>${L('Avaliar serviço', 'Rate service')}</b><small>${L('Toque para dar uma nota ao atendimento', 'Tap to rate the service')}</small></div>` : ''}
          <div class="up-sec"><b>${L('Serviços', 'Services')}</b></div><div class="up-grid">${SERVICES.map(([a, b]) => `<div class="up-svc" data-a="pick" data-p="${a}"><b>${label(a)}</b><small>${label(b)}</small></div>`).join('')}</div></div>`;
      },
      catalog() {
        return hero(L('Escolha o<br>serviço', 'Choose the<br>service'), L('Toque em uma profissão para pedir', 'Tap a profession to request'), true) + `<div class="up-body">${SERVICES.map(([p, d]) => `<div class="up-row" data-a="pick" data-p="${p}"><span>${label(p)}</span><small>${label(d)}</small>›</div>`).join('')}</div>`;
      },
      new() {
        return hero(L('Pedir<br>serviço', 'Request<br>service'), L('Profissão: ', 'Profession: ') + label(S.prof), true) + `<div class="up-body"><div class="up-sec"><b>${L('Local do serviço', 'Service location')}</b></div><div class="up-card sel">Rua das Flores, 120 — Centro<small>São Paulo / SP · ${L('Endereço encontrado', 'Address found')}</small></div>
          <label class="up-lb">${L('Título', 'Title')}</label><input class="up-in" data-f="title" placeholder="${L('Ex: Instalação de chuveiro', 'E.g. Shower installation')}" value="${esc(S.title)}">
          <label class="up-lb">${L('Descrição', 'Description')}</label><textarea class="up-in" rows="3" data-f="desc" placeholder="${L('O que você precisa?', 'What do you need?')}">${esc(S.desc)}</textarea>
          ${S.err ? `<p class="up-err">${S.err}</p>` : ''}${cta(L('Enviar pedido', 'Send request'), 'send')}</div>`;
      },
      orders() {
        const f = S.filter, list = S.req ? [S.req] : [], vis = list.filter((r) => f === 'all' || (f === 'open' && r.status !== 'completed') || (f === 'done' && r.status === 'completed'));
        return hero(L('Pedidos', 'Orders'), '', true) + `<div class="up-body"><div class="up-chips">${[['open', L('Em aberto', 'Open')], ['done', L('Concluídas', 'Completed')], ['all', L('Todos', 'All')]].map(([k, l]) => `<span class="${f === k ? 'on' : ''}" data-a="flt" data-f="${k}">${l}</span>`).join('')}</div>
          ${vis.map((r) => `<div class="up-card clk" data-a="nav" data-r="client" data-s="${S.con ? 'contract' : 'chat'}"><div class="r"><b>${esc(r.title)}</b>${reqBadge(r.status)}</div><small>${label(r.prof)}</small><small class="cta-t">${S.con ? (S.con.status === 'pending_payment' ? L('Aguardando pagamento', 'Awaiting payment') : L('Acompanhar serviço', 'Track service')) : S.prop ? L('Falar com o profissional', 'Talk to the professional') : L('Aguardando profissional', 'Waiting for a professional')} ›</small></div>`).join('') || `<div class="up-empty"><b>${L('Nenhum pedido ainda', 'No orders yet')}</b>${L('Peça um serviço e acompanhe tudo por aqui — do primeiro contato à conclusão.', 'Request a service and track everything here.')}</div>`}</div>`;
      },
      chat() { return S.req ? chatView('client') : hero(L('Conversas', 'Chats'), '', true) + `<div class="up-body"><div class="up-empty"><b>${L('Nenhuma conversa', 'No chats')}</b>${L('Faça um pedido para começar a negociar.', 'Make a request to start negotiating.')}</div></div>`; },
      contract() {
        if (!S.con) return hero(L('Contratos', 'Contracts'), '', true) + `<div class="up-body"><div class="up-empty"><b>${L('Nenhum contrato', 'No contracts')}</b>${L('Aceite uma proposta para gerar o contrato.', 'Accept a proposal to create a contract.')}</div></div>`;
        const c = S.con, fee = c.value * 0.14;
        let btns = '';
        if (c.status === 'pending_payment') btns = cta(L('Pagar agora', 'Pay now'), 'nav', 'data-r="client" data-s="pay"');
        if (c.status === 'active' || c.status === 'revision') btns = `<div class="up-working" role="status"><i></i>${c.status === 'revision' ? L('Aguarde: o parceiro está ajustando o serviço.', 'Please wait: the partner is adjusting the service.') : L('Aguarde: o parceiro está realizando o serviço.', 'Please wait: the partner is carrying out the service.')}</div>`;
        if (c.status === 'delivered') btns = `${cta(L('Aprovar entrega', 'Approve delivery'), 'modal', 'data-m="approve"')}<button class="up-ghost wide" data-a="modal" data-m="adjust">${L('Solicitar ajuste', 'Request adjustment')}</button>`;
        if (c.status === 'completed') btns = S.stars ? `<p class="up-ok-t">★ ${S.stars}/5 — ${L('Avaliação enviada', 'Review sent')}</p>` : cta(L('Avaliar serviço', 'Rate service'), 'nav', 'data-r="client" data-s="review"');
        return hero(esc(S.req.title), CSTAT[c.status], true) + `<div class="up-body"><div class="up-stepper">${STEPS.map((x, i) => `<div class="stp ${i < c.step ? 'done' : i === c.step ? 'act' : ''}"><i>${i < c.step ? '✓' : i + 1}</i><span>${x}</span></div>`).join('')}</div>
          <div class="up-card"><b>${esc(S.req.title)}</b><small>${L('Parceiro', 'Partner')}: Carlos M.</small><div class="up-line"><span>${L('Valor do servico', 'Service amount')}</span><b>${brl(c.value)}</b></div><div class="up-line"><span>${L('Taxa UPLY (14%)','UPLY fee (14%)')}</span><b>${brl(fee)}</b></div><div class="up-line"><span>${L('Pagamento', 'Payment')}</span><b>${c.payout === 'retained' ? (c.step >= 2 ? L('Retido (escrow)', 'Held (escrow)') : L('Pendente', 'Pending')) : c.payout === 'released' ? L('Repasse liberado', 'Payout released') : L('Estornado', 'Refunded')}</b></div></div>${btns}</div>`;
      },
      pay() { return hero(L('Pagamento', 'Payment'), 'Mercado Pago', true) + `<div class="up-body"><div class="up-card"><b>${L('Abrindo o Mercado Pago', 'Opening Mercado Pago')}</b><small>${L('Depois do pagamento você volta ao acompanhamento do pedido com o status atualizado.', 'After paying you return to the order tracking with the updated status.')}</small><div class="mp"><i></i>Mercado Pago · ${brl(S.con.value)}</div></div>${cta(L('Já paguei — verificar', 'I already paid — check'), 'paid')}</div>`; },
      review() { return hero(L('Avaliar serviço', 'Rate service'), L('Contrato #1042', 'Contract #1042'), true) + `<div class="up-body"><div class="up-card center"><b>${L('Quantas estrelas você dá para este serviço?', 'How many stars do you give this service?')}</b><div class="up-stars">${[1, 2, 3, 4, 5].map((n) => `<span class="${n <= S.cur ? 'on' : ''}" data-a="star" data-n="${n}">★</span>`).join('')}</div></div>${cta(L('Enviar avaliação', 'Send review'), 'rate', S.cur ? '' : 'disabled')}</div>`; }
    }
  };

  function modal() {
    const m = S.modal; if (!m) return '';
    const M = { approve: [L('Aprovar entrega', 'Approve delivery'), L('Confirma que o serviço foi concluído conforme esperado?', 'Confirm the service was completed as expected?'), 'do-approve'], adjust: [L('Solicitar ajuste', 'Request adjustment'), L('Descreva o que precisa ser corrigido', 'Describe what needs fixing'), 'do-adjust'] }[m];
    return `<div class="up-mod"><div class="up-mbox"><b>${M[0]}</b><p>${M[1]}</p>${m === 'adjust' ? `<input class="up-in" placeholder="${L('Motivo do ajuste...', 'Adjustment reason...')}">` : ''}<div class="r2"><button class="up-ghost" data-a="modal" data-m="">${L('Voltar', 'Back')}</button><button class="up-ok" data-a="${M[2]}">${L('Confirmar', 'Confirm')}</button></div></div></div>`;
  }

  function draw() {
    const scr = SCREENS[S.role][S.scr[S.role]] ? SCREENS[S.role][S.scr[S.role]]() : SCREENS[S.role].home();
    host.innerHTML = `<div class="up-wrap"><div class="up-left">
      <div class="up-phone"><div class="up-screen ${S.anim ? 'a-' + S.anim : ''}">${scr}</div>${modal()}</div></div>${guide()}</div>`;
    S.anim = '';
    const ph = host.querySelector('.up-phone');
    if (S.pt) { U.toast(ph, S.pt[0], S.pt[1]); S.pt = null; }
    U.startPage(host,S.role+':'+S.scr[S.role]);
    U.countAll(host);
    const c = host.querySelector('#upChat'); if (c) c.scrollTop = c.scrollHeight;
  }

  host.oninput = (e) => { if (e.target.dataset.f) S[e.target.dataset.f] = e.target.value; };
  host.onkeydown = (e) => { if (e.key === 'Enter' && e.target.id === 'upIn') { const b = host.querySelector('[data-a=say]'); if (b) act('say', b.dataset); } };
  host.onclick = (e) => { const b = e.target.closest('[data-a]'); if (b) act(b.dataset.a, b.dataset); };

  function act(a, d) {
    d = d || {};
    if (a === 'nav') go(d.r || S.role, d.s);
    else if (a === 'back') back();
    else if (a === 'flt') S.filter = d.f;
    else if (a === 'pick') { S.prof = d.p; go('client', 'new'); }
    else if (a === 'send') {
      if (!S.title.trim()) S.err = L('Informe um título para o pedido', 'Enter a title for the request');
      else if (!S.desc.trim()) S.err = L('Descreva o serviço desejado', 'Describe the service');
      else { S.err = ''; createRequest(S.title, S.desc); S.hist.client = ['home']; S.scr.client = 'orders'; S.anim = 'fwd'; }
    }
    else if (a === 'say') {
      const el = host.querySelector('#upIn'), v = el.value.trim(); if (!v) return;
      const bad = /(\d[\s().-]*){8,}|@|whats|zap|telegram/i.test(v), from = d.r === 'client' ? 'client' : 'partner';
      S.msgs.push({ from, t: bad ? '••••••' : esc(v) });
      if (bad) { S.msgs.push({ from: 'sys', t: L('⚠ Contato externo bloqueado. Negocie pelo app para ter proteção.', '⚠ External contact blocked. Negotiate in-app to stay protected.') }); }
    }
    else if (a === 'refuse') { S.prop.status = 'refused'; say(L('Proposta recusada', 'Proposal declined'), 'err'); const r = S.req; later(1800, () => { if (S.req === r && S.prop && S.prop.status === 'refused') { S.msgs.push({ from: 'partner', t: L('Entendi! Consigo fazer por um valor menor.', 'Got it! I can do it for a lower price.') }); sendProposal(130, L('Valor ajustado, mesmo serviço', 'Adjusted price, same service')); } }); }
    else if (a === 'accept') acceptProposal();
    else if (a === 'paid') { pay(); S.scr.client = 'contract'; S.anim = 'fwd'; }
    else if (a === 'modal') S.modal = d.m || null;
    else if (a === 'do-approve') { approve(); S.modal = null; }
    else if (a === 'do-adjust') { const c = S.con; c.status = 'revision'; c.step = 2; S.modal = null; say(L('Ajuste solicitado ao parceiro', 'Adjustment requested from the partner'), 'warn'); later(3000, () => { if (S.con === c && c.status === 'revision') deliver(); }); }
    else if (a === 'star') S.cur = +d.n;
    else if (a === 'rate') { rate(S.cur); S.scr.client = 'contract'; S.anim = 'back'; }
    else if (a === 'goto') steps()[+d.i].go();
    else if (a === 'auto') { const st = steps(), i = st.findIndex((x) => !x.done); if (i >= 0 && !st[i].wait) { st[i].auto(); S.scr.client = st[i].to; S.anim = 'fwd'; } }
    else if (a === 'reset') { Object.assign(S, { req: null, msgs: [], prop: null, con: null, stars: 0, cur: 0, modal: null, title: '', desc: '', err: '', unread: 0, typing: false, scr: { client: 'home' }, hist: { client: [] } }); S.anim = 'back'; }
    draw();
  }
  draw();
};
