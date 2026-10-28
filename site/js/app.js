/* Navegação, idioma, contato e demos carregadas sob demanda. */
window.App = (function () {
  const D = window.DATA, $ = s => document.querySelector(s);
  let lang = 'pt', theme = document.documentElement.dataset.theme || 'dark';
  let modalTrigger = null, openProjectId = null, requestId = 0;
  const loaded = new Map();
  const monitor=matchMedia('(min-width:1024px) and (hover:hover) and (pointer:fine)');
  function demoTheme(value) {
    const host=$('#demoHost');if(!host)return;
    host.dataset.demoTheme=value;host.style.colorScheme=value;
    const button=$('#demoTheme');if(button){button.textContent=value==='dark'?(lang==='pt'?'☀ Tema claro':'☀ Light theme'):(lang==='pt'?'☾ Tema escuro':'☾ Dark theme');button.setAttribute('aria-pressed',String(value==='dark'));}
    host.dispatchEvent(new Event('demo-theme-change'));
  }
  function fullscreenLabels() {
    const on=!!document.fullscreenElement||document.documentElement.classList.contains('fullscreen-fallback');
    document.querySelectorAll('[data-fullscreen]').forEach(button=>{button.hidden=!monitor.matches;button.textContent=on?(lang==='pt'?'⤡ Sair da tela cheia':'⤡ Exit fullscreen'):(lang==='pt'?'⛶ Tela cheia':'⛶ Fullscreen');button.setAttribute('aria-pressed',String(on));});
  }
  async function toggleFullscreen() {
    if(!monitor.matches)return;
    const root=document.documentElement;
    if(document.fullscreenElement){await document.exitFullscreen();}
    else if(root.classList.contains('fullscreen-fallback'))root.classList.remove('fullscreen-fallback');
    else {try{if(!root.requestFullscreen)throw new Error();await root.requestFullscreen();}catch(e){root.classList.add('fullscreen-fallback');}}
    fullscreenLabels();window.dispatchEvent(new Event('resize'));
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const t = o => o && typeof o === 'object' && 'pt' in o ? o[lang] : o;
  const ui = k => t(D.ui[k]);
  const chips = arr => arr.map(x => `<span class="chip">${esc(x)}</span>`).join('');
  const iconKeys = {'Angular 16':['angular'],'React Native':['react'],'TypeScript':['typescript'],'JavaScript':['javascript'],'Node.js':['nodejs'],'PostgreSQL':['postgresql'],'SQL':['db'],'APIs REST':['api'],'Tailwind CSS':['tailwindcss'],'HTML / CSS':['html5'],'Figma':['figma'],'Python':['python'],'Docker':['docker'],'CI/CD':['githubactions'],'AWS':['aws'],'Desenvolvimento com IA':['openai','claude']};
  const techIcons = name => `<span class="tech-icons" aria-hidden="true">${(iconKeys[name]||[]).map(key=>`<img src="data:image/svg+xml,${encodeURIComponent(window.TECH_ICONS[key])}" alt="" width="26" height="26" decoding="async">`).join('')}</span>`;
  const link = (url,label,cls='pbtn ghost') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
  const caseStudy = p => `<dl class="case-grid">${p.caseStudy.map(([label,body]) => `<div><dt>${esc(t(label))}</dt><dd>${esc(t(body))}</dd></div>`).join('')}</dl>`;
  const sectionTitle = (n,k) => `<p class="section-index">${n} / ${ui(k)}</p>`;
  function renderSite() {
    const p = D.profile, L = lang === 'pt';
    $('#site').innerHTML = `
      <section id="hero" class="hero wrapx" aria-labelledby="hero-title">
        <div class="hero-txt"><p class="status"><i aria-hidden="true"></i>${L?'Disponível para novos projetos':'Available for new projects'}</p>
          <p class="eyebrow">${L?'DESENVOLVEDOR FULL STACK':'FULL STACK DEVELOPER'}</p><h1 id="hero-title">${esc(p.name)}</h1>
          <p class="hero-statement">${L?'Sistemas financeiros. Aplicativos que chegam às lojas.':'Financial systems. Apps that reach the stores.'}</p>
          <p class="role big">Angular · React Native · Node.js · Python</p>
          <p class="lead">${L?'Desenvolvo aplicações web e mobile na Nous. Do ERP financeiro ao marketplace de serviços, conecto interfaces, APIs e dados para entregar produtos completos.':'I develop web and mobile applications at Nous. From financial ERP to a services marketplace, I connect interfaces, APIs and data to deliver complete products.'}</p>
          <div class="hero-cta"><a class="pbtn" href="#projects">${ui('seeProjects')} <span aria-hidden="true">↗</span></a><a class="pbtn ghost" href="assets/Rafael-Carvalho-Curriculo.pdf?v=14a1999c91" download="Rafael-Carvalho-Curriculo.pdf">${L?'Baixar currículo':'Download résumé'} ↓</a><a class="text-link" href="#contact">${ui('talk')}</a></div>
        </div>
        <div class="hero-art"><div class="hero-halo" aria-hidden="true"></div><i class="hero-orbit orbit-one" aria-hidden="true"></i><i class="hero-orbit orbit-two" aria-hidden="true"></i><picture><source type="image/webp" srcset="assets/rafael-game/hero-640.webp 640w, assets/rafael-game/hero.webp 937w" sizes="(max-width: 900px) 80vw, 460px"><img src="assets/rafael-game/hero-640.webp" width="937" height="1678" fetchpriority="high" decoding="async" alt="${L?'Personagem de Rafael em estilo de game 3D, com óculos, jaqueta azul, pulseira vermelha e notebook':'Rafael as a stylized 3D game character, wearing glasses, a blue jacket and a red wristband, holding a laptop'}" class="hero-char"></picture><span class="art-note">&lt;/&gt; Web &amp; mobile</span></div>
      </section>
      <div class="proof-band wrapx"><p><strong>${D.projects.length}</strong>${L?'projetos em destaque':'featured projects'}</p><p><strong>iOS + Android</strong>${L?'Uply publicado nas lojas':'Uply published on the app stores'}</p><p><strong>Nous</strong>${L?'Experiência profissional desde abr/2024':'Professional experience since Apr/2024'}</p></div>
      <section id="projects" class="blk wrapx" aria-labelledby="projects-title">${sectionTitle('01','projects')}<h2 id="projects-title">${L?'Produtos que eu ajudei a construir.':'Products I helped build.'}</h2><p class="section-intro">${L?'Conheça o contexto, as decisões técnicas e minha participação em cada entrega.':'Explore the context, technical decisions and my contribution to each project.'}</p>
        <div class="projects-list">${D.projects.map((pr,i)=>`<article class="pj" style="--c:${pr.color}" aria-labelledby="project-${pr.id}"><div class="pj-overview"><figure class="pj-art">${window.projectArt(pr.id,lang)}<figcaption>${L?'Ilustração do produto':'Product illustration'}</figcaption></figure><div class="pj-txt"><p class="project-status">${esc(t(pr.status))}</p><div class="pj-head">${pr.id==='finfat'?'<span class="project-monogram" aria-hidden="true">Dƒ</span>':`<img src="${pr.logo}" alt="" class="plogo" width="48" height="48" loading="lazy">`}<h3 id="project-${pr.id}">${esc(pr.name)}</h3></div><p class="project-tagline">${esc(t(pr.tagline))}</p><p>${esc(t(pr.desc))}</p><div class="chips">${chips(pr.stack.slice(0,6))}</div><div class="pj-btns"><button class="pbtn" data-open="${pr.id}">▶ ${ui('demo')}</button>${pr.url?link(pr.url,ui('visit')):''}</div><p class="demo-note">${ui('demoNote')}${pr.id==='dara'?(L?' · Portal completo com login':' · Full portal requires sign-in'):''}</p>${pr.stores?`<div class="store-links">${pr.stores.map(s=>link(s.url,s.name,'text-link')).join('')}</div>`:''}</div></div><details class="case-study"><summary>${ui('caseStudy')} <span aria-hidden="true">+</span></summary>${caseStudy(pr)}<h4>${ui('features')}</h4><ul class="feat">${t(pr.features).map(f=>`<li>${esc(f)}</li>`).join('')}</ul></details></article>`).join('')}</div>
      </section>
      <section id="experience" class="blk wrapx" aria-labelledby="experience-title">${sectionTitle('02','experience')}<h2 id="experience-title">${L?'Desenvolvimento próximo da operação.':'Development close to everyday operations.'}</h2><div class="experience-card card"><p class="eyebrow">${esc(D.experience.company)} · ${esc(t(D.experience.period))}</p><h3>${esc(t(D.experience.title))}</h3><ul>${t(D.experience.items).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></section>
      <section id="about" class="blk wrapx" aria-labelledby="about-title">${sectionTitle('03','about')}<div class="about-layout"><h2 id="about-title">${L?'Da interface à operação do produto.':'From interface to product operations.'}</h2><div><p class="lead">${esc(t(p.summary))}</p><div class="chips">${chips(t(p.traits))}</div></div></div></section>
      <section id="techs" class="blk wrapx" aria-labelledby="techs-title">${sectionTitle('04','techs')}<h2 id="techs-title">${L?'Ferramentas aplicadas a problemas reais.':'Tools applied to real problems.'}</h2><div class="tech-marquee" aria-hidden="true"><div class="tech-track">${[0,1].map(()=>D.techs.map(x=>`<span class="tech-pill">${techIcons(x.name)}${esc(t(x.label))}</span>`).join('')).join('')}</div></div><div class="tech-groups">${Object.entries(D.ui.groups).map(([group,label])=>`<div class="tech-group"><h3>${esc(t(label))}</h3><ul>${D.techs.filter(x=>x.group===group).map(x=>`<li>${techIcons(x.name)}<div><b>${esc(t(x.label))}</b><span>${esc(t(x.desc))}</span></div></li>`).join('')}</ul></div>`).join('')}</div></section>
      <section id="education" class="blk wrapx" aria-labelledby="education-title">${sectionTitle('05','education')}<h2 id="education-title">${ui('education')}</h2><div class="card"><h3>${esc(t(D.education.degree))}</h3><p class="role">${esc(D.education.school)} · ${esc(t(D.education.status))}</p><ul class="courses">${D.education.courses.map(c=>`<li>${esc(t(c.name))}<span>${esc(c.org)}</span></li>`).join('')}</ul></div></section>
      <section id="contact" class="blk wrapx" aria-labelledby="contact-title"><div class="card cta">${sectionTitle('06','contact')}<h2 id="contact-title">${L?'Vamos construir algo juntos?':"Let’s build something together?"}</h2><p class="role">${ui('finish')}</p><a class="email-link" href="mailto:${esc(p.email)}">${esc(p.email)}</a><div class="cta-actions"><button class="pbtn ghost" data-copy="${esc(p.email)}">${ui('copy')}</button>${link(p.linkedin,'LinkedIn')}${link(p.phoneLink,'WhatsApp')}<a class="pbtn ghost" href="assets/Rafael-Carvalho-Curriculo.pdf?v=14a1999c91" download="Rafael-Carvalho-Curriculo.pdf">${L?'Currículo (PDF)':'Résumé (PDF)'} ↓</a></div><p id="copyStatus" role="status" aria-live="polite"></p></div></section><section class="studio-invite wrapx"><p class="eyebrow">${L?'CONTINUE EXPLORANDO':'KEEP EXPLORING'}</p><h2>${L?'Conheça meu estúdio interativo.':'Discover my interactive studio.'}</h2><p>${L?'Passeie pelos projetos em um cenário interativo. Arraste para os lados ou use WASD e as setas.':'Walk through the projects in an interactive space. Drag sideways or use WASD and the arrow keys.'}</p><button class="pbtn" data-explore-studio>${L?'Explorar estúdio':'Explore studio'} →</button></section><footer class="wrapx">© ${new Date().getFullYear()} ${esc(p.name)}</footer>`;
    CharacterAssets.attachHero($('.hero-char'));
    const nav = ['projects','experience','about','techs','contact'];
    for(const selector of ['#siteNav','#mobileNav']) $(selector).innerHTML = nav.map(k=>`<a href="#${k}" data-spy="${k}">${ui(k)}</a>`).join('');
    document.title = `Rafael Carvalho · ${L?'Desenvolvedor Full Stack':'Full Stack Developer'}`;
    const description = L?'Rafael Carvalho: desenvolvimento web e mobile com Angular, React Native, Node.js e Python. Conheça Uply, DFinanceiro e Nous.':'Rafael Carvalho: web and mobile development with Angular, React Native, Node.js and Python. Explore Uply, DFinanceiro and Nous.';
    $('meta[name="description"]').content = description;
    for(const key of ['og:title','twitter:title']) $(`meta[${key.startsWith('og:')?'property':'name'}="${key}"]`).content=document.title;
    for(const key of ['og:description','twitter:description']) $(`meta[${key.startsWith('og:')?'property':'name'}="${key}"]`).content=description;
    $('meta[property="og:locale"]').content=L?'pt_BR':'en_US';
    if(window.SiteFX) SiteFX.refresh();
  }
  function applyChrome() {
    fullscreenLabels();
    document.documentElement.lang = lang==='pt'?'pt-BR':'en';
    $('#btnLang').textContent=lang==='pt'?'PT':'EN';
    $('#btnLang').ariaLabel=lang==='pt'?'Switch to English':'Mudar para português';
    $('#btnTheme').textContent=theme==='dark'?'☀':'☾';
    $('#btnTheme').title=$('#btnTheme').ariaLabel=lang==='pt'?(theme==='dark'?'Ativar tema claro':'Ativar tema escuro'):(theme==='dark'?'Use light theme':'Use dark theme');
    $('.brand').ariaLabel=lang==='pt'?'Rafael Carvalho, início':'Rafael Carvalho, home';
    $('#btnMenu').ariaLabel=ui('menu'); $('#modalClose').ariaLabel=ui('close');
    $('#toTop').ariaLabel=lang==='pt'?'Voltar ao topo':'Back to top';
    $('.skip-link').textContent=lang==='pt'?'Pular para o conteúdo':'Skip to content';
    $('#siteNav').ariaLabel=$('#mobileNav').ariaLabel=lang==='pt'?'Seções':'Sections';
    $('meta[name="theme-color"]').content=theme==='dark'?'#0b1014':'#f4efe7';
  }
  const reduced = () => document.documentElement.classList.contains('rm');
  function setReduced(on) {
    document.documentElement.classList.toggle('rm',on);
    if(window.SiteFX) SiteFX.setReduced(on);
  }
  function loadScript(src) {
    if(loaded.has(src)) return loaded.get(src);
    const promise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{loaded.delete(src);s.remove();reject(new Error('Script unavailable'));};document.head.appendChild(s);});
    loaded.set(src,promise);return promise;
  }
  async function openProject(id) {
    const p=D.projects.find(x=>x.id===id); if(!p) return;
    if (!document.getElementById('demo-fonts')) {
      const fonts=document.createElement('link');fonts.id='demo-fonts';fonts.rel='stylesheet';
      fonts.href='https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Source+Sans+3:wght@400;600;700&display=swap';document.head.appendChild(fonts);
    }
    const ticket=++requestId;
    if($('#modal').hidden) modalTrigger=document.activeElement;
    openProjectId=id;
    $('#modal').dataset.project=id;
    $('#modalBody').innerHTML=`<div class="m-head" style="--c:${p.color}"><h2 id="demo-title">${esc(p.name)}</h2><p>${esc(t(p.tagline))}</p></div><p class="demo-note">${ui('demoNote')}</p><div id="demoHost" class="demo-host" aria-busy="true"><p role="status">${lang==='pt'?'Carregando demo…':'Loading demo…'}</p></div>`;
    $('#modal').hidden=false; $('#modal').scrollTop=0;
    const toolbar=document.createElement('div');toolbar.className='demo-toolbar';
    toolbar.innerHTML=`<span>${lang==='pt'?'Explore o sistema':'Explore the system'}</span><button id="demoTheme" class="pbtn ghost"></button><button class="pbtn ghost" data-fullscreen></button>`;
    $('#demoHost').before(toolbar);
    demoTheme('dark');fullscreenLabels();
    document.body.classList.add('noscroll');
    $('#site').inert=true; $('#topbar').inert=true; $('#toTop').inert=true; if($('#studio'))$('#studio').inert=true;
    closeMenu(); $('#modalClose').focus({preventScroll:true});
    try {
      await loadScript('js/demos/_util.js?v=10');await loadScript(`js/demos/${id}.js?v=14`);
      if(ticket!==requestId || openProjectId!==id) return;
      if(!window.Demos?.[id]) throw new Error('Demo unavailable');
      const host=$('#demoHost');host.innerHTML='';Demos[id](host,lang);host.setAttribute('aria-busy','false');DemoUtil.resetScroll(host);
    } catch(e) {
      if(ticket!==requestId || openProjectId!==id) return;
      $('#demoHost').setAttribute('aria-busy','false');
      $('#demoHost').innerHTML=`<p role="alert">${ui('demoError')}</p><button class="pbtn" data-retry="${id}">${ui('retry')}</button>`;
    }
  }
  function closeModal() {
    requestId++;openProjectId=null;$('#modal').hidden=true;delete $('#modal').dataset.project;$('#modalBody').innerHTML='';document.body.classList.remove('noscroll');
    $('#site').inert=false;$('#topbar').inert=false;$('#toTop').inert=false;if($('#studio'))$('#studio').inert=false;
    if(modalTrigger?.isConnected) modalTrigger.focus({preventScroll:true});
  }
  function closeMenu() {$('#mobileMenu').hidden=true;$('#btnMenu').setAttribute('aria-expanded','false');}
  async function copyText(txt,btn) {
    const status=$('#copyStatus');let copied=false;
    try {await navigator.clipboard.writeText(txt);copied=true;} catch(e) {
      const field=document.createElement('textarea');field.value=txt;field.style.cssText='position:fixed;left:-9999px';document.body.appendChild(field);field.select();
      try {copied=document.execCommand('copy');} catch(e) {} finally {field.remove();btn.focus({preventScroll:true});}
    }
    if(copied && window.SiteFX) SiteFX.confetti(btn);
    status.textContent=copied?(lang==='pt'?'E-mail copiado!':'Email copied!'):(lang==='pt'?'Não foi possível copiar. Use o link de e-mail acima ou selecione o endereço.':'Could not copy. Use the email link above or select the address.');
  }
  function boot() {
    try {const saved=localStorage.getItem('lang');lang=['pt','en'].includes(saved)?saved:((navigator.language||'pt').startsWith('pt')?'pt':'en');} catch(e) {}
    renderSite();applyChrome();setReduced(reduced());
    $('#btnLang').onclick=()=>{lang=lang==='pt'?'en':'pt';try{localStorage.setItem('lang',lang);}catch(e){}closeMenu();renderSite();applyChrome();};
    $('#btnTheme').onclick=()=>{theme=theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;applyChrome();if(window.Bg3D)Bg3D.setTheme(theme);};
    $('#btnMenu').onclick=()=>{const open=$('#mobileMenu').hidden;$('#mobileMenu').hidden=!open;$('#btnMenu').setAttribute('aria-expanded',String(open));};
    $('#modalClose').onclick=closeModal;
    $('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
    document.addEventListener('click',e=>{
      if(e.target.closest('[data-fullscreen]'))toggleFullscreen();
      if(e.target.closest('#demoTheme'))demoTheme($('#demoHost').dataset.demoTheme==='dark'?'light':'dark');
      if(e.target.closest('[data-explore-studio]'))window.Studio?.setMode(true);
      const trigger=e.target.closest('[data-open], [data-retry]');if(trigger)openProject(trigger.dataset.open||trigger.dataset.retry);
      if(e.target.closest('#mobileNav a'))closeMenu();
      if(!e.target.closest('#mobileMenu, #btnMenu'))closeMenu();
      const copy=e.target.closest('[data-copy]');if(copy)copyText(copy.dataset.copy,copy);
      const anchor=e.target.closest('a[href^="#"]');if(anchor){const destination=$(anchor.getAttribute('href'));if(destination){destination.setAttribute('tabindex','-1');destination.focus({preventScroll:true});}}
    });
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&document.documentElement.classList.contains('fullscreen-fallback')){document.documentElement.classList.remove('fullscreen-fallback');fullscreenLabels();window.dispatchEvent(new Event('resize'));}
      if(e.key==='Escape'&&!$('#mobileMenu').hidden){closeMenu();$('#btnMenu').focus();}
      if($('#modal').hidden)return;
      if(e.key==='Escape')closeModal();
      if(e.key==='Tab'){
        const items=[...$('#modal').querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
        const first=items[0],last=items[items.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    });
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>setReduced(e.matches));
    document.addEventListener('fullscreenchange',fullscreenLabels);
    monitor.addEventListener('change',fullscreenLabels);
  }
  return {boot,t,ui,esc,openProject,lang:()=>lang,getLang:()=>lang,reduced,isModalOpen:()=>!$('#modal').hidden};
})();
