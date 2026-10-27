/* Mini-demo DFinanceiro (DFinanceiro): login, dashboard animado, contas a pagar/receber (baixa pela "Data de Baixa"),
   orçamento com itens e resumo financeiro, efetivação em venda, PDV, central de atividade e modo escuro. Dados fictícios. */
window.Demos = window.Demos || {};
window.Demos.finfat = function (host, lang) {
  const pt = lang === 'pt';
  const L = (a, b) => (pt ? a : b);
  const U = window.DemoUtil;
  const brl = (n) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const TODAY = '2025-11-10';
  const fmt = (d) => (d ? d.split('-').reverse().join('/') : '');
  const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const NAMES_P = ['Distribuidora Alfa', 'Energia Elétrica SP', 'Papelaria Central', 'Transportes Lima', 'Aluguel Galpão', 'Internet Fibra', 'Contabilidade Souza', 'Peças e Cia', 'Embalagens Norte', 'Seguro Empresarial', 'Combustível Ipiranga', 'Limpeza Brilho'];
  const NAMES_R = ['Padaria Central', 'Restaurante Sabor', 'Lanchonete do Zé', 'Mercado Bom Preço', 'Oficina Rápida', 'Maria Souza', 'Clínica Vida', 'Pet Shop Amigo', 'Escola Aprender', 'Hotel Centro', 'Academia Forma', 'Floricultura Rosa'];
  const mk = (names, seed) => names.map((n, i) => {
    const venc = '2025-11-' + String(((i * 7 + seed) % 27) + 1).padStart(2, '0'), paid = (i + seed) % 4 === 0;
    return { id: i + 1, emissao: '2025-10-' + String(((i * 5 + seed) % 27) + 1).padStart(2, '0'), numero: String(400 + i * 13 + seed).padStart(6, '0'), prefixo: 'NF', parcela: '1/1', pessoa: n, venc, baixa: paid ? venc : '', orig: Math.round((300 + ((i * 937 + seed * 211) % 4200)) * 100) / 100, acr: 0, dec: 0, especie: ['Boleto', 'PIX', 'Cartão', 'Débito'][i % 4], tipo: 'Geral', banco: ['Itaú', 'Bradesco'][i % 2], obs: '' };
  });
  const PROD0 = [{ c: 'P001', d: 'Cabo HDMI 2m', p: 29.9 }, { c: 'P002', d: 'Teclado mecânico', p: 289 }, { c: 'P003', d: 'Mouse sem fio', p: 79.9 }, { c: 'P004', d: 'Monitor 24"', p: 799 }, { c: 'P005', d: 'Nobreak 1200VA', p: 649.5 }, { c: 'P006', d: 'Switch 8 portas', p: 159 }];
  const GRP = ['Informática', 'Periféricos', 'Redes', 'Energia'];
  const CID = ['São Paulo', 'Campinas', 'Santos', 'Osasco', 'Guarulhos', 'Sorocaba'];
  const PROD = PROD0.map((x, i) => ({ id: i + 1, cod: x.c, desc: x.d, grupo: GRP[i % 4], un: 'UN', preco: x.p, est: 12 + ((i * 17) % 60) }));
  const CLI = NAMES_R.map((n, i) => ({ id: i + 1, cod: 'C' + String(i + 1).padStart(3, '0'), nome: n, doc: i % 3 === 0 ? '12.345.678/0001-' + String(10 + i) : '123.456.789-' + String(10 + i), email: n.toLowerCase().replace(/[^a-z]/g, '') + '@mail.com', tel: '(11) 9' + String(8000 + i * 137).padStart(4, '0') + '-' + String(1000 + i * 91), cidade: CID[i % 6] }));
  const db = {
    clientes: CLI, produtos: PROD,
    pagar: mk(NAMES_P, 3), receber: mk(NAMES_R, 1),
    orc: [{ n: '000087', cli: 'Mercado Bom Preço', data: '2025-11-06', total: 4890, st: 'open' }, { n: '000088', cli: 'Padaria Central', data: '2025-11-08', total: 1240.9, st: 'conv' }],
    vendas: [{ n: 'NF-1021', cli: 'Restaurante Sabor', data: '2025-11-07', total: 3200.5, st: 'ok' }, { n: 'NF-1022', cli: 'Clínica Vida', data: '2025-11-09', total: 1890, st: 'ok' }],
    caixas: [{ id: 1, caixa: 'Caixa 01', op: 'Rafael', abertura: '2025-11-10 08:02', troco: 200, st: 'aberto' }, { id: 2, caixa: 'Caixa 02', op: 'Marina', abertura: '2025-11-09 08:10', troco: 150, st: 'fechado' }],
    log: [L('Nova venda registrada · caixa01', 'New sale recorded · caixa01'), L('Backup do tenant concluído', 'Tenant backup completed')]
  };
  const st = { page: 'login', open: 'fin', q: '', status: 'all', venc: 'all', sort: { k: 'venc', d: 1 }, pg: 1, form: null, of: null, modal: null, bell: false, dark: false, toast: null, err: '' };

  const status = (r) => (r.baixa ? 'PAGO' : r.venc < TODAY ? 'VENCIDO' : 'ABERTO');
  const total = (r) => (+r.orig || 0) + (+r.acr || 0) - (+r.dec || 0);
  const sum = (arr, f) => arr.filter(f).reduce((a, r) => a + total(r), 0);
  const logo = () => '<span class="ff-logo"><i><img src="assets/finfat-logo.webp" alt=""></i><b><u>D</u>Financeiro</b></span>';
  const say = (m, k) => { st.toast = [m, k || 'ok']; };
  const overdue = () => db.pagar.filter((r) => status(r) === 'VENCIDO').length;

  const MENU = [
    ['cad', '📁', L('Cadastro', 'Registry'), [['clientes', L('Clientes', 'Clients')], ['produtos', L('Produtos', 'Products')]]],
    ['fin', '📁', L('Financeiro', 'Finance'), [['pagar', L('Pagar', 'Payable')], ['receber', L('Receber', 'Receivable')]]],
    ['ven', '📁', L('Venda', 'Sales'), [['orc', L('Orçamento', 'Quotes')], ['vendas', 'Vendas NF'], ['pdv', 'PDV']]]
  ];
  const PARENT = { orcform: 'orc', pdvform: 'pdv', cform: 'clientes', pform: 'produtos' };
  function sidebar() {
    const cur = st.page === 'form' ? st.form.kind : (st.page === 'cform' || st.page === 'pform') ? st.cf.kind : (PARENT[st.page] || st.page);
    return `<aside class="ff-side">${logo()}<nav><button class="ff-item ${st.page === 'dash' ? 'on' : ''}" data-go="dash">🏠 Dashboard</button>
      ${MENU.map(([k, ic, lb, items]) => `<button class="ff-item grp" data-grp="${k}">${ic} ${lb}<span class="${st.open === k ? 'up' : ''}">⌄</span></button><div class="grp-items ${st.open === k ? 'open' : ''}" data-items="${k}"><div>${items.map((it) => `<button class="ff-item sub ${cur === it[0] ? 'on' : ''}" data-go="${it[0]}">${it[1]}</button>`).join('')}</div></div>`).join('')}
      </nav><div class="ff-user"><span>R</span><div><b>Rafael</b><small>rafael@empresa.com</small></div><button data-go="login" title="Sair">⎋</button></div></aside>`;
  }
  function bellPanel() {
    const an = db.pagar.filter((r) => status(r) === 'VENCIDO').slice(0, 3);
    return `<div class="ff-pop"><b>${L('Atividade e anomalias', 'Activity and anomalies')}</b>${an.map((r) => `<div class="ff-note r"><b>${L('CONTA VENCIDA', 'OVERDUE')}</b>${esc(r.pessoa)} · ${brl(total(r))}</div>`).join('')}${db.log.slice(-4).reverse().map((l) => `<p class="lg">• ${esc(l)}</p>`).join('')}</div>`;
  }
  function topbar() {
    return `<header class="ff-top">${logo()}<div class="ff-links"><span class="on" data-go="dash" role="link">Home</span></div><div class="ff-ico"><button class="bell" data-bell title="${L('Atividade e anomalias', 'Activity and anomalies')}">🔔<em>${overdue() > 9 ? '9+' : overdue()}</em></button><button data-dark title="${L('Tema', 'Theme')}">${st.dark ? '☀' : '☾'}</button></div>${st.bell ? bellPanel() : ''}</header>`;
  }
  const mkStat = (i, label, v, c, fm) => `<div class="ff-card stat ${c || ''}"><i>${i}</i><div><small>${label}</small><b data-count="${v}" data-fmt="${fm}">${fm === 'brl' ? brl(v) : v}</b></div></div>`;

  const CRUD = {
    clientes: { title: L('Clientes', 'Clients'), single: L('Cliente', 'Client'), plural: 'clientes', cols: [['cod', L('Código', 'Code')], ['nome', L('Nome / Razão Social', 'Name')], ['doc', 'CPF/CNPJ'], ['cidade', L('Cidade', 'City')], ['tel', L('Telefone', 'Phone')]], fields: [['nome', L('Nome / Razão Social', 'Name'), 'text', 1], ['doc', 'CPF/CNPJ', 'text', 1], ['email', 'E-mail', 'email'], ['tel', L('Telefone', 'Phone'), 'text'], ['cidade', L('Cidade', 'City'), 'text']], code: 'C', search: ['nome', 'doc', 'cidade'] },
    produtos: { title: L('Produtos', 'Products'), single: L('Produto', 'Product'), plural: 'produtos', cols: [['cod', L('Código', 'Code')], ['desc', L('Descrição', 'Description')], ['grupo', L('Grupo', 'Group')], ['un', L('Un.', 'Unit')], ['preco', L('Preço', 'Price'), 'brl'], ['est', L('Estoque', 'Stock')]], fields: [['desc', L('Descrição', 'Description'), 'text', 1], ['grupo', L('Grupo', 'Group'), 'text'], ['un', L('Unidade', 'Unit'), 'text'], ['preco', L('Preço', 'Price'), 'number', 1], ['est', L('Estoque', 'Stock'), 'number']], code: 'P', search: ['desc', 'grupo', 'cod'] }
  };
  function crudList(kind) {
    const C = CRUD[kind], q = st.q.toLowerCase(), rows = db[kind].filter((r) => !q || C.search.some((k) => String(r[k]).toLowerCase().includes(q)));
    const size = 6, np = Math.max(1, Math.ceil(rows.length / size)); if (st.pg > np) st.pg = np;
    const view = rows.slice((st.pg - 1) * size, st.pg * size);
    return `<div class="ff-card glass head"><div><h1>${C.title}</h1><p>${L('Cadastro de ', 'Registry of ')}${C.title.toLowerCase()}</p></div><button class="ff-btn alt" data-cnew="${kind}">＋ ${L('Novo ', 'New ')}${C.single}</button></div>
      <div class="ff-filters"><input class="ff-in" data-q placeholder="${L('Buscar...', 'Search...')}" value="${esc(st.q)}"><button class="ff-btn">${L('Pesquisar', 'Search')}</button></div>
      <div class="ff-card tbl"><table><tr>${C.cols.map((c) => `<th>${c[1]}</th>`).join('')}<th>${L('Ações', 'Actions')}</th></tr>
      ${view.map((r) => `<tr class="rowin">${C.cols.map((c) => `<td>${c[2] === 'brl' ? brl(+r[c[0]]) : esc(r[c[0]])}</td>`).join('')}<td class="act"><button data-cedit="${kind}:${r.id}:v" title="${L('Visualizar', 'View')}">👁</button><button class="e" data-cedit="${kind}:${r.id}:e" title="${L('Editar', 'Edit')}">✎</button><button class="d" data-cdel="${kind}:${r.id}" title="${L('Excluir', 'Delete')}">🗑</button></td></tr>`).join('') || `<tr><td colspan="${C.cols.length + 1}" class="empty">${L('Nenhum registro encontrado', 'No records found')}</td></tr>`}</table>
      <div class="ff-pager"><span>${L('Mostrando', 'Showing')} <b>${rows.length ? (st.pg - 1) * size + 1 : 0}</b> ${L('a', 'to')} <b>${(st.pg - 1) * size + view.length}</b> ${L('de', 'of')} <b>${rows.length}</b></span><span><button data-pg="${st.pg - 1}" ${st.pg <= 1 ? 'disabled' : ''}>${L('Anterior', 'Previous')}</button>${Array.from({ length: np }, (_, i) => `<button class="${i + 1 === st.pg ? 'on' : ''}" data-pg="${i + 1}">${i + 1}</button>`).join('')}<button data-pg="${st.pg + 1}" ${st.pg >= np ? 'disabled' : ''}>${L('Próxima', 'Next')}</button></span></div></div>`;
  }
  function crudForm() {
    const f = st.cf, C = CRUD[f.kind], ro = f.mode === 'v' ? 'disabled' : '';
    return `<div class="ff-card glass head"><h1>${(f.mode === 'n' ? L('Novo ', 'New ') : f.mode === 'e' ? L('Editar ', 'Edit ') : L('Visualizar ', 'View ')) + C.single}</h1><button class="ff-btn alt" data-go="${f.kind}">← ${L('Voltar', 'Back')}</button></div>
      <div class="ff-card blk"><div class="hb">📄 ${L('Dados do ', 'Data of ')}${C.single}</div><div class="ff-grid3 pad">${C.fields.map(([k, lb, ty, req]) => `<div><label>${lb}${req ? '<i>*</i>' : ''}</label><input class="ff-in" data-cfld="${k}" type="${ty}" value="${f.r[k] === undefined ? '' : esc(f.r[k])}" ${ro}></div>`).join('')}</div></div>
      ${f.mode === 'v' ? '' : `<div class="ff-foot"><button class="ff-btn gray" data-go="${f.kind}">${L('Cancelar', 'Cancel')}</button><button class="ff-btn" data-csave>${f.mode === 'n' ? L('Salvar', 'Save') : L('Atualizar', 'Update')}</button></div>`}`;
  }

  const pages = {
    login() {
      return `<div class="ff-login"><div class="orb o1"></div><div class="orb o2"></div><div class="ff-card auth">${logo()}<h2>${L('Bem-vindo', 'Welcome')}</h2><p>${L('Acesse sua conta para continuar', 'Sign in to continue')}</p>
        <label>E-mail</label><input class="ff-in" value="rafael@empresa.com" placeholder="Seu e-mail"><label>${L('Senha', 'Password')}</label><input class="ff-in" type="password" value="123456" placeholder="Sua senha">
        <button class="ff-btn wide" data-go="dash">${L('Entrar', 'Sign in')}</button><small>${L('Ainda não tem conta?', "Don't have an account?")} <a>${L('Cadastre-se', 'Sign up')}</a></small></div></div>`;
    },
    dash() {
      const rec = sum(db.receber, (r) => !r.baixa), pag = sum(db.pagar, (r) => !r.baixa), vm = 48230.4 + db.vendas.reduce((a, v) => a + (v.fresh ? v.total : 0), 0);
      return `<div class="ff-card head"><div><h1>Dashboard</h1><p>${L('Visão geral do sistema DFinanceiro', 'DFinanceiro system overview')}</p></div><button class="ff-btn" data-go="dash">⟳ ${L('Atualizar', 'Refresh')}</button></div>
        <div class="ff-grid4">${mkStat('👥', L('Total de Clientes', 'Total Clients'), 128, '', 'int')}${mkStat('📦', L('Total de Produtos', 'Total Products'), 342, '', 'int')}${mkStat('🛒', L('Total de Vendas', 'Total Sales'), 1914 + db.vendas.filter((v) => v.fresh).length, '', 'int')}${mkStat('✔', L('Fornecedores', 'Suppliers'), 56, '', 'int')}</div>
        <div class="ff-grid3">${mkStat('🪙', L('Vendas do Mês', 'Monthly Sales'), vm, '', 'brl')}${mkStat('↑', L('Contas a Receber', 'Receivable'), rec, 'g', 'brl')}${mkStat('↓', L('Contas a Pagar', 'Payable'), pag, 'r', 'brl')}</div>
        <div class="ff-card"><h3>${L('Acessos Rápidos', 'Quick Access')}</h3><div class="ff-grid4 q">${[[L('Clientes', 'Clients'), 'clientes'], [L('Produtos', 'Products'), 'produtos'], ['Vendas', 'vendas'], [L('Orçamentos', 'Quotes'), 'orc'], ['PDV', 'pdv'], [L('Contas a Receber', 'Receivable'), 'receber'], [L('Contas a Pagar', 'Payable'), 'pagar']].map(([t, g]) => `<button class="ff-quick" data-go="${g}"><i>📈</i>${t}</button>`).join('')}</div></div>
        <div class="ff-grid2"><div class="ff-card"><h3>🔔 ${L('Avisos', 'Notices')}</h3>${db.pagar.filter((r) => status(r) === 'VENCIDO').slice(0, 2).map((r) => `<div class="ff-note r"><b>${L('CONTA VENCIDA', 'OVERDUE')}</b>${esc(r.pessoa)} · ${brl(total(r))}</div>`).join('') || `<div class="ff-note c">${L('Sistema operando normalmente', 'System running normally')}</div>`}<a data-go="pagar">${L('Ver central completa', 'View full center')}</a></div>
        <div class="ff-card"><h3>🕒 ${L('Atividades Recentes', 'Recent Activity')}</h3>${db.log.slice(-4).reverse().map((l) => `<p class="lg">${esc(l)}</p>`).join('')}</div></div>`;
    },
    list(kind) {
      const isP = kind === 'pagar', q = st.q.toLowerCase();
      let rows = db[kind].filter((r) => (!q || (r.pessoa + r.numero).toLowerCase().includes(q)) && (st.status === 'all' || (st.status === 'paid') === !!r.baixa) && (st.venc === 'all' || (st.venc === 'late' && !r.baixa && r.venc < TODAY) || (st.venc === 'today' && r.venc === TODAY) || (st.venc === 'next' && r.venc > TODAY)));
      const k = st.sort.k; rows = rows.slice().sort((a, b) => (k === 'valor' ? total(a) - total(b) : String(a[k === 'pessoa' ? 'pessoa' : k]).localeCompare(String(b[k === 'pessoa' ? 'pessoa' : k]))) * st.sort.d);
      const size = 6, pages = Math.max(1, Math.ceil(rows.length / size)); if (st.pg > pages) st.pg = pages;
      const view = rows.slice((st.pg - 1) * size, st.pg * size), th = (key, label) => `<th class="sortable" data-sort="${key}">${label}${st.sort.k === key ? (st.sort.d > 0 ? ' ▲' : ' ▼') : ''}</th>`;
      return `<div class="ff-card glass head"><div><h1>${isP ? L('Contas a Pagar', 'Accounts Payable') : L('Contas a Receber', 'Accounts Receivable')}</h1><p>${isP ? L('Gerenciamento de contas a pagar', 'Accounts payable management') : 'Sistema Financeiro - Contas a Receber'}</p></div>
        <div><button class="ff-btn" data-export="${kind}">⬇ ${L('Exportar', 'Export')}</button> <button class="ff-btn alt" data-new="${kind}">＋ ${L('Nova Conta', 'New Account')}</button></div></div>
        <div class="ff-filters"><input class="ff-in" data-q placeholder="${L('Buscar contas...', 'Search accounts...')}" value="${esc(st.q)}">
          <select class="ff-in" data-st><option value="all">${L('Todos', 'All')}</option><option value="open" ${st.status === 'open' ? 'selected' : ''}>${L('Em Aberto', 'Open')}</option><option value="paid" ${st.status === 'paid' ? 'selected' : ''}>${L('Pago', 'Paid')}</option></select>
          <select class="ff-in" data-vc><option value="all">${L('Todos os vencimentos', 'All due dates')}</option><option value="late" ${st.venc === 'late' ? 'selected' : ''}>${L('Vencidos', 'Overdue')}</option><option value="today" ${st.venc === 'today' ? 'selected' : ''}>${L('Vence hoje', 'Due today')}</option><option value="next" ${st.venc === 'next' ? 'selected' : ''}>${L('A vencer', 'Upcoming')}</option></select><button class="ff-btn">${L('Pesquisar', 'Search')}</button></div>
        <div class="ff-card tbl"><table><tr><th>Status</th>${th('emissao', L('Emissão', 'Issue'))}${th('numero', L('Número', 'Number'))}${th('pessoa', isP ? L('Fornecedor', 'Supplier') : L('Cliente', 'Client'))}${th('venc', L('Vencimento', 'Due'))}<th>${L('Data Baixa', 'Paid on')}</th>${th('valor', L('Valor', 'Amount'))}<th>${L('Ações', 'Actions')}</th></tr>
        ${view.map((r) => `<tr class="${status(r)} rowin"><td><span class="ff-pill ${status(r)}">${status(r)}</span></td><td>${fmt(r.emissao)}</td><td>${r.numero}</td><td>${esc(r.pessoa)}</td><td>${fmt(r.venc)}</td><td>${fmt(r.baixa) || '—'}</td><td>${brl(total(r))}</td>
          <td class="act"><button data-edit="${kind}:${r.id}:v" title="${L('Visualizar', 'View')}">👁</button><button data-edit="${kind}:${r.id}:e" class="e" title="${L('Editar', 'Edit')}">✎</button><button data-del="${kind}:${r.id}" class="d" title="${L('Excluir', 'Delete')}">🗑</button></td></tr>`).join('') || `<tr><td colspan="8" class="empty">${L('Nenhuma conta encontrada', 'No accounts found')}<small>${L('Tente ajustar os filtros ou cadastre uma nova conta', 'Adjust filters or add a new account')}</small></td></tr>`}</table>
        <div class="ff-pager"><span>${L('Mostrando', 'Showing')} <b>${rows.length ? (st.pg - 1) * size + 1 : 0}</b> ${L('a', 'to')} <b>${(st.pg - 1) * size + view.length}</b> ${L('de', 'of')} <b>${rows.length}</b> ${L('registros', 'records')}</span><span><button data-pg="${st.pg - 1}" ${st.pg <= 1 ? 'disabled' : ''}>${L('Anterior', 'Previous')}</button>${Array.from({ length: pages }, (_, i) => `<button class="${i + 1 === st.pg ? 'on' : ''}" data-pg="${i + 1}">${i + 1}</button>`).join('')}<button data-pg="${st.pg + 1}" ${st.pg >= pages ? 'disabled' : ''}>${L('Próxima', 'Next')}</button></span></div></div>`;
    },
    form() {
      const f = st.form, isP = f.kind === 'pagar', ro = f.mode === 'v' ? 'disabled' : '';
      const inp = (k, label, type, req) => `<div><label>${label}${req ? '<i>*</i>' : ''}</label><input class="ff-in" data-fld="${k}" type="${type || 'text'}" value="${f.r[k] === undefined ? '' : esc(f.r[k])}" ${ro}></div>`;
      const ttl = (f.mode === 'n' ? L('Nova', 'New') : f.mode === 'e' ? L('Editar', 'Edit') : L('Visualizar', 'View')) + ' ' + (isP ? L('Conta a Pagar', 'Account Payable') : L('Conta a Receber', 'Account Receivable'));
      return `<div class="ff-card glass head"><h1>${ttl}</h1><button class="ff-btn alt" data-go="${f.kind}">← ${L('Voltar', 'Back')}</button></div>
        <div class="ff-card blk"><div class="hb">📄 ${L('Dados do Documento', 'Document Data')}</div><div class="ff-grid4 pad">${inp('emissao', L('Data de Emissão', 'Issue Date'), 'date', 1)}${inp('numero', L('Número', 'Number'))}${inp('prefixo', L('Prefixo', 'Prefix'))}${inp('parcela', L('Parcela', 'Installment'))}${inp('pessoa', isP ? L('Fornecedor', 'Supplier') : L('Cliente', 'Client'), 'text', 1)}${inp('venc', L('Vencimento', 'Due Date'), 'date', 1)}${inp('baixa', L('Data de Baixa', 'Settlement Date'), 'date')}</div></div>
        <div class="ff-card blk"><div class="hb">💲 ${L('Valores', 'Amounts')}</div><div class="ff-grid4 pad">${inp('orig', L('Valor Original', 'Original Amount'), 'number', 1)}${inp('acr', L('Acréscimo', 'Increase'), 'number')}${inp('dec', L('Decréscimo', 'Discount'), 'number')}<div><label>${L('Valor', 'Total')}</label><input class="ff-in" id="ffTot" disabled value="${brl(total(f.r))}"></div></div></div>
        <div class="ff-card blk"><div class="hb">💳 ${L('Pagamento', 'Payment')}</div><div class="ff-grid3 pad">${inp('especie', L('Espécie', 'Payment type'), 'text', 1)}${inp('tipo', L('Tipo', 'Type'), 'text', 1)}${inp('banco', 'Banco')}</div></div>
        <div class="ff-card blk"><div class="hb">📝 ${L('Histórico', 'History')}</div><div class="pad"><label>${L('Observações', 'Notes')}</label><textarea class="ff-in" rows="3" data-fld="obs" ${ro}>${esc(f.r.obs)}</textarea></div></div>
        ${f.mode === 'v' ? '' : `<div class="ff-foot"><button class="ff-btn gray" data-go="${f.kind}">${L('Cancelar', 'Cancel')}</button><button class="ff-btn" data-save>${f.mode === 'n' ? L('Salvar', 'Save') : L('Atualizar', 'Update')}</button></div>`}
        ${f.mode === 'e' ? `<p class="ff-hint">${L('Dica: preencha a "Data de Baixa" e salve para baixar a conta, como no sistema real.', 'Tip: fill "Settlement Date" and save to settle the account, as in the real system.')}</p>` : ''}`;
    },
    orc() {
      return `<div class="ff-card glass head"><div><h1>${L('Orçamentos', 'Quotes')}</h1><p>${L('Gerencie orçamentos e efetive em venda', 'Manage quotes and convert to sales')}</p></div><div><button class="ff-btn" data-export="orc">⬇ ${L('Exportar', 'Export')}</button> <button class="ff-btn alt" data-neworc>＋ ${L('Novo Orçamento', 'New Quote')}</button></div></div>
        <div class="ff-card tbl"><table><tr><th>${L('Número', 'Number')}</th><th>${L('Cliente', 'Client')}</th><th>${L('Data', 'Date')}</th><th>Total</th><th>Status</th><th>${L('Ações', 'Actions')}</th></tr>
        ${db.orc.map((o, i) => `<tr class="rowin"><td>${o.n}</td><td>${esc(o.cli)}</td><td>${fmt(o.data)}</td><td>${brl(o.total)}</td><td><span class="ff-pill ${o.st === 'open' ? 'ABERTO' : 'PAGO'}">${o.st === 'open' ? L('Aberto', 'Open') : L('Efetivado', 'Converted')}</span></td><td class="act"><button title="${L('Visualizar', 'View')}">👁</button>${o.st === 'open' ? `<button data-conv="${i}" title="${L('Efetivar em venda', 'Convert to sale')}">✔</button>` : ''}</td></tr>`).join('')}</table></div>`;
    },
    orcform() {
      const o = st.of, sub = o.itens.reduce((a, i) => a + i.q * i.p * (1 - i.d / 100), 0), dg = sub * (o.dg / 100), ac = sub * (o.ac / 100), tot = sub - dg + ac, pg = o.pag.reduce((a, p) => a + p.v, 0);
      return `<div class="ff-card glass head"><h1>${L('Novo Orçamento', 'New Quote')}</h1><button class="ff-btn alt" data-go="orc">← ${L('Voltar', 'Back')}</button></div>
        <div class="ff-card blk"><div class="hb">📄 ${L('Dados do Orçamento', 'Quote Data')}</div><div class="ff-grid3 pad"><div><label>${L('Cliente', 'Client')}<i>*</i></label><select class="ff-in" data-ofld="cli"><option value="">${L('Selecione...', 'Select...')}</option>${db.clientes.map((c) => `<option ${o.cli === c.nome ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></div><div><label>${L('Data', 'Date')}</label><input class="ff-in" type="date" value="${TODAY}" disabled></div><div><label>${L('Validade', 'Valid until')}</label><input class="ff-in" type="date" value="2025-11-30" disabled></div></div></div>
        <div class="ff-card blk"><div class="hb">🛒 ${L('Itens do Orçamento', 'Quote Items')} <button class="ff-btn sm" data-additem>＋ ${L('Adicionar Item', 'Add Item')}</button></div><div class="pad">${o.itens.map((i, n) => `<div class="ff-item-row"><input class="ff-in" value="${i.c}" readonly title="${L('Código', 'Code')}"><input class="ff-in" value="${esc(i.dsc)}" readonly><input class="ff-in" type="number" min="1" value="${i.q}" data-iq="${n}" aria-label="${L('Quantidade', 'Quantity')}"><input class="ff-in" value="${brl(i.p)}" readonly><span class="dsc"><input class="ff-in" type="number" min="0" max="100" value="${i.d}" data-id="${n}" aria-label="${L('Desconto %', 'Discount %')}">%</span><b>${brl(i.q * i.p * (1 - i.d / 100))}</b><button class="act-d" data-rmitem="${n}" title="${L('Remover', 'Remove')}">🗑</button></div>`).join('') || `<p class="ff-hint">${L('Nenhum item. Clique em "Adicionar Item".', 'No items. Click "Add Item".')}</p>`}</div></div>
        <div class="ff-grid2"><div class="ff-card blk"><div class="hb">💲 ${L('Resumo Financeiro', 'Financial Summary')}</div><div class="pad ff-sum"><div class="ff-grid2"><div><label>${L('Desconto Geral (%)', 'Overall Discount (%)')}</label><input class="ff-in" type="number" min="0" max="100" value="${o.dg}" data-ofld="dg"></div><div><label>${L('Acréscimo (%)', 'Increase (%)')}</label><input class="ff-in" type="number" min="0" max="100" value="${o.ac}" data-ofld="ac"></div></div>
          <p><span>Subtotal:</span><b>${brl(sub)}</b></p><p><span>${L('Desconto', 'Discount')} (${o.dg}%):</span><b class="neg">- ${brl(dg)}</b></p><p><span>${L('Acréscimo', 'Increase')} (${o.ac}%):</span><b>+ ${brl(ac)}</b></p><p class="tot"><span>Total Geral:</span><b>${brl(tot)}</b></p></div></div>
        <div class="ff-card blk"><div class="hb">💳 ${L('Formas de Pagamento', 'Payment Methods')} <button class="ff-btn sm" data-addpag>＋ ${L('Adicionar Formas', 'Add Methods')}</button></div><div class="pad">${o.pag.map((p, n) => `<p class="ff-pag"><span>${p.f}</span><b>${brl(p.v)}</b><button class="act-d" data-rmpag="${n}">✕</button></p>`).join('') || `<p class="ff-hint">${L('Nenhuma forma adicionada.', 'No methods added.')}</p>`}<p class="ff-hint ${Math.abs(pg - tot) < 0.01 || !o.pag.length ? '' : 'warn'}">${L('Total pago', 'Paid total')}: ${brl(pg)} / ${brl(tot)}</p></div></div></div>
        ${st.err ? `<div class="ff-alert err">${st.err}</div>` : ''}<div class="ff-foot"><button class="ff-btn gray" data-go="orc">${L('Cancelar', 'Cancel')}</button><button class="ff-btn" data-saveorc>${L('Salvar', 'Save')}</button></div>`;
    },
    clientes() { return crudList('clientes'); },
    produtos() { return crudList('produtos'); },
    cform() { return crudForm(); },
    pform() { return crudForm(); },
    vendas() {
      return `<div class="ff-card glass head"><div><h1>Vendas NF</h1><p>${L('Notas fiscais e vendas efetivadas', 'Invoices and converted sales')}</p></div><button class="ff-btn alt">＋ ${L('Nova Venda', 'New Sale')}</button></div>
        <div class="ff-card tbl"><table><tr><th>${L('Número', 'Number')}</th><th>${L('Cliente', 'Client')}</th><th>${L('Data', 'Date')}</th><th>Total</th><th>NF</th></tr>${db.vendas.slice().reverse().map((v) => `<tr class="rowin ${v.fresh ? 'fresh' : ''}"><td>${v.n}</td><td>${esc(v.cli)}</td><td>${fmt(v.data)}</td><td>${brl(v.total)}</td><td><span class="ff-pill PAGO">${L('Emitida', 'Issued')}</span></td></tr>`).join('')}</table></div>`;
    },
    pdv() {
      return `<div class="ff-card glass head"><div><h1>${L('PDV - Ponto de Venda', 'POS - Point of Sale')}</h1><p>${L('Abertura e fechamento de caixa', 'Cash register opening and closing')}</p></div><button class="ff-btn alt" data-go="pdvform">＋ ${L('Abrir Caixa', 'Open Register')}</button></div>
        <div class="ff-card tbl"><table><tr><th>Caixa</th><th>${L('Operador', 'Operator')}</th><th>${L('Data Abertura', 'Opened at')}</th><th>${L('Troco Inicial', 'Opening cash')}</th><th>Status</th><th>${L('Ações', 'Actions')}</th></tr>${db.caixas.map((c) => `<tr class="rowin"><td>${esc(c.caixa)}</td><td>${esc(c.op)}</td><td>${c.abertura}</td><td>${brl(c.troco)}</td><td><span class="ff-pill ${c.st === 'aberto' ? 'ABERTO' : 'PAGO'}">${c.st === 'aberto' ? L('Aberto', 'Open') : L('Fechado', 'Closed')}</span></td><td class="act">${c.st === 'aberto' ? `<button data-closecx="${c.id}" title="${L('Fechar caixa', 'Close register')}">🔒</button>` : ''}</td></tr>`).join('')}</table></div>`;
    },
    pdvform() {
      return `<div class="ff-card glass head"><h1>${L('Abrir Caixa', 'Open Register')}</h1><button class="ff-btn alt" data-go="pdv">← ${L('Voltar', 'Back')}</button></div>
        <div class="ff-card blk"><div class="hb">🧾 ${L('Dados do Caixa', 'Register Data')}</div><div class="ff-grid3 pad"><div><label>Caixa<i>*</i></label><input class="ff-in" id="cxN" placeholder="Caixa 03"></div><div><label>${L('Operador', 'Operator')}<i>*</i></label><input class="ff-in" id="cxO" value="Rafael"></div><div><label>${L('Troco Inicial', 'Opening cash')}</label><input class="ff-in" id="cxT" type="number" value="200"></div></div></div>
        ${st.err ? `<div class="ff-alert err">${st.err}</div>` : ''}<div class="ff-foot"><button class="ff-btn gray" data-go="pdv">${L('Cancelar', 'Cancel')}</button><button class="ff-btn" data-savecx>${L('Abrir Caixa', 'Open Register')}</button></div>`;
    }
  };

  function modal() {
    const m = st.modal; if (!m) return '';
    if (m === 'prod') return `<div class="ff-modal"><div class="bx"><h3>${L('Buscar produto', 'Search product')}</h3>${db.produtos.map((p, i) => `<button class="ff-prod" data-pick="${i}"><b>${esc(p.cod)}</b> ${esc(p.desc)}<span>${brl(+p.preco)}</span></button>`).join('')}<div class="ff-foot"><button class="ff-btn gray" data-mc>${L('Cancelar', 'Cancel')}</button></div></div></div>`;
    return `<div class="ff-modal"><div class="bx"><h3>${L('Adicionar forma de pagamento', 'Add payment method')}</h3><label>${L('Forma', 'Method')}</label><select class="ff-in" id="pgF"><option>PIX</option><option>Boleto</option><option>${L('Cartão', 'Card')}</option><option>${L('Dinheiro', 'Cash')}</option></select><label>${L('Valor', 'Amount')}</label><input class="ff-in" id="pgV" type="number" value="${(() => { const o = st.of, s = o.itens.reduce((a, i) => a + i.q * i.p * (1 - i.d / 100), 0); return (s * (1 - o.dg / 100) * (1 + o.ac / 100) - o.pag.reduce((a, p) => a + p.v, 0)).toFixed(2); })()}"><div class="ff-foot"><button class="ff-btn gray" data-mc>${L('Cancelar', 'Cancel')}</button><button class="ff-btn" data-okpag>${L('Confirmar', 'Confirm')}</button></div></div></div>`;
  }

  function draw(anim) {
    if (st.page === 'login') { host.innerHTML = `<div class="ff-app login ${st.dark ? 'ff-dark' : ''}">${pages.login()}</div>`; return; }
    const body = st.page === 'pagar' || st.page === 'receber' ? pages.list(st.page) : (st.page === 'cform' || st.page === 'pform') ? crudForm() : st.page === 'form' ? pages.form() : pages[st.page]();
    host.innerHTML = `<div class="ff-app ${st.dark ? 'ff-dark' : ''}">${topbar()}<div class="ff-main">${sidebar()}<section class="ff-page ${anim === false ? 'noanim' : ''}">${body}</section></div>${modal()}<div class="dm-toasts"></div></div>`;
    if (st.toast) { U.toast(host.querySelector('.ff-app'), st.toast[0], st.toast[1]); st.toast = null; }
    U.countAll(host);
  }
  const go = (p) => { if (p !== st.page) st.q = ''; st.page = p; st.bell = false; st.err = ''; st.pg = 1; if (p === 'pagar' || p === 'receber') st.open = 'fin'; if (['orc', 'vendas', 'pdv'].includes(p)) st.open = 'ven'; if (p === 'clientes' || p === 'produtos') st.open = 'cad'; draw(); };

  host.onclick = (e) => {
    const t = e.target, q = (s) => t.closest(s);
    let b;
    if ((b = q('[data-go]'))) return go(b.dataset.go);
    if ((b = q('[data-grp]'))) { const k = b.dataset.grp, items = host.querySelector('[data-items="' + k + '"]'); st.open = st.open === k ? '' : k; host.querySelectorAll('.grp-items').forEach((el) => el.classList.toggle('open', el.dataset.items === st.open)); host.querySelectorAll('.ff-item.grp span').forEach((sp) => sp.classList.toggle('up', sp.parentNode.dataset.grp === st.open)); return; }
    if (q('[data-na]')) return;
    if (q('[data-bell]')) { st.bell = !st.bell; return draw(false); }
    if (q('[data-dark]')) { st.dark = !st.dark; return draw(false); }
    if ((b = q('[data-cnew]'))) { const k = b.dataset.cnew; st.cf = { kind: k, mode: 'n', r: {} }; st.page = k === 'clientes' ? 'cform' : 'pform'; return draw(); }
    if ((b = q('[data-cedit]'))) { const [k, id, m] = b.dataset.cedit.split(':'); st.cf = { kind: k, mode: m, r: Object.assign({}, db[k].find((r) => r.id === +id)) }; st.page = k === 'clientes' ? 'cform' : 'pform'; return draw(); }
    if ((b = q('[data-cdel]'))) { const [k, id] = b.dataset.cdel.split(':'); db[k] = db[k].filter((r) => r.id !== +id); db.log.push(L('Registro excluído · ', 'Record deleted · ') + CRUD[k].title); say(L('Registro excluído.', 'Record deleted.'), 'warn'); return draw(false); }
    if (q('[data-csave]')) {
      const f = st.cf, C = CRUD[f.kind], miss = C.fields.some(([k, , , req]) => req && !String(f.r[k] || '').trim());
      if (miss) { say(L('Preencha os campos obrigatórios (*).', 'Fill in the required fields (*).'), 'err'); return draw(false); }
      if (f.kind === 'produtos') { f.r.preco = +f.r.preco || 0; f.r.est = +f.r.est || 0; f.r.un = f.r.un || 'UN'; }
      if (f.mode === 'n') { f.r.id = Math.max(0, ...db[f.kind].map((x) => x.id)) + 1; f.r.cod = C.code + String(f.r.id).padStart(3, '0'); db[f.kind].push(f.r); db.log.push(L('Novo registro · ', 'New record · ') + (f.r.nome || f.r.desc)); }
      else { db[f.kind][db[f.kind].findIndex((x) => x.id === f.r.id)] = f.r; db.log.push(L('Registro atualizado · ', 'Record updated · ') + (f.r.nome || f.r.desc)); }
      say(L('Registro salvo com sucesso!', 'Record saved successfully!')); st.page = f.kind; return draw();
    }
    if ((b = q('[data-sort]'))) { const k = b.dataset.sort; st.sort = { k, d: st.sort.k === k ? -st.sort.d : 1 }; return draw(false); }
    if ((b = q('[data-pg]'))) { if (!b.disabled) { st.pg = +b.dataset.pg; draw(false); } return; }
    if ((b = q('[data-export]'))) { say(L('Exportação gerada (XLSX) — ', 'Export generated (XLSX) — ') + b.dataset.export, 'ok'); db.log.push(L('Exportação gerada', 'Export generated')); return draw(false); }
    if ((b = q('[data-new]'))) { st.form = { kind: b.dataset.new, mode: 'n', r: { id: 0, emissao: TODAY, numero: '', prefixo: '', parcela: '1/1', pessoa: '', venc: '2025-12-10', baixa: '', orig: 0, acr: 0, dec: 0, especie: '', tipo: '', banco: '', obs: '' } }; st.page = 'form'; return draw(); }
    if ((b = q('[data-edit]'))) { const [k, id, m] = b.dataset.edit.split(':'); st.form = { kind: k, mode: m, r: Object.assign({}, db[k].find((r) => r.id === +id)) }; st.page = 'form'; return draw(); }
    if ((b = q('[data-del]'))) { const [k, id] = b.dataset.del.split(':'); db[k] = db[k].filter((r) => r.id !== +id); db.log.push(L('Conta excluída', 'Account deleted')); say(L('Conta excluída com sucesso.', 'Account deleted successfully.'), 'warn'); return draw(false); }
    if (q('[data-save]')) {
      const f = st.form, r = f.r;
      if (!r.pessoa || !r.venc || !+r.orig) { say(L('Preencha os campos obrigatórios (*).', 'Fill in the required fields (*).'), 'err'); return draw(false); }
      r.orig = +r.orig; r.acr = +r.acr || 0; r.dec = +r.dec || 0;
      if (f.mode === 'n') { r.id = Math.max(0, ...db[f.kind].map((x) => x.id)) + 1; db[f.kind].push(r); db.log.push(L('Nova conta · ', 'New account · ') + r.pessoa); }
      else { db[f.kind][db[f.kind].findIndex((x) => x.id === r.id)] = r; db.log.push((r.baixa ? L('Baixa realizada · ', 'Settlement done · ') : L('Conta atualizada · ', 'Account updated · ')) + r.pessoa); }
      say(r.baixa ? L('Baixa registrada com sucesso!', 'Settlement registered!') : L('Conta salva com sucesso!', 'Account saved successfully!'), 'ok'); st.page = f.kind; return draw();
    }
    if (q('[data-neworc]')) { st.of = { cli: '', itens: [], dg: 0, ac: 0, pag: [] }; st.page = 'orcform'; st.err = ''; return draw(); }
    if (q('[data-additem]')) { st.modal = 'prod'; return draw(false); }
    if ((b = q('[data-pick]'))) { const p = db.produtos[+b.dataset.pick]; st.of.itens.push({ c: p.cod, dsc: p.desc, q: 1, p: +p.preco, d: 0 }); st.modal = null; return draw(false); }
    if ((b = q('[data-rmitem]'))) { st.of.itens.splice(+b.dataset.rmitem, 1); return draw(false); }
    if (q('[data-addpag]')) { st.modal = 'pag'; return draw(false); }
    if (q('[data-okpag]')) { const v = parseFloat(host.querySelector('#pgV').value); if (v > 0) st.of.pag.push({ f: host.querySelector('#pgF').value, v }); st.modal = null; return draw(false); }
    if ((b = q('[data-rmpag]'))) { st.of.pag.splice(+b.dataset.rmpag, 1); return draw(false); }
    if (q('[data-mc]')) { st.modal = null; return draw(false); }
    if (q('[data-saveorc]')) {
      const o = st.of; if (!o.cli || !o.itens.length) { st.err = L('Selecione o cliente e adicione ao menos um item.', 'Select the client and add at least one item.'); return draw(false); }
      const sub = o.itens.reduce((a, i) => a + i.q * i.p * (1 - i.d / 100), 0), tot = sub * (1 - o.dg / 100) * (1 + o.ac / 100);
      db.orc.push({ n: String(89 + db.orc.length - 1).padStart(6, '0'), cli: o.cli, data: TODAY, total: Math.round(tot * 100) / 100, st: 'open' }); db.log.push(L('Orçamento criado · ', 'Quote created · ') + o.cli); say(L('Orçamento salvo com sucesso!', 'Quote saved successfully!')); st.page = 'orc'; return draw();
    }
    if ((b = q('[data-conv]'))) { const o = db.orc[+b.dataset.conv]; o.st = 'conv'; db.vendas.push({ n: 'NF-' + (1023 + db.vendas.length - 2), cli: o.cli, data: TODAY, total: o.total, st: 'ok', fresh: true }); db.log.push(L('Orçamento efetivado em venda', 'Quote converted to sale')); say(L('Orçamento efetivado — venda criada em Vendas NF.', 'Quote converted — sale created in Sales.')); return draw(false); }
    if ((b = q('[data-closecx]'))) { const c = db.caixas.find((x) => x.id === +b.dataset.closecx); c.st = 'fechado'; db.log.push(L('Caixa fechado · ', 'Register closed · ') + c.caixa); say(L('Caixa fechado.', 'Register closed.'), 'warn'); return draw(false); }
    if (q('[data-savecx]')) {
      const n = host.querySelector('#cxN').value.trim(), o = host.querySelector('#cxO').value.trim();
      if (!n || !o) { st.err = L('Informe o caixa e o operador.', 'Enter the register and operator.'); return draw(false); }
      if (db.caixas.some((c) => c.caixa === n && c.st === 'aberto')) { st.err = L('Já existe um caixa aberto com esse nome.', 'A register with this name is already open.'); return draw(false); }
      db.caixas.push({ id: db.caixas.length + 1, caixa: n, op: o, abertura: TODAY + ' 09:30', troco: +host.querySelector('#cxT').value || 0, st: 'aberto' }); db.log.push(L('Caixa aberto · ', 'Register opened · ') + n); say(L('Caixa aberto com sucesso!', 'Register opened!')); st.page = 'pdv'; return draw();
    }
    if (st.bell && !q('.ff-pop')) { st.bell = false; draw(false); }
  };
  host.oninput = (e) => {
    const t = e.target;
    if (t.dataset.cfld) { st.cf.r[t.dataset.cfld] = t.value; return; }
    if (t.dataset.fld) { st.form.r[t.dataset.fld] = t.value; if (['orig', 'acr', 'dec'].includes(t.dataset.fld)) { const tot = host.querySelector('#ffTot'); if (tot) tot.value = brl(total(st.form.r)); } }
    else if (t.matches('[data-q]')) { st.q = t.value; st.pg = 1; const pos = t.selectionStart; draw(false); const i = host.querySelector('[data-q]'); i.focus(); i.setSelectionRange(pos, pos); }
  };
  const clamp = (v) => Math.max(0, Math.min(100, v));
  host.onchange = (e) => {
    const t = e.target;
    if (t.matches('[data-st]')) { st.status = t.value; st.pg = 1; draw(false); }
    if (t.matches('[data-vc]')) { st.venc = t.value; st.pg = 1; draw(false); }
    if (t.dataset.iq !== undefined) { st.of.itens[+t.dataset.iq].q = Math.max(1, +t.value || 1); return draw(false); }
    if (t.dataset.id !== undefined) { st.of.itens[+t.dataset.id].d = clamp(+t.value || 0); return draw(false); }
    if (t.dataset.ofld) { st.of[t.dataset.ofld] = t.dataset.ofld === 'cli' ? t.value : clamp(+t.value || 0); draw(false); }
  };
  draw();
};
