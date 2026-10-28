/* Estúdio 2.5D: percurso por rolagem, objetos acessíveis e câmera com foco. */
window.Studio = (function () {
  const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const stations=[
    {id:'about',name:['Boas-vindas','Welcome'],object:['Conhecer Rafael','Meet Rafael'],x:650,color:'#d1aa74',kind:'welcome'},
    {id:'dara',name:['Nous','Nous'],object:['Explorar Nous','Explore Nous'],x:1850,color:'#a79ad0',kind:'project'},
    {id:'uply',name:['Uply','Uply'],object:['Explorar Uply','Explore Uply'],x:3050,color:'#ed8c45',kind:'project'},
    {id:'finfat',name:['DFinanceiro','DFinanceiro'],object:['Explorar DFinanceiro','Explore DFinanceiro'],x:4250,color:'#77aa88',kind:'project'},
    {id:'experience',name:['Minha trajetória','My journey'],object:['Ver experiência e formação','View experience and education'],x:5450,color:'#d2b276',kind:'experience'},
    {id:'contact',name:['Vamos conversar','Let’s talk'],object:['Abrir contato','Get in touch'],x:6650,color:'#92b9a8',kind:'contact'}
  ];
  // World coordinates relative to each station: monitor, shelf, and wall sign corners.
  const hotspotAnchors=[[165,-405],[165,-405],[165,-405],[165,-405],[180,-405],[140,-415]];
  let canvas,world,scroll,root,panel,active=false,ready=false,raf=0,last=0,time=0,progress=0,index=-1;
  let W=1,H=1,K=1,DPR=1,floor=1,characterX=650,camera=850,zoom=1,lift=0,walkPhase=0,walkBlend=0,direction=1,speed=0,gait='walk',gaitRate=0,idleTime=0,arrived=-1,gesture=null,gestureStart=0,gestureDuration=0;
  let focus=null,openTimer=0,pointerX=0,pointerY=0,siteScroll=0,hotspotTrigger=null,resizeTimer=0,transitioning=false;
  const keys=new Set();let drag=null;
  const movementKeys={a:-1,w:-1,arrowleft:-1,arrowup:-1,d:1,s:1,arrowright:1,arrowdown:1};
  function resetInput(){keys.clear();drag=null;root?.classList.remove('studio-dragging');}
  const image=new Image(),walk=new Image(),run=new Image(),motionImages={walk,run,wave:new Image(),present:new Image(),celebrate:new Image()},screens={},L=()=>App.lang()==='pt',t=v=>v[L()?0:1],esc=s=>App.esc(s),reduced=()=>App.reduced();
  function mount(){
    root=document.createElement('section');root.id='studio';root.hidden=true;
    root.innerHTML=`<canvas id="studio-canvas" aria-hidden="true"></canvas><div id="studio-scroll" tabindex="0" role="region"><div id="studio-distance"></div></div><div class="studio-vignette" aria-hidden="true"></div><div class="studio-heading"><p class="studio-eyebrow">RAFAEL CARVALHO <span>/</span> <b id="studio-category"></b></p><h1 id="studio-title"></h1><p id="studio-subtitle"></p></div><div id="studio-hotspots"></div><div class="studio-footer"><div class="studio-help"><p id="studio-hint"></p><button id="studio-replay" class="studio-replay" aria-label="Rever introdução" title="Rever introdução">↺</button></div><nav class="studio-route"></nav><div class="studio-location"><span id="studio-step">01 / 06</span><span class="studio-track"><i></i></span></div></div><div id="studio-loading" role="status"></div>`;
    document.body.appendChild(root);canvas=$('#studio-canvas');scroll=$('#studio-scroll');
    const controls=document.createElement('div');controls.className='studio-move';controls.innerHTML='<button class="pbtn ghost" data-studio-prev>←</button><button class="pbtn ghost" data-studio-forward>→</button>';
    $('.studio-help').appendChild(controls);
    const end=document.createElement('div');end.className='studio-end';end.hidden=true;end.innerHTML='<button class="pbtn" data-studio-portfolio></button>';root.appendChild(end);
    new ResizeObserver(([entry])=>root.style.setProperty('--studio-footer-height',entry.target.getBoundingClientRect().height+'px')).observe($('.studio-footer'));
    if(!canvas.getContext('2d'))return false;world=StudioWorld(canvas,image,screens,motionImages);
    panel=document.createElement('dialog');panel.id='studio-panel';panel.setAttribute('aria-labelledby','studio-panel-title');panel.innerHTML='<button class="studio-panel-close pbtn ghost" aria-label="Fechar">✕</button><div id="studio-panel-body"></div>';document.body.appendChild(panel);return true;
  }
  function loadScreens(){
    DATA.projects.forEach(p=>{const im=new Image();im.onload=schedule;im.src='data:image/svg+xml,'+encodeURIComponent(projectArt(p.id,App.lang()).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '));screens[p.id]=im;});
  }
  function updateLabels(){
    loadScreens();
    $('.skip-link').href=active?'#studio-scroll':'#site';
    root.ariaLabel=L()?'Estúdio interativo de Rafael':'Rafael’s interactive studio';scroll.ariaLabel=L()?'Role para explorar o estúdio. Use Tab para selecionar objetos.':'Scroll to explore the studio. Use Tab to select objects.';
    $('#studio-hint').textContent=L()?'Arraste ↔ · WASD / setas · Toque nos objetos':'Drag ↔ · WASD / arrows · Tap the objects';
    scroll.ariaLabel=L()?'Explore arrastando para os lados, rolando ou com WASD e as setas do teclado.':'Explore by dragging sideways, scrolling, or using WASD and arrow keys.';
    $('[data-studio-prev]').ariaLabel=L()?'Estação anterior':'Previous station';$('[data-studio-forward]').ariaLabel=L()?'Próxima estação':'Next station';
    $('[data-studio-portfolio]').textContent=L()?'Conhecer o portfólio →':'Discover the portfolio →';
    $('#studio-replay').ariaLabel=$('#studio-replay').title=L()?'Rever introdução':'Replay introduction';
    $('#studio-category').textContent=L()?'ESTÚDIO INTERATIVO':'INTERACTIVE STUDIO';$('#btnMode').textContent=active?(L()?'Ver portfólio ↗':'View portfolio ↗'):(L()?'Explorar estúdio ◇':'Explore studio ◇');$('#btnMode').setAttribute('aria-pressed',String(active));
    $('#studio-loading').textContent=L()?'Preparando o estúdio…':'Preparing the studio…';$('.studio-panel-close').ariaLabel=L()?'Fechar e voltar ao estúdio':'Close and return to the studio';$('.studio-route').ariaLabel=L()?'Ambientes do estúdio':'Studio rooms';
    $('.studio-route').innerHTML=stations.map((s,i)=>`<button data-station="${i}" aria-label="${esc(t(s.name))}" title="${esc(t(s.name))}"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(t(s.name))}</b></button>`).join('');
    $('#studio-hotspots').innerHTML=stations.map((s,i)=>`<button class="studio-hotspot" data-object="${i}" style="--station:${s.color}" aria-label="${esc(t(s.object))}"><span class="hotspot-plus" aria-hidden="true">+</span><span class="hotspot-label">${esc(t(s.object))}</span></button>`).join('');
    index=-1;updateStation();if(panel.open)renderPanel(focus);schedule();
  }
  function updateStation(){
    $('.studio-end').hidden=progress<.96;
    $('[data-studio-prev]').disabled=progress<=0;$('[data-studio-forward]').disabled=progress>=1;
    const next=clamp(Math.round(progress*5),0,5);if(next===index)return;index=next;
    $('#studio-title').textContent=index===0?(L()?'Entre. O código ganha vida aqui.':'Step inside. Code comes to life here.'):t(stations[index].name);
    const sub=L()?['Um passeio pelo meu trabalho, uma estação de cada vez.','Serviços de TI, horas e contratos conectados.','Serviços, conversas e pagamentos. Tudo no mesmo app.','Interfaces e dados para a operação financeira.','Aprendizado que vira produto. Experiência que vira solução.','Boas ideias começam com uma conversa.']:['A tour of my work, one station at a time.','IT services, time and contracts, connected.','Services, conversations and payments in one app.','Interfaces and data for financial operations.','Learning becomes products. Experience becomes solutions.','Good ideas start with a conversation.'];
    $('#studio-subtitle').textContent=sub[index];$('#studio-step').textContent=`${String(index+1).padStart(2,'0')} / 06`;
    document.querySelectorAll('[data-station]').forEach((b,i)=>{b.classList.toggle('current',i===index);if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    if(!reduced())$('#studio-title').animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing:'ease-out'});
  }
  function resize(){
    W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,W<700?1.25:1.5);K=Math.max(.35,Math.min(H/(W<700?1060:960),W/(W<700?680:1500)));floor=H*(W<700?.74:.79);
    canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';$('#studio-distance').style.height=`${H+Math.max(4500,H*6)}px`;scroll.scrollTop=progress*(scroll.scrollHeight-scroll.clientHeight);schedule();
  }
  function target(){const x=650+progress*6000,z=focus!==null?(W<700?1.2:1.32):1;return {x,camera:focus!==null?stations[focus].x:x+(W<700?50:210),zoom:z,lift:focus!==null?H*.47-floor+250*K*z:0};}
  function onScroll(){if(focus!==null||StudioIntro.active)return;progress=clamp(scroll.scrollTop/(scroll.scrollHeight-scroll.clientHeight||1),0,1);updateStation();schedule();}
  function go(i){if(!active||StudioIntro.active)return;closePanel(false);scroll.scrollTo({top:clamp(i,0,5)/5*(scroll.scrollHeight-scroll.clientHeight),behavior:reduced()?'instant':'smooth'});}
  function frame(now){
    raf=0;if(!active||StudioIntro.active||document.hidden||document.body.classList.contains('noscroll'))return;
    const dt=Math.min(.05,(now-last)/1000||.016);last=now;
    if(keys.size&&focus===null){const move=[...keys].reduce((n,key)=>n+movementKeys[key],0);scroll.scrollTop+=Math.sign(move)*dt*(scroll.scrollHeight-scroll.clientHeight)/9;progress=clamp(scroll.scrollTop/(scroll.scrollHeight-scroll.clientHeight||1),0,1);updateStation();}
    if(!reduced())time+=dt;const a=target(),smooth=reduced()?1:1-Math.exp(-dt*7);const moving=Math.abs(a.x-characterX)>3,oldX=characterX;direction=moving?Math.sign(a.x-characterX):direction;characterX+=(a.x-characterX)*smooth;speed=(characterX-oldX)/dt;
    const velocity=Math.abs(speed);if(gait==='walk'&&velocity>1350)gait='run';else if(gait==='run'&&velocity<650)gait='walk';
    if(gait==='run'&&!run.getAttribute('src'))run.src=STUDIO_MOTION.run.source;
    if(moving&&gesture!=='present')gesture=null;
    const rate=Math.min(gait==='run'?1.8:1.25,velocity/(gait==='run'?470:340));gaitRate+=(rate-gaitRate)*(1-Math.exp(-dt*14));if(moving)walkPhase+=dt*gaitRate;idleTime=moving?0:idleTime+dt;
    if(!moving&&arrived!==index){arrived=index;if(index===5)playGesture('celebrate');}
    if(gesture&&time-gestureStart>gestureDuration)gesture=null;walkBlend+=((moving?1:0)-walkBlend)*smooth;camera+=(a.camera-camera)*smooth;zoom+=(a.zoom-zoom)*smooth;lift+=(a.lift-lift)*smooth;
    const {ox,oy,z}=world.render({theme:document.documentElement.dataset.theme,W,H,DPR,K,floor,zoom,lift,characterX,camera,walkPhase,walkBlend,direction,speed,gait,gesture,gestureProgress:gesture?time-gestureStart:0,moving:Math.abs(a.x-characterX)>3,pointerX,pointerY,time,reduced:reduced(),pt:L()},stations);
    const headingBottom=W<700?$('.studio-heading').getBoundingClientRect().bottom:0;
    stations.forEach((s,i)=>{const el=document.querySelector(`[data-object="${i}"]`),[dx,dy]=hotspotAnchors[i],baseY=oy+dy*z,shifted=W<700&&baseY-40<headingBottom+8,x=ox+(s.x+(shifted?230:dx))*z,y=shifted?headingBottom+48:baseY,visible=x>45&&x<W-45&&y>120&&y<H-125&&!panel.open&&!StudioIntro.active&&focus===null;el.hidden=!visible;el.style.left=x+'px';el.style.top=y+'px';el.tabIndex=visible?0:-1;});$('.studio-track i').style.transform=`scaleX(${progress})`;if(!raf&&(!reduced()||keys.size))raf=requestAnimationFrame(frame);
  }
  function schedule(){if(active&&!raf&&!document.hidden){last=performance.now()-40;raf=requestAnimationFrame(frame);}}
  function projectPanel(s){const p=DATA.projects.find(p=>p.id===s.id);return `<p class="studio-panel-kicker">${esc(App.t(p.status))}</p><h2 id="studio-panel-title">${esc(p.name)}</h2><p class="studio-panel-lead">${esc(App.t(p.tagline))}</p><p>${esc(App.t(p.desc))}</p><dl>${p.caseStudy.map(([label,body])=>`<dt>${esc(App.t(label))}</dt><dd>${esc(App.t(body))}</dd>`).join('')}</dl><div class="chips">${p.stack.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div><button class="pbtn" data-studio-demo="${p.id}">${L()?'Abrir mini-demo':'Open mini-demo'} ↗</button>${p.url?`<a class="pbtn ghost" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${L()?'Visitar site':'Visit site'} ↗</a>`:''}<p class="demo-note">${App.ui('demoNote')}</p>`;}
  function renderPanel(i){
    if(i===null)return;const s=stations[i],p=DATA.profile;let html='';
    if(s.kind==='project')html=projectPanel(s);
    else if(s.kind==='welcome')html=`<p class="studio-panel-kicker">${L()?'POR TRÁS DO CÓDIGO':'BEHIND THE CODE'}</p><h2 id="studio-panel-title">Rafael Carvalho</h2><p class="studio-panel-lead">${esc(App.t(p.role))}</p><p>${esc(App.t(p.summary))}</p><div class="chips">${App.t(p.traits).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div><p>${L()?'Explore os monitores para conhecer Nous, Uply e DFinanceiro. Na estante, você encontra minha experiência e formação.':'Explore the monitors to discover Nous, Uply and DFinanceiro. The bookshelf holds my experience and education.'}</p><button class="pbtn" data-studio-next>${L()?'Conhecer os projetos':'Explore the projects'} →</button>`;
    else if(s.kind==='experience')html=`<p class="studio-panel-kicker">${L()?'MINHA TRAJETÓRIA':'MY JOURNEY'}</p><h2 id="studio-panel-title">${esc(App.t(DATA.experience.title))}</h2><p class="studio-panel-lead">${esc(DATA.experience.company)} · ${esc(App.t(DATA.experience.period))}</p><ul>${App.t(DATA.experience.items).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3>${App.ui('education')}</h3><p>${esc(App.t(DATA.education.degree))}<br>${esc(DATA.education.school)} · ${esc(App.t(DATA.education.status))}</p><div class="chips">${DATA.education.courses.map(c=>`<span class="chip">${esc(App.t(c.name))} · ${esc(c.org)}</span>`).join('')}</div><a class="pbtn" href="assets/Rafael-Carvalho-Curriculo.pdf?v=14a1999c91" download="Rafael-Carvalho-Curriculo.pdf">${L()?'Baixar currículo':'Download résumé'} ↓</a>`;
    else html=`<p class="studio-panel-kicker">${L()?'PRÓXIMO PROJETO':'NEXT PROJECT'}</p><h2 id="studio-panel-title">${L()?'Vamos construir algo juntos?':'Let’s build something together?'}</h2><p class="studio-panel-lead">${App.ui('finish')}</p><a class="studio-email" href="mailto:${esc(p.email)}">${esc(p.email)}</a><div class="studio-contact"><a class="pbtn" href="${esc(p.phoneLink)}" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a><a class="pbtn ghost" href="${esc(p.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a class="pbtn ghost" href="assets/Rafael-Carvalho-Curriculo.pdf?v=14a1999c91" download="Rafael-Carvalho-Curriculo.pdf">${L()?'Currículo':'Résumé'} ↓</a></div>`;
    if(s.kind==='contact')html+=`<button class="pbtn" data-studio-portfolio>${L()?'Conhecer o portfólio':'Discover the portfolio'} →</button>`;
    $('#studio-panel-body').innerHTML=html;panel.scrollTo({top:0,left:0,behavior:'instant'});
  }
  function playGesture(name,duration=null){if(reduced())return;const atlas=STUDIO_MOTION[name];gesture=name;gestureStart=time;gestureDuration=duration??atlas.frames.length/(atlas.fps||12);schedule();}
  function openObject(i){if(!active||panel.open||StudioIntro.active)return;resetInput();playGesture(i===5?'celebrate':'present',Infinity);clearTimeout(openTimer);focus=i;hotspotTrigger=document.activeElement;root.classList.add('studio-focusing');renderPanel(i);schedule();openTimer=setTimeout(()=>{if(focus!==i||!active)return;panel.showModal();$('.studio-panel-close').focus({preventScroll:true});panel.scrollTo({top:0,left:0,behavior:'instant'});schedule();},reduced()?0:650);}
  function closePanel(restore=true){gesture=null;clearTimeout(openTimer);if(panel.open)panel.close();focus=null;root.classList.remove('studio-focusing');schedule();if(restore&&hotspotTrigger?.isConnected)requestAnimationFrame(()=>requestAnimationFrame(()=>hotspotTrigger.focus({preventScroll:true})));}
  function switchMode(studio,toTop=false){
    resetInput();
    closePanel(false);
    if(studio){siteScroll=scrollY;active=true;root.hidden=false;document.body.classList.remove('mode-site');document.body.classList.add('mode-studio');$('#site').hidden=true;$('#toTop').hidden=true;$('#mobileMenu').hidden=true;$('#btnMenu').setAttribute('aria-expanded','false');resize();schedule();}
    else {active=false;if(raf)cancelAnimationFrame(raf);raf=0;root.hidden=true;$('#site').hidden=false;$('#toTop').hidden=false;document.body.classList.remove('mode-studio');document.body.classList.add('mode-site');window.scrollTo({top:toTop?0:siteScroll,behavior:'instant'});if(window.SiteFX)SiteFX.refresh();$('#site').focus({preventScroll:true});}
    try{sessionStorage.setItem('portfolio-view',studio?'studio':'site');}catch(e){}updateLabels();if(window.SiteFX)SiteFX.setMode(studio?'studio':'site');if(studio){if(!StudioIntro.seen)StudioIntro.show();else scroll.focus({preventScroll:true});}
  }
  async function setMode(studio,{instant=false,toTop=false}={}){
    if(!ready||transitioning||studio===active)return;
    if(!studio&&StudioIntro.active){StudioIntro.finish('portfolio');return;}
    if(instant||reduced()){switchMode(studio,toTop);return;}
    transitioning=true;
    if(panel.open)closePanel(false);
    const veil=document.createElement('div');veil.className='view-veil';veil.dataset.to=studio?'studio':'site';veil.setAttribute('aria-hidden','true');document.body.appendChild(veil);
    let switched=false;
    try {
      await veil.animate([{opacity:0,clipPath:'circle(0% at 50% 50%)'},{opacity:1,clipPath:'circle(150% at 50% 50%)'}],{duration:520,easing:'cubic-bezier(.65,0,.25,1)',fill:'forwards'}).finished;
      switchMode(studio,toTop);switched=true;
      await veil.animate([{opacity:1},{opacity:0}],{duration:580,easing:'ease-out',fill:'forwards'}).finished;
    } catch (e) {if(!switched)switchMode(studio,toTop);}
    finally {veil.remove();transitioning=false;}
  }
  function init(){
    if(!mount()){$('#btnMode').hidden=true;root.remove();return;}ready=true;
    const characterLoaded=()=>{$('#studio-loading').hidden=true;schedule();};
    CharacterAssets.load(image,CharacterAssets.heroSources,characterLoaded,()=>{
      $('#studio-loading').hidden=Object.values(motionImages).some(CharacterAssets.ready);
      $('#studio-loading').textContent=L()?'Personagem indisponível. Você pode abrir o portfólio.':'Character unavailable. You can open the portfolio.';
    });
    for(const name of ['walk','wave','present','celebrate'])CharacterAssets.load(motionImages[name],[STUDIO_MOTION[name].source],characterLoaded);
    run.onload=characterLoaded;run.onerror=()=>CharacterAssets.load(run,[STUDIO_MOTION.run.source],characterLoaded);
    scroll.addEventListener('scroll',onScroll,{passive:true});
    document.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(!active||focus!==null||StudioIntro.active||App.isModalOpen()||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea,[contenteditable="true"],dialog')||!(key in movementKeys))return;e.preventDefault();keys.add(key);schedule();});
    document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',resetInput);
    scroll.addEventListener('pointerdown',e=>{if(!active||focus!==null||StudioIntro.active||!e.isPrimary||e.button!==0)return;keys.clear();scroll.scrollTo({top:scroll.scrollTop,behavior:'instant'});drag={id:e.pointerId,x:e.clientX,y:e.clientY,top:scroll.scrollTop,horizontal:false};scroll.setPointerCapture(e.pointerId);});
    scroll.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.horizontal){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){resetInput();return;}if(Math.abs(dx)<8)return;drag.horizontal=true;root.classList.add('studio-dragging');}e.preventDefault();scroll.scrollTop=drag.top-dx*(scroll.scrollHeight-scroll.clientHeight)/(W*5);onScroll();});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])scroll.addEventListener(event,resetInput);
    root.addEventListener('click',e=>{if(e.target.closest('[data-studio-prev]'))go(index-1);if(e.target.closest('[data-studio-forward]'))go(index+1);if(e.target.closest('[data-studio-portfolio]'))setMode(false,{toTop:true});});
    root.addEventListener('click',e=>{const station=e.target.closest('[data-station]');if(station)go(+station.dataset.station);const obj=e.target.closest('[data-object]');if(obj)openObject(+obj.dataset.object);});
    root.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduced())return;pointerX=(e.clientX/W-.5)*6;pointerY=(e.clientY/H-.5)*3;});root.addEventListener('pointerleave',()=>{pointerX=pointerY=0;});
    $('#studio-replay').onclick=()=>{closePanel(false);StudioIntro.show();};
    $('.studio-panel-close').onclick=()=>closePanel();panel.addEventListener('cancel',e=>{e.preventDefault();closePanel();});panel.addEventListener('click',e=>{if(e.target.closest('[data-studio-portfolio]')){setMode(false,{toTop:true});return;}const r=panel.getBoundingClientRect();if(e.target===panel&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closePanel();const demo=e.target.closest('[data-studio-demo]');if(demo){const id=demo.dataset.studioDemo;closePanel(false);requestAnimationFrame(()=>requestAnimationFrame(()=>{if(hotspotTrigger?.isConnected)hotspotTrigger.focus({preventScroll:true});App.openProject(id);}));}if(e.target.closest('[data-studio-next]')){closePanel(false);go(1);}});
    $('.brand').addEventListener('click',e=>{if(active){e.preventDefault();go(0);}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active&&focus!==null&&!panel.open)closePanel();});
    $('#btnTheme').addEventListener('click',schedule);
    $('#btnMode').onclick=()=>setMode(!active);$('#btnLang').addEventListener('click',()=>{updateLabels();schedule();});
    addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,80);});document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}else schedule();});
    new MutationObserver(()=>{if(document.body.classList.contains('noscroll')){if(raf)cancelAnimationFrame(raf);raf=0;}else schedule();}).observe(document.body,{attributes:true,attributeFilter:['class']});
    new MutationObserver(()=>{if(active){if(raf)cancelAnimationFrame(raf);raf=0;schedule();}}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    StudioIntro.init({onEnter(){playGesture('wave');scroll.focus({preventScroll:true});schedule();},onPortfolio(){setMode(false);}});
    let view=null;try{view=sessionStorage.getItem('portfolio-view');}catch(e){}updateLabels();setMode(view!=='site'&&!/^#(hero|projects|experience|about|techs|education|contact)$/.test(location.hash),{instant:true});
  }
  return {init,setMode,go,openObject,get active(){return active;},get progress(){return progress;},get focused(){return focus;},get motion(){return reduced()?'idle':gait==='run'&&run.naturalWidth?'run':Math.abs(speed)>18?'walk':gesture||'idle';},playGesture};
})();
