/* Mini-demo Nous: perfis, dashboards com gráficos, WorkGrid (arrastar), timesheet com regra de estouro,
   aprovação do GP, fechamento mensal que gera contas a pagar/receber e baixa financeira. Dados fictícios. */
window.Demos = window.Demos || {};
window.Demos.dara = function (host, lang) {
  const pt = lang === 'pt';
  const L = (a, b) => (pt ? a : b);
  const U = window.DemoUtil;
  const brl = (n) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const fmt = (d) => d.split('-').reverse().join('/');
  const DAYS = ['2025-11-10', '2025-11-11', '2025-11-12', '2025-11-13', '2025-11-14'];
  const DN = pt ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const ATV = { DESENVOLVIMENTO: L('Desenvolvimento', 'Development'), SUPORTE: L('Suporte', 'Support'), REUNIAO: L('Reunião', 'Meeting'), ANALISE: L('Análise', 'Analysis'), OUTRO: L('Outro', 'Other') };
  const PROJ = [
    { cod: 'PRJ-001', nome: L('Portal do Cliente', 'Client Portal'), cli: 'Acme Ltda', tipo: 'FECHADAS', horas: 40, perm: false, lim: 0 },
    { cod: 'PRJ-002', nome: L('Suporte N2','Tier 2 support'), cli: 'Beta S/A', tipo: 'ABERTAS', horas: 0, perm: true, lim: 0 },
    { cod: 'PRJ-003', nome: L('Migração ERP', 'ERP Migration'), cli: 'Acme Ltda', tipo: 'FECHADAS', horas: 24, perm: true, lim: 25 }
  ];
  const os = [
    { n: 'OS-0101', data: '2025-11-03', p: 0, h: 16, a: 'DESENVOLVIMENTO', d: L('Modelagem das telas', 'Screen modeling'), s: 'APROVADA' },
    { n: 'OS-0102', data: '2025-11-04', p: 1, h: 8, a: 'SUPORTE', d: L('Atendimentos da semana', 'Weekly tickets'), s: 'APROVADA' },
    { n: 'OS-0103', data: '2025-11-05', p: 2, h: 20, a: 'ANALISE', d: L('Mapeamento de tabelas', 'Table mapping'), s: 'APROVADA' },
    { n: 'OS-0104', data: '2025-11-06', p: 0, h: 6, a: 'REUNIAO', d: L('Alinhamento com cliente', 'Client sync'), s: 'PENDENTE' },
    { n: 'OS-0105', data: '2025-11-07', p: 1, h: 4, a: 'SUPORTE', d: '—', s: 'REJEITADA', motivo: L('Descrição insuficiente', 'Insufficient description') }
  ];
  const cpagar = [{ id: 1, venc: '2025-11-05', desc: L('Aluguel do escritório', 'Office rent'), cat: L('Despesas fixas', 'Fixed costs'), prev: 4200, pago: 0, s: 'VENCIDA' }, { id: 2, venc: '2025-11-20', desc: L('Licenças de software', 'Software licenses'), cat: L('TI','IT'), prev: 1890, pago: 0, s: 'PREVISTA' }];
  const creceber = [{ id: 1, venc: '2025-11-12', cli: 'Beta S/A', orig: L('Fatura 2025-10', 'Invoice 2025-10'), prev: 6300, rec: 0, s: 'PREVISTA' }, { id: 2, venc: '2025-11-08', cli: 'Acme Ltda', orig: L('Fatura 2025-09', 'Invoice 2025-09'), prev: 9800, rec: 9800, s: 'RECEBIDA' }];
  const ROLES = { admin: L('Administrador', 'Administrator'), gp: L('Gerente de Projetos', 'Project Manager'), ana: L('Analista','Analyst'), com: L('Comum', 'Common') };
  const DESC = { admin: L('Acesso total ao sistema', 'Full system access'), gp: L('Gestão do portfólio próprio, aprovações e leitura financeira limitada', 'Own portfolio management, approvals and limited finance read'), ana: L('Apontamento de horas e visão dos próprios projetos', 'Time entry and own projects view'), com: L('Leitura restrita de clientes e projetos vinculados', 'Restricted read access') };
  const MENU = {
    admin: ['home', 'dashe', 'dashp', 'workgrid', 'ts', 'meus', 'pend', 'todas', 'fech', 'cpagar', 'creceber'],
    gp: ['home', 'dashp', 'workgrid', 'pend', 'todas', 'cpagar', 'creceber'],
    ana: ['home', 'dasha', 'workgrid', 'ts', 'meus'],
    com: ['home', 'dashp', 'workgrid']
  };
  const NAV = { home: ['🏠', L('Início', 'Home')], dashe: ['📈', L('Dashboard executivo', 'Executive dashboard')], dashp: ['📊', L('Dashboard de projetos', 'Projects dashboard')], dasha: ['👤', L('Dashboard do analista', 'Analyst dashboard')], workgrid: ['🗂', 'WorkGrid'], ts: ['🗓', 'Timesheet'], meus: ['🕘', L('Meus apontamentos', 'My entries')], pend: ['⏳', L('Pendentes', 'Pending')], todas: ['📋', L('Todas as OS', 'All OS')], fech: ['🔒', L('Fechamento', 'Closing')], cpagar: ['💸', L('Contas a pagar', 'Payables')], creceber: ['💰', L('Contas a receber', 'Receivables')] };
  const COLS = ['RASCUNHO', 'PENDENTE', 'APROVADA', 'REJEITADA', 'FATURADA'];
  const financialStatus = s => pt ? s : ({PAGA:'PAID',VENCIDA:'OVERDUE',PREVISTA:'EXPECTED',RECEBIDA:'RECEIVED'}[s] || s);
  const SLAB = { RASCUNHO: L('Rascunho', 'Draft'), PENDENTE: L('Pendente', 'Pending'), APROVADA: L('Aprovada', 'Approved'), REJEITADA: L('Rejeitada', 'Rejected'), FATURADA: L('Faturada', 'Invoiced') };
  const st = { role: 'admin', page: 'home', sel: new Set(), dlg: null, msg: '', msgT: 'ok', step: 1, closed: [], nextN: 106, view: 'week', drag: null, pick2: null, bell: false, toast: null };

  const pill = (s) => `<span class="nx-pill ${s}">${SLAB[s]}</span>`;
  const sumH = (p, f) => os.filter((o) => o.p === p && f(o)).reduce((a, o) => a + o.h, 0);
  const apprH = () => os.filter((o) => o.s === 'APROVADA' || o.s === 'FATURADA').reduce((a, o) => a + o.h, 0);
  const say = (m, k) => { st.toast = [m, k || 'ok']; };
  const mark = '<svg viewBox="0 0 100 100" width="26" height="26"><path d="M20 80 V44 Q20 28 36 28 H44 Q60 28 60 44 V80" fill="none" stroke="#f8f8f8" stroke-width="13" stroke-linecap="round"/><rect x="70" y="74" width="20" height="12" rx="2" fill="#FF5B14"/></svg>';
  const can = (perm) => ({ approve: st.role === 'admin' || st.role === 'gp', submit: st.role === 'admin' || st.role === 'ana' }[perm]);

  /* regra de estouro (projetos FECHADAS com horas contratadas) */
  function overrun(o) {
    const p = PROJ[o.p];
    if (p.tipo !== 'FECHADAS' || !p.horas) return { over: false };
    const total = sumH(o.p, (x) => (x.s === 'APROVADA' || x.s === 'PENDENTE' || x.s === 'FATURADA') && x !== o) + o.h;
    if (total <= p.horas) return { over: false };
    if (!p.perm) return { over: true, err: L('Projeto não permite estouro de horas. A OS não pode ser submetida.', 'Project does not allow hour overrun. The OS cannot be submitted.') };
    if (p.lim && total > p.horas * (1 + p.lim / 100)) return { over: true, err: L(`Estouro acima do limite de ${p.lim}% permitido.`, `Overrun above the allowed ${p.lim}% limit.`) };
    return { over: true };
  }
  const msgBox = () => (st.msg ? `<div class="nx-msg ${st.msgT}">${st.msg}</div>` : '');

  const pages = {
    home() {
      const pend = os.filter((o) => o.s === 'PENDENTE').length;
      return `<h1>${L('Início', 'Home')}</h1><p class="sub">${L('Bem-vindo ao portal corporativo.', 'Welcome to the corporate portal.')}</p>
        <div class="nx-kpis"><div class="nx-kpi"><small>${L('Seu perfil', 'Your profile')}</small><b class="sm">${ROLES[st.role]}</b></div><div class="nx-kpi"><small>${L('Horas aprovadas', 'Approved hours')}</small><b data-count="${apprH()}" data-fmt="h">${apprH()}h</b></div><div class="nx-kpi"><small>${L('Pendentes na fila', 'Pending in queue')}</small><b data-count="${pend}" data-fmt="int">${pend}</b></div><div class="nx-kpi"><small>${L('Projetos', 'Projects')}</small><b data-count="${PROJ.length}" data-fmt="int">3</b></div></div>
        <div class="nx-panel"><b>${DESC[st.role]}</b><p class="sub">${L('Troque o perfil no menu lateral para ver as permissões mudarem.', 'Switch the profile in the sidebar to see permissions change.')}</p></div>`;
    },
    dashe() {
      const h = apprH(), rec = 118000 + h * 150, custo = 69000 + h * 85, marg = ((rec - custo) / rec) * 100;
      return `<h1>${L('Dashboard executivo', 'Executive dashboard')}</h1>
        <div class="nx-kpis"><div class="nx-kpi"><small>${L('Receita reconhecida', 'Recognized revenue')}</small><b class="sm" data-count="${rec}" data-fmt="brl">${brl(rec)}</b></div><div class="nx-kpi"><small>${L('Custo total', 'Total cost')}</small><b class="sm" data-count="${custo}" data-fmt="brl">${brl(custo)}</b></div><div class="nx-kpi"><small>${L('Margem bruta', 'Gross margin')}</small><b data-count="${marg}" data-fmt="pct">0%</b></div><div class="nx-kpi"><small>${L('Inadimplência', 'Default rate')}</small><b data-count="6" data-fmt="pct">0%</b><em class="cmp">${L('prazo médio 11 dias', 'avg 11 days')}</em></div></div>
        <div class="nx-grid2"><div class="nx-panel"><h3>${L('Fluxo de caixa (amostra semanal)', 'Cash flow (weekly sample)')}</h3>${U.line([42, 51, 47, 63, 58, 72 + Math.round(h / 8)], { color: '#f37245', labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'], label: 'cash flow' })}</div>
        <div class="nx-panel"><h3>${L('Top clientes por receita', 'Top clients by revenue')}</h3>${U.bars([{ l: 'Acme', v: 62 + Math.round(h / 3), c: '#2b2f33' }, { l: 'Beta', v: 48, c: '#798086' }, { l: 'Gama', v: 31, c: '#f37245' }, { l: 'Delta', v: 22, c: '#ffa37f' }], { label: 'top clients' })}</div></div>
        <div class="nx-panel"><h3>${L('Projetos em risco', 'Projects at risk')}</h3><table class="nx-tb"><tr><th>${L('Código', 'Code')}</th><th>${L('Cliente', 'Client')}</th><th>${L('% consumo', '% used')}</th><th>${L('Saldo', 'Balance')}</th></tr>${PROJ.filter((p) => p.tipo === 'FECHADAS').map((p, i) => { const a = sumH(PROJ.indexOf(p), (o) => o.s === 'APROVADA' || o.s === 'FATURADA'), pc = Math.round(a / p.horas * 100); return `<tr><td>${p.cod}</td><td>${p.cli}</td><td>${pc}%</td><td>${p.horas - a}h</td></tr>`; }).join('')}</table></div>`;
    },
    dashp() {
      const pend = os.filter((o) => o.s === 'PENDENTE'), est = pend.filter((o) => o.estouro).length;
      return `<h1>${L('Dashboard de projetos', 'Projects dashboard')}</h1>
        <div class="nx-kpis"><div class="nx-kpi"><small>${L('Projetos no portfólio', 'Portfolio projects')}</small><b data-count="3" data-fmt="int">3</b></div><div class="nx-kpi"><small>${L('Estouros pendentes de aprovação', 'Overruns pending approval')}</small><b data-count="${est}" data-fmt="int">${est}</b></div><div class="nx-kpi"><small>${L('OS pendentes na fila', 'OS in queue')}</small><b data-count="${pend.length}" data-fmt="int">${pend.length}</b></div><div class="nx-kpi"><small>${L('Horas aprovadas no período', 'Approved hours in period')}</small><b data-count="${apprH()}" data-fmt="h">${apprH()}h</b></div></div>
        <div class="nx-panel"><h3>${L('Consumo % por projeto', 'Consumption % by project')}</h3>${PROJ.map((p, i) => { if (p.tipo !== 'FECHADAS') return `<div class="nx-cons"><span>${p.cod} ${p.nome}</span><div class="bar"><i class="gray" style="width:100%"></i></div><em>n/a</em></div>`; const a = sumH(i, (o) => o.s === 'APROVADA' || o.s === 'FATURADA'), pc = Math.round(a / p.horas * 100), c = pc >= 100 ? 'red' : pc >= 80 ? 'yel' : 'grn'; return `<div class="nx-cons"><span>${p.cod} ${p.nome}</span><div class="bar"><i class="${c}" style="width:${Math.min(100, pc)}%"></i></div><em>${pc}%</em></div>`; }).join('')}<p class="sub">${L('Semáforo: verde < 80%, amarelo ≥ 80%, vermelho ≥ 100%.', 'Traffic light: green < 80%, yellow ≥ 80%, red ≥ 100%.')}</p></div>`;
    },
    dasha() {
      const mine = os.filter((o) => o.s !== 'REJEITADA'), tot = mine.reduce((a, o) => a + o.h, 0);
      return `<h1>${L('Dashboard do analista', 'Analyst dashboard')}</h1>
        <div class="nx-kpis"><div class="nx-kpi"><small>${L('Horas do mês × carga', 'Month hours × load')}</small><b data-count="${tot}" data-fmt="h">${tot}h</b><em class="cmp">${L('carga esperada 160h', 'expected 160h')}</em></div><div class="nx-kpi"><small>${L('OS rejeitadas', 'Rejected OS')}</small><b data-count="${os.filter((o) => o.s === 'REJEITADA').length}" data-fmt="int">1</b></div><div class="nx-kpi"><small>${L('Rascunhos não submetidos', 'Unsubmitted drafts')}</small><b data-count="${os.filter((o) => o.s === 'RASCUNHO').length}" data-fmt="int">0</b></div></div>
        <div class="nx-grid2"><div class="nx-panel"><h3>${L('Horas por projeto', 'Hours by project')}</h3><div class="nx-donut">${U.donut(PROJ.map((p, i) => ({ l: p.cod, v: sumH(i, (o) => o.s !== 'REJEITADA') || 0.01, c: ['#2b2f33', '#f37245', '#798086'][i] })), { center: tot + 'h' })}<ul class="nx-leg">${PROJ.map((p, i) => `<li><i style="background:${['#2b2f33', '#f37245', '#798086'][i]}"></i>${p.cod}</li>`).join('')}</ul></div></div>
        <div class="nx-panel"><h3>${L('Últimos 6 meses', 'Last 6 months')}</h3>${U.line([132, 148, 140, 158, 151, Math.max(60, tot * 3)], { color: '#6c63ff', labels: ['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov'].map((x, i) => (pt ? x : ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'][i])), label: 'hours' })}</div></div>`;
    },
    workgrid() {
      return `<div class="nx-head"><div><h1>WorkGrid</h1><p class="sub">${L('Arraste os cartões entre colunas (ou toque no cartão e depois na coluna). As regras de status valem aqui também.', 'Drag cards between columns (or tap a card then a column). Status rules apply here too.')}</p></div></div>${msgBox()}
        <div class="nx-kanban">${COLS.map((c) => `<div class="nx-col2 ${st.pick2 && st.pick2 !== c ? 'drop' : ''}" data-col="${c}"><div class="ch" data-colhead="${c}">${SLAB[c]}<em>${os.filter((o) => o.s === c).length}</em></div>${os.filter((o) => o.s === c).map((o) => `<div class="kc ${st.pick2 === o.n ? 'sel' : ''}" draggable="true" data-card="${o.n}"><b>${o.n}</b><span>${PROJ[o.p].cod} · ${o.h}h</span><small>${esc(o.d)}</small>${o.estouro ? `<i class="nx-pill REJEITADA">${L('Estouro', 'Overrun')}</i>` : ''}</div>`).join('')}</div>`).join('')}</div>`;
    },
    ts() {
      const drafts = os.filter((o) => o.s === 'RASCUNHO');
      const wk = st.view === 'week';
      return `<div class="nx-head"><div><h1>Timesheet</h1><p class="sub">${L('Grade projeto × dia — apontamentos, totais e submissão em lote.', 'Project × day grid — entries, totals and batch submission.')}</p></div>
        <div><button class="nx-btn ghost" data-copyprev>${L('Copiar semana anterior', 'Copy previous week')}</button> <button class="nx-btn" data-submit ${drafts.length ? '' : 'disabled'}>➤ ${L('Submeter', 'Submit')} ${drafts.length} ${L('rascunho(s)', 'draft(s)')}</button></div></div>${msgBox()}
        <div class="nx-tool"><span class="seg"><b class="${wk ? 'on' : ''}" data-view="week">${L('Semana', 'Week')}</b><b class="${wk ? '' : 'on'}" data-view="month">${L('Mês', 'Month')}</b></span><span>${wk ? '10/11 – 14/11/2025' : '11/2025'}</span><em>${wk ? L('Esta semana', 'This week') : L('Este mês', 'This month')}</em></div>
        ${wk ? `<div class="nx-panel"><table class="nx-grid"><tr><th>${L('Projeto', 'Project')}</th>${DN.map((d, i) => `<th>${d}<small>${DAYS[i].slice(8)}</small></th>`).join('')}<th>Total</th></tr>
        ${PROJ.map((p, pi) => { const row = DAYS.map((d) => os.filter((o) => o.p === pi && o.data === d)); return `<tr><td class="pn"><b>${p.cod}</b> ${p.nome}<small>${p.tipo === 'FECHADAS' ? p.horas + 'h ' + L('contratadas', 'contracted') : L('horas abertas', 'open hours')}</small></td>${row.map((c, di) => `<td class="cell ${c.some((o) => o.s === 'RASCUNHO') ? 'dr' : ''}" data-cell="${pi}:${di}">${c.reduce((a, o) => a + o.h, 0) || '<i>+</i>'}${c.length ? 'h' : ''}</td>`).join('')}<td class="tt">${row.flat().reduce((a, o) => a + o.h, 0)}h</td></tr>`; }).join('')}</table></div>`
        : `<div class="nx-panel"><h3>${L('Valor a receber', 'Amount to receive')}</h3><p class="sub">${L('Competência 11/2025 · tipo de contrato: horas', 'Period 11/2025 · contract type: hours')}</p><div class="nx-kpis"><div class="nx-kpi"><small>${L('Horas no mês', 'Hours in month')}</small><b data-count="${os.reduce((a, o) => a + o.h, 0)}" data-fmt="h">0h</b></div><div class="nx-kpi"><small>${L('Valor estimado', 'Estimated value')}</small><b class="sm" data-count="${os.filter((o) => o.s !== 'REJEITADA').reduce((a, o) => a + o.h, 0) * 85}" data-fmt="brl">0</b></div></div></div>`}
        <p class="sub">${L('Clique em uma célula para apontar horas. Em projetos de horas fechadas, a submissão valida o estouro.', 'Click a cell to log hours. In fixed-hour projects, submission validates the overrun.')}</p>`;
    },
    meus() {
      return `<h1>${L('Meus apontamentos', 'My entries')}</h1>${msgBox()}<div class="nx-panel"><table class="nx-tb"><tr><th>${L('Número', 'Number')}</th><th>${L('Data','Date')}</th><th>${L('Projeto', 'Project')}</th><th>${L('Horas', 'Hours')}</th><th>Status</th><th>${L('Rejeição', 'Rejection')}</th><th></th></tr>
        ${os.map((o) => `<tr class="rowin"><td>${o.n}</td><td>${fmt(o.data)}</td><td>${PROJ[o.p].cod} — ${PROJ[o.p].nome}</td><td>${o.h}h</td><td>${pill(o.s)}</td><td>${o.motivo || ''}</td><td>${o.s === 'REJEITADA' ? `<button class="nx-link" data-reopen="${o.n}">${L('Editar e reenviar', 'Edit & resubmit')}</button>` : ''}</td></tr>`).join('')}</table></div>`;
    },
    pend() {
      const q = os.filter((o) => o.s === 'PENDENTE');
      return `<div class="nx-head"><div><h1>${L('Pendentes de aprovação', 'Pending approval')}</h1><p class="sub">${L('Fila do GP — destaque para estouros, aprovação e rejeição em lote.', 'PM queue — overruns highlighted, batch approve and reject.')}</p></div><div><button class="nx-btn" data-apr-batch>${L('Aprovar lote', 'Approve batch')}</button> <button class="nx-btn ghost" data-rej-batch>${L('Rejeitar lote', 'Reject batch')}</button></div></div>${msgBox()}
        <div class="nx-panel"><table class="nx-tb"><tr><th></th><th>${L('Número', 'Number')}</th><th>${L('Projeto', 'Project')}</th><th>${L('Analista', 'Analyst')}</th><th>${L('Horas', 'Hours')}</th><th>${L('Estouro', 'Overrun')}</th><th>${L('Descrição', 'Description')}</th><th></th></tr>
        ${q.map((o) => `<tr class="rowin"><td><input type="checkbox" data-chk="${o.n}" ${st.sel.has(o.n) ? 'checked' : ''}></td><td>${o.n}</td><td>${PROJ[o.p].cod}</td><td>Ana Lima</td><td>${o.h}h</td><td>${o.estouro ? '<span class="nx-pill REJEITADA">' + L('Estouro', 'Overrun') + '</span>' : '—'}</td><td>${esc(o.d)}${o.just ? `<small class="jt">${L('Justificativa', 'Justification')}: ${esc(o.just)}</small>` : ''}</td><td class="act"><button data-apr="${o.n}" title="${L('Aprovar', 'Approve')}">✓</button><button class="d" data-rej="${o.n}" title="${L('Rejeitar', 'Reject')}">✕</button></td></tr>`).join('') || `<tr><td colspan="8" class="empty"><b>${L('Nenhuma OS pendente', 'No pending OS')}</b><small>${L('Não há ordens aguardando aprovação com os filtros atuais.', 'No orders awaiting approval with the current filters.')}</small></td></tr>`}</table></div>`;
    },
    todas() {
      return `<h1>${L('Todas as ordens de serviço', 'All service orders')}</h1><p class="sub">${L('Consulta de apontamentos — Admin/GP (aprovação permanece em Pendentes).', 'Entries lookup — Admin/PM (approval stays in Pending).')}</p>
        <div class="nx-panel"><table class="nx-tb"><tr><th>${L('Número', 'Number')}</th><th>${L('Data','Date')}</th><th>${L('Projeto', 'Project')}</th><th>${L('Analista', 'Analyst')}</th><th>${L('Atividade', 'Activity')}</th><th>${L('Horas', 'Hours')}</th><th>Status</th><th>${L('Descrição', 'Description')}</th></tr>${os.map((o) => `<tr class="rowin"><td>${o.n}</td><td>${fmt(o.data)}</td><td>${PROJ[o.p].cod}</td><td>Ana Lima</td><td>${ATV[o.a]}</td><td>${o.h}h</td><td>${pill(o.s)}</td><td>${esc(o.d)}</td></tr>`).join('')}</table></div>`;
    },
    fech() {
      const block = os.filter((o) => o.s === 'PENDENTE' || o.s === 'RASCUNHO'), appr = os.filter((o) => o.s === 'APROVADA');
      const stp = (n, t) => `<span class="${st.step === n ? 'on' : st.step > n ? 'ok' : ''}">${n} ${t}</span>`; let body = '';
      if (st.step === 1) body = `<h3>${block.length ? L('Resolva os apontamentos abaixo', 'Resolve the entries below') : L('Nada bloqueando este mês', 'Nothing blocking this month')}</h3>${block.length ? `<table class="nx-tb"><tr><th>OS</th><th>${L('Data','Date')}</th><th>Status</th><th>${L('Horas', 'Hours')}</th></tr>${block.map((o) => `<tr><td>${o.n}</td><td>${fmt(o.data)}</td><td>${pill(o.s)}</td><td>${o.h}h</td></tr>`).join('')}</table>` : ''}<div class="nx-foot">${block.length ? `<button class="nx-btn ghost" data-pg="pend">${L('Ir para Pendentes', 'Go to Pending')}</button>` : ''}<button class="nx-btn" data-step="2" ${block.length ? 'disabled' : ''}>${L('Simular', 'Simulate')}</button></div>`;
      if (st.step === 2) body = `<h3>${L('Será gerado a pagar', 'Will generate payable')}</h3><table class="nx-tb"><tr><th>${L('Analista', 'Analyst')}</th><th>${L('Tipo', 'Type')}</th><th>${L('Horas', 'Hours')}</th><th>${L('Valor', 'Amount')}</th></tr><tr><td>Ana Lima</td><td>${L('Hora técnica', 'Hourly')}</td><td>${appr.reduce((a, o) => a + o.h, 0)}h</td><td>${brl(appr.reduce((a, o) => a + o.h, 0) * 85)}</td></tr></table>
        <h3>${L('Será gerado a receber', 'Will generate receivable')}</h3><table class="nx-tb"><tr><th>${L('Projeto', 'Project')}</th><th>${L('Origem', 'Source')}</th><th>${L('Valor', 'Amount')}</th></tr>${PROJ.map((p, i) => ({ p, h: appr.filter((o) => o.p === i).reduce((a, o) => a + o.h, 0) })).filter((x) => x.h).map((x) => `<tr><td>${x.p.cod}</td><td>${x.h}h × R$ 150</td><td>${brl(x.h * 150)}</td></tr>`).join('') || `<tr><td colspan="3">${L('Nada será gerado nesta competência', 'Nothing will be generated in this period')}</td></tr>`}</table><div class="nx-foot"><button class="nx-btn ghost" data-step="1">${L('Voltar', 'Back')}</button><button class="nx-btn" data-step="3">${L('Avançar', 'Next')}</button></div>`;
      if (st.step === 3) body = `<h3>${L('Confirmar fechamento de 11/2025', 'Confirm closing of 11/2025')}</h3><p>${L('Ao confirmar, o sistema vai:', 'On confirm the system will:')}</p><ul><li>${L('Marcar as OS aprovadas como FATURADA', 'Mark approved OS as INVOICED')}</li><li>${L('Gerar contas a pagar e a receber', 'Generate payable and receivable')}</li><li>${L('Bloquear novas submissões na competência', 'Block new submissions in the period')}</li></ul><div class="nx-foot"><button class="nx-btn ghost" data-step="2">${L('Voltar', 'Back')}</button><button class="nx-btn" data-close>${L('Fechar', 'Close')}</button></div>`;
      return `<h1>${L('Fechamento', 'Closing')}</h1><p class="sub">${L('Feche o mês: resolva apontamentos, revise o que será gerado e confirme.', 'Close the month: resolve entries, review what will be generated and confirm.')}</p>${msgBox()}<div class="nx-panel"><div class="nx-steps">${stp(1, L('Conferir', 'Check'))}${stp(2, L('Prévia', 'Preview'))}${stp(3, L('Confirmar', 'Confirm'))}</div>${body}</div>${st.closed.length ? `<div class="nx-panel"><h3>${L('Histórico recente', 'Recent history')}</h3>${st.closed.map((c) => `<p>${c}</p>`).join('')}</div>` : ''}`;
    },
    cpagar() {
      return `<h1>${L('Contas a pagar', 'Accounts payable')}</h1>${msgBox()}<div class="nx-panel"><table class="nx-tb"><tr><th>${L('Vencimento', 'Due')}</th><th>${L('Descrição', 'Description')}</th><th>${L('Categoria', 'Category')}</th><th>${L('Previsto', 'Expected')}</th><th>${L('Pago', 'Paid')}</th><th>Status</th><th></th></tr>${cpagar.map((c) => `<tr class="rowin"><td>${fmt(c.venc)}</td><td>${esc(c.desc)}</td><td>${esc(c.cat)}</td><td>${brl(c.prev)}</td><td>${brl(c.pago)}</td><td><span class="nx-pill ${c.s === 'PAGA' ? 'APROVADA' : c.s === 'VENCIDA' ? 'REJEITADA' : 'PENDENTE'}">${financialStatus(c.s)}</span></td><td>${c.s !== 'PAGA' ? `<button class="nx-link" data-baixa="p:${c.id}">${L('Baixar', 'Settle')}</button>` : ''}</td></tr>`).join('')}</table></div>`;
    },
    creceber() {
      return `<h1>${L('Contas a receber', 'Accounts receivable')}</h1>${msgBox()}<div class="nx-panel"><table class="nx-tb"><tr><th>${L('Vencimento', 'Due')}</th><th>${L('Cliente', 'Client')}</th><th>${L('Origem', 'Source')}</th><th>${L('Previsto', 'Expected')}</th><th>${L('Recebido', 'Received')}</th><th>Status</th><th></th></tr>${creceber.map((c) => `<tr class="rowin"><td>${fmt(c.venc)}</td><td>${c.cli}</td><td>${esc(c.orig)}</td><td>${brl(c.prev)}</td><td>${brl(c.rec)}</td><td><span class="nx-pill ${c.s === 'RECEBIDA' ? 'APROVADA' : c.s === 'VENCIDA' ? 'REJEITADA' : 'PENDENTE'}">${financialStatus(c.s)}</span></td><td>${c.s !== 'RECEBIDA' ? `<button class="nx-link" data-baixa="r:${c.id}">${L('Receber', 'Receive')}</button>` : ''}</td></tr>`).join('')}</table></div>`;
    }
  };

  function dialog() {
    const d = st.dlg; if (!d) return '';
    if (d.t === 'cell') return `<div class="nx-dlg"><div class="bx"><h3>${L('Apontar horas', 'Log hours')} · ${PROJ[d.p].cod} · ${fmt(DAYS[d.d])}</h3><label>${L('Horas', 'Hours')}</label><input class="nx-in" id="dlgH" type="number" min="1" max="24" value="8"><label>${L('Tipo de atividade', 'Activity type')}</label><select class="nx-in" id="dlgA">${Object.entries(ATV).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><label>${L('Descrição', 'Description')}</label><textarea class="nx-in" id="dlgD" rows="2">${L('Desenvolvimento', 'Development')}</textarea><div class="nx-foot"><button class="nx-btn ghost" data-dc>${L('Cancelar', 'Cancel')}</button><button class="nx-btn" data-ok>${L('Salvar rascunho', 'Save draft')}</button></div></div></div>`;
    if (d.t === 'just') return `<div class="nx-dlg"><div class="bx"><h3>⚠ ${L('Justificativa de estouro', 'Overrun justification')}</h3><p>${L('Um ou mais rascunhos estouram o teto de horas do projeto. Informe o motivo para submeter.', 'One or more drafts exceed the project hour ceiling. Provide the reason to submit.')}</p><textarea class="nx-in" id="dlgJ" rows="3"></textarea><div class="nx-foot"><button class="nx-btn ghost" data-dc>${L('Cancelar', 'Cancel')}</button><button class="nx-btn" data-okj>${L('Submeter', 'Submit')}</button></div></div></div>`;
    if (d.t === 'baixa') return `<div class="nx-dlg"><div class="bx"><h3>${d.k === 'p' ? L('Baixar conta a pagar', 'Settle payable') : L('Receber conta', 'Receive payment')}</h3><label>${L('Data', 'Date')}</label><input class="nx-in" type="date" value="2025-11-10"><label>${L('Valor', 'Amount')}</label><input class="nx-in" value="${(d.k === 'p' ? cpagar : creceber).find((c) => c.id === d.id).prev}"><label>${L('Forma de pagamento', 'Payment method')}</label><select class="nx-in"><option>PIX</option><option>${L('Transferência', 'Transfer')}</option><option>${L('Boleto','Bank slip')}</option></select><div class="nx-foot"><button class="nx-btn ghost" data-dc>${L('Cancelar', 'Cancel')}</button><button class="nx-btn" data-okbaixa>${L('Confirmar', 'Confirm')}</button></div></div></div>`;
    return `<div class="nx-dlg"><div class="bx"><h3>${L('Rejeitar OS', 'Reject OS')}</h3><p>${L('Motivo da rejeição (obrigatório)', 'Rejection reason (required)')}</p><textarea class="nx-in" id="dlgR" rows="3"></textarea><div class="nx-foot"><button class="nx-btn ghost" data-dc>${L('Cancelar', 'Cancel')}</button><button class="nx-btn" data-okr>${L('Rejeitar', 'Reject')}</button></div></div></div>`;
  }

  function bellPanel() {
    const pend = os.filter((o) => o.s === 'PENDENTE').length, rej = os.filter((o) => o.s === 'REJEITADA').length;
    const notices = [
      pend && can('approve') ? `<div class="nx-notify-row"><span aria-hidden="true">⏳</span><div><b>${pend} ${L('OS aguardando aprovação', 'OS awaiting approval')}</b><small>${L('Revise a fila de pendentes quando puder.', 'Review the pending queue when you can.')}</small></div></div>` : '',
      rej && can('submit') ? `<div class="nx-notify-row"><span aria-hidden="true">✕</span><div><b>${rej} ${L('OS rejeitada(s)', 'rejected OS')}</b><small>${L('Confira o motivo e ajuste o apontamento.', 'Check the reason and update the entry.')}</small></div></div>` : ''
    ].filter(Boolean).join('');
    return `<div class="nx-notify"><div class="nx-notify-card" role="dialog" aria-modal="true" aria-labelledby="nx-notify-title"><div class="nx-notify-head"><span class="nx-notify-mark" aria-hidden="true">🔔</span><div><small>${L('CENTRAL DE ATIVIDADE', 'ACTIVITY CENTER')}</small><h3 id="nx-notify-title">${L('Notificações', 'Notifications')}</h3></div><button class="nx-notify-close" data-close-bell aria-label="${L('Fechar notificações', 'Close notifications')}">✕</button></div>${notices || `<p class="nx-notify-empty">✓ ${L('Você está em dia — sem notificações.', "You're all caught up — no notifications.")}</p>`}<button class="nx-btn nx-notify-done" data-close-bell>${L('Entendi', 'Got it')}</button></div></div>`;
  }

  function draw() {
    const items = MENU[st.role];
    if (!items.includes(st.page)) st.page = 'home';
    const bellN = (os.filter((o) => o.s === 'PENDENTE').length && can('approve') ? 1 : 0) + (os.filter((o) => o.s === 'REJEITADA').length && can('submit') ? 1 : 0);
    host.innerHTML = `<div class="nx-app"><aside class="nx-rail"><div class="lg">${mark}<b>nous</b></div>
      <div class="nx-ctx"><small>${L('Perfil', 'Profile')}</small><select data-role>${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${k === st.role ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <nav>${items.map((k) => `<button class="${st.page === k ? 'on' : ''}" data-pg="${k}"><i>${NAV[k][0]}</i>${NAV[k][1]}</button>`).join('')}</nav></aside>
      <div class="nx-col"><header class="nx-top"><b>${NAV[st.page][1]}</b><span><button class="nx-bell" data-bell aria-label="${L('Abrir notificações', 'Open notifications')}" aria-expanded="${st.bell}">🔔${bellN ? `<em>${bellN}</em>` : ''}</button></span></header><section class="nx-page">${pages[st.page]()}</section></div>${st.bell ? bellPanel() : ''}${dialog()}<div class="dm-toasts"></div></div>`;
    if (st.toast) { U.toast(host.querySelector('.nx-app'), st.toast[0], st.toast[1]); st.toast = null; }
    U.startPage(host,st.role+':'+st.page);
    U.countAll(host);
    if (st.bell) host.querySelector('.nx-notify-close')?.focus();
  }

  function submitOs(list, justText) {
    const errs = []; let needs = false;
    list.forEach((o) => { const r = overrun(o); if (r.err) errs.push(o.n + ': ' + r.err); else if (r.over) { if (justText) { o.estouro = true; o.just = justText; o.s = 'PENDENTE'; } else needs = true; } else { o.s = 'PENDENTE'; o.estouro = false; } });
    if (needs && !justText) { st.dlg = { t: 'just', ids: list.map((o) => o.n) }; draw(); return false; }
    st.msg = errs.length ? errs.join(' · ') : L('Rascunhos submetidos para aprovação.', 'Drafts submitted for approval.'); st.msgT = errs.length ? 'err' : 'ok'; if (!errs.length) say(L('Submetido para aprovação', 'Submitted for approval'));
    st.dlg = null; draw(); return !errs.length;
  }
  const setS = (n, s, extra) => { const o = os.find((x) => x.n === n); if (o) Object.assign(o, { s }, extra || {}); };
  function tryMove(n, to) {
    const o = os.find((x) => x.n === n); if (!o || o.s === to) return;
    const from = o.s; st.msg = ''; st.pick2 = null;
    const bad = (m) => { st.msg = m; st.msgT = 'err'; draw(); const el = host.querySelector('[data-card="' + n + '"]'); if (el) el.classList.add('shake'); };
    if (from === 'RASCUNHO' && to === 'PENDENTE') { if (!can('submit')) return bad(L('Apenas analistas submetem apontamentos.', 'Only analysts submit entries.')); st.dlg = null; submitOs([o]); return; }
    if (from === 'PENDENTE' && to === 'APROVADA') { if (!can('approve')) return bad(L('Somente o GP ou o Administrador aprova.', 'Only the PM or Administrator approves.')); setS(n, 'APROVADA'); say(L('OS aprovada', 'OS approved')); return draw(); }
    if (from === 'PENDENTE' && to === 'REJEITADA') { if (!can('approve')) return bad(L('Somente o GP ou o Administrador rejeita.', 'Only the PM or Administrator rejects.')); st.dlg = { t: 'rej', ids: [n] }; return draw(); }
    if (from === 'REJEITADA' && to === 'RASCUNHO') { setS(n, 'RASCUNHO', { motivo: '' }); say(L('OS voltou para rascunho', 'OS back to draft')); return draw(); }
    if (to === 'FATURADA') return bad(L('OS só viram FATURADA pelo Fechamento mensal.', 'OS only become INVOICED through the monthly Closing.'));
    bad(L(`Transição ${SLAB[from]} → ${SLAB[to]} não é permitida.`, `Transition ${SLAB[from]} → ${SLAB[to]} is not allowed.`));
  }

  host.onchange = (e) => {
    if (e.target.matches('[data-role]')) { st.role = e.target.value; st.msg = ''; st.sel.clear(); st.pick2 = null; st.bell = false; draw(); }
    if (e.target.dataset.chk) { e.target.checked ? st.sel.add(e.target.dataset.chk) : st.sel.delete(e.target.dataset.chk); }
  };
  host.ondragstart = (e) => { const c = e.target.closest('[data-card]'); if (c) { st.drag = c.dataset.card; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', st.drag); } catch (x) {} c.classList.add('dragging'); } };
  host.ondragend = (e) => { const c = e.target.closest('[data-card]'); if (c) c.classList.remove('dragging'); host.querySelectorAll('.nx-col2.over').forEach((x) => x.classList.remove('over')); };
  host.ondragover = (e) => { const col = e.target.closest('[data-col]'); if (col && st.drag) { e.preventDefault(); host.querySelectorAll('.nx-col2.over').forEach((x) => x.classList.remove('over')); col.classList.add('over'); } };
  host.ondrop = (e) => { const col = e.target.closest('[data-col]'); if (col && st.drag) { e.preventDefault(); const n = st.drag; st.drag = null; tryMove(n, col.dataset.col); } };
  host.onclick = (e) => {
    const t = e.target, q = (s) => t.closest(s);
    let b;
    if (q('[data-bell]')) { st.bell = !st.bell; return draw(); }
    if (q('[data-close-bell]') || t.classList.contains('nx-notify')) { st.bell = false; draw(); host.querySelector('[data-bell]')?.focus(); return; }
    if ((b = q('[data-pg]'))) { U.resetScroll(host); st.page = b.dataset.pg; st.msg = ''; st.bell = false; return draw(); }
    if ((b = q('[data-card]'))) { st.pick2 = st.pick2 === b.dataset.card ? null : b.dataset.card; return draw(); }
    if ((b = q('[data-colhead]')) && st.pick2) { const n = st.pick2; return tryMove(n, b.dataset.colhead); }
    if ((b = q('[data-view]'))) { st.view = b.dataset.view; return draw(); }
    if ((b = q('[data-cell]'))) { if (!can('submit')) { st.msg = L('Somente analistas apontam horas.', 'Only analysts log hours.'); st.msgT = 'err'; return draw(); } const [p, d] = b.dataset.cell.split(':').map(Number); st.dlg = { t: 'cell', p, d }; return draw(); }
    if (q('[data-dc]')) { st.dlg = null; return draw(); }
    if (q('[data-ok]')) { const d = st.dlg, h = Math.max(1, +host.querySelector('#dlgH').value || 1); os.push({ n: 'OS-0' + st.nextN++, data: DAYS[d.d], p: d.p, h, a: host.querySelector('#dlgA').value, d: host.querySelector('#dlgD').value || '—', s: 'RASCUNHO' }); st.dlg = null; st.msg = ''; say(L('Rascunho salvo', 'Draft saved')); return draw(); }
    if (q('[data-copyprev]')) { if (!can('submit')) { st.msg = L('Somente analistas apontam horas.', 'Only analysts log hours.'); st.msgT = 'err'; return draw(); } let c = 0; os.filter((o) => o.data < '2025-11-10' && o.s !== 'REJEITADA').slice(0, 4).forEach((o) => { const di = (+o.data.slice(8) - 3) % 5; os.push({ n: 'OS-0' + st.nextN++, data: DAYS[di], p: o.p, h: o.h, a: o.a, d: o.d, s: 'RASCUNHO' }); c++; }); st.msg = ''; say(L(c + ' apontamentos copiados como rascunho', c + ' entries copied as drafts')); return draw(); }
    if (q('[data-submit]')) { st.msg = ''; return void submitOs(os.filter((o) => o.s === 'RASCUNHO')); }
    if (q('[data-okj]')) { const j = host.querySelector('#dlgJ').value.trim(); if (!j) { st.msg = L('Justificativa de estouro é obrigatória.', 'Overrun justification is required.'); st.msgT = 'err'; st.dlg = null; return draw(); } return void submitOs(os.filter((o) => (st.dlg.ids || []).includes(o.n)), j); }
    if ((b = q('[data-reopen]'))) { setS(b.dataset.reopen, 'RASCUNHO', { motivo: '' }); st.msg = L('OS voltou para rascunho: ajuste e submeta de novo no Timesheet.', 'OS is back to draft: adjust and resubmit in Timesheet.'); st.msgT = 'ok'; return draw(); }
    if ((b = q('[data-apr]'))) { setS(b.dataset.apr, 'APROVADA'); say(L('OS aprovada', 'OS approved')); st.msg = ''; return draw(); }
    if ((b = q('[data-rej]'))) { st.dlg = { t: 'rej', ids: [b.dataset.rej] }; return draw(); }
    if (q('[data-apr-batch]')) { const c = st.sel.size; st.sel.forEach((n) => setS(n, 'APROVADA')); if (c) say(L('Lote aprovado', 'Batch approved')); st.msg = c ? '' : L('Selecione ao menos uma OS.', 'Select at least one OS.'); st.msgT = c ? 'ok' : 'err'; st.sel.clear(); return draw(); }
    if (q('[data-rej-batch]')) { if (!st.sel.size) { st.msg = L('Selecione ao menos uma OS.', 'Select at least one OS.'); st.msgT = 'err'; return draw(); } st.dlg = { t: 'rej', ids: [...st.sel] }; return draw(); }
    if (q('[data-okr]')) { const m = host.querySelector('#dlgR').value.trim(); if (!m) { st.msg = L('Motivo da rejeição é obrigatório.', 'Rejection reason is required.'); st.msgT = 'err'; st.dlg = null; return draw(); } st.dlg.ids.forEach((n) => setS(n, 'REJEITADA', { motivo: m })); st.dlg = null; st.sel.clear(); st.msg = ''; say(L('OS rejeitada', 'OS rejected'), 'warn'); return draw(); }
    if ((b = q('[data-step]'))) { st.step = +b.dataset.step; return draw(); }
    if (q('[data-close]')) {
      const appr = os.filter((o) => o.s === 'APROVADA'), h = appr.reduce((a, o) => a + o.h, 0);
      if (h) cpagar.push({ id: cpagar.length + 1, venc: '2025-12-05', desc: L('Horas técnicas 11/2025 · Ana Lima', 'Technical hours 11/2025 · Ana Lima'), cat: L('Pessoal', 'Payroll'), prev: h * 85, pago: 0, s: 'PREVISTA' });
      PROJ.forEach((p, i) => { const ph = appr.filter((o) => o.p === i).reduce((a, o) => a + o.h, 0); if (ph) creceber.push({ id: creceber.length + 1, venc: '2025-12-10', cli: p.cli, orig: p.cod + ' · 11/2025', prev: ph * 150, rec: 0, s: 'PREVISTA' }); });
      appr.forEach((o) => { o.s = 'FATURADA'; }); st.closed.push(L('11/2025 fechado — OS faturadas, contas a pagar e a receber geradas.', '11/2025 closed — OS invoiced, payable and receivable generated.')); st.step = 1; st.msg = ''; say(L('Competência 11/2025 fechada', 'Period 11/2025 closed')); return draw();
    }
    if ((b = q('[data-baixa]'))) { const [k, id] = b.dataset.baixa.split(':'); st.dlg = { t: 'baixa', k, id: +id }; return draw(); }
    if (q('[data-okbaixa]')) { const d = st.dlg, arr = d.k === 'p' ? cpagar : creceber, c = arr.find((x) => x.id === d.id); if (d.k === 'p') { c.pago = c.prev; c.s = 'PAGA'; } else { c.rec = c.prev; c.s = 'RECEBIDA'; } st.dlg = null; say(d.k === 'p' ? L('Conta paga', 'Payable settled') : L('Recebimento registrado', 'Receipt registered')); return draw(); }
  };
  host.onkeydown = (e) => {
    if (!st.bell) return;
    if (e.key === 'Escape') { e.stopPropagation(); st.bell = false; draw(); host.querySelector('[data-bell]')?.focus(); }
    if (e.key === 'Tab') {
      const buttons = [...host.querySelectorAll('.nx-notify-card button')], first = buttons[0], last = buttons[buttons.length - 1];
      if ((e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      e.stopPropagation();
    }
  };
  draw();
};
