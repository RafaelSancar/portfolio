/* Movimento editorial: entradas em sequência, imagens ligadas à rolagem e cursor estável. */
window.SiteFX = (function () {
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const reduced=()=>document.documentElement.classList.contains('rm');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const compact=matchMedia('(max-width: 900px)');
  const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
  const animations=new Set(), revealed=new WeakSet();
  let viewMode='site';
  let ready=false,revealObserver,sectionObserver,sceneObserver,resizeObserver;
  let scrollFrame=0,pointerFrame=0,pointer=null,lastArt=null,hero=null,header=null;
  const scenes=new Set();
  function animate(el,keyframes,options) {
    if(!el||viewMode!=='site'||reduced()||document.hidden)return;
    const a=el.animate(keyframes,options);animations.add(a);
    a.finished.catch(()=>{}).finally(()=>animations.delete(a));return a;
  }
  function finishAnimations() {animations.forEach(a=>a.cancel());animations.clear();}
  function reveal(el) {
    if(revealed.has(el))return;revealed.add(el);
    const title=el.matches('.blk > h2,.hero h1'),art=el.matches('.hero-art,.pj-art');
    animate(el,[{opacity:0,transform:`translate3d(0,${art?28:title?32:18}px,0)${art?' scale(.97)':''}`},{opacity:1,transform:'translate3d(0,0,0) scale(1)'}],{
      duration:art?1100:title?950:780,delay:+el.dataset.fxDelay||0,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'
    });
  }
  function refresh() {
    if(!ready||viewMode!=='site')return;
    finishAnimations();resetPointer();
    revealObserver?.disconnect();sectionObserver?.disconnect();sceneObserver?.disconnect();resizeObserver?.disconnect();scenes.clear();
    if(window.Bg3D)Bg3D.setLabels();
    hero=$('#hero');header=$('#topbar');
    revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){revealObserver.unobserve(entry.target);reveal(entry.target);}}),{threshold:.06,rootMargin:'0px 0px -28px 0px'});
    $$('.hero-txt > *, .hero-art, .section-index, .blk > h2, .section-intro, .pj-txt, .pj-art, .experience-card, .about-layout, .tech-group, #education .card, #contact .card, .proof-band p').forEach(el=>{
      const siblings=[...el.parentElement.children];el.dataset.fxDelay=Math.min(siblings.indexOf(el)*65,260);revealObserver.observe(el);
    });
    sectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const id=entry.target.id;
      if(id)$$('[data-spy]').forEach(a=>{const active=a.dataset.spy===id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
      if(window.Bg3D){Bg3D.setFocus(entry.target.dataset.project||(id==='techs'?'techs':id==='contact'?'all':null));Bg3D.setSide(id==='hero'?.77:.86);}
    }),{rootMargin:'-16% 0px -48% 0px',threshold:0});
    $$('#hero,#projects,#experience,#about,#techs,#education,#contact,.pj').forEach(el=>{if(el.classList.contains('pj'))el.dataset.project=el.querySelector('[data-open]').dataset.open;sectionObserver.observe(el);});
    sceneObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)scenes.add(entry.target);else scenes.delete(entry.target);});scheduleScroll();},{rootMargin:'160px 0px',threshold:0});
    $$('.pj').forEach(el=>sceneObserver.observe(el));
    resizeObserver=new ResizeObserver(scheduleScroll);resizeObserver.observe($('#site'));
    $$('details.case-study').forEach(detail=>detail.addEventListener('toggle',()=>{
      if(detail.open)animate(detail.querySelector('.case-grid'),[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:'cubic-bezier(.16,1,.3,1)'});
      scheduleScroll();
    }));
    renderScroll();
  }
  function renderScroll() {
    scrollFrame=0;if(viewMode!=='site')return;
    const height=innerHeight,max=document.documentElement.scrollHeight-height;
    $('#progress').style.transform=`scaleX(${max>0?scrollY/max:0})`;
    $('#toTop').classList.toggle('show',scrollY>700);header?.classList.toggle('scrolled',scrollY>48);
    if(reduced()||document.hidden||document.body.classList.contains('noscroll'))return;
    const heroRect=hero.getBoundingClientRect(),heroProgress=clamp(-heroRect.top/Math.max(heroRect.height,1));
    hero.style.setProperty('--hero-y',`${(-heroProgress*(compact.matches?14:38)).toFixed(2)}px`);
    hero.style.setProperty('--hero-scale',(1-heroProgress*.035).toFixed(4));
    // Read scene positions first, then write transforms; avoid a layout read per frame write.
    const frames=[...scenes].map(el=>{const r=el.getBoundingClientRect();const progress=clamp((height-r.top)/(height+r.height));const distance=clamp((r.top+r.height/2-height/2)/height,-1,1);return {el,progress,distance};});
    frames.forEach(({el,progress,distance})=>{
      el.style.setProperty('--media-y',`${(distance*(compact.matches?12:36)).toFixed(2)}px`);
      el.style.setProperty('--media-scale',(.94+Math.sin(progress*Math.PI)*.06).toFixed(4));
      el.style.setProperty('--scene-light',(.03+Math.sin(progress*Math.PI)*.06).toFixed(3));
    });
  }
  function scheduleScroll() {if(!scrollFrame&&!document.hidden)scrollFrame=requestAnimationFrame(renderScroll);}
  function resetPointer() {
    if(pointerFrame)cancelAnimationFrame(pointerFrame);pointerFrame=0;pointer=null;
    if(lastArt){lastArt.style.removeProperty('--tilt-x');lastArt.style.removeProperty('--tilt-y');}lastArt=null;
    $('#cursor')?.classList.remove('visible','link');
  }
  function drawPointer() {
    pointerFrame=0;
    if(!pointer||reduced()||!fine.matches||document.hidden||document.body.classList.contains('noscroll')){resetPointer();return;}
    const {x,y}=pointer,target=document.elementFromPoint(x,y),cursor=$('#cursor');
    if(!(target instanceof Element)){resetPointer();return;}
    // Position only the parent. Child scaling never changes screen coordinates.
    cursor.style.transform=`translate3d(${x}px,${y}px,0)`;
    const editable=target.closest('input,textarea,select,[contenteditable="true"]');
    const interactive=!editable&&target.closest('a,button,summary,.pj-art');
    cursor.classList.toggle('visible',!!interactive);cursor.classList.toggle('link',!!target.closest('a,button,summary'));
    const art=target.closest('.pj-art');
    if(lastArt&&lastArt!==art){lastArt.style.removeProperty('--tilt-x');lastArt.style.removeProperty('--tilt-y');}lastArt=art;
    if(art){const r=art.getBoundingClientRect();art.style.setProperty('--tilt-x',`${(-((y-r.top)/r.height-.5)*3).toFixed(2)}deg`);art.style.setProperty('--tilt-y',`${(((x-r.left)/r.width-.5)*4).toFixed(2)}deg`);}
    const spot=target.closest('.pj,.tech-group,.card');if(spot){const r=spot.getBoundingClientRect();spot.style.setProperty('--sx',`${x-r.x}px`);spot.style.setProperty('--sy',`${y-r.y}px`);}
  }
  function queuePointer(e) {if(viewMode!=='site'||e.pointerType==='touch'||reduced()||!fine.matches)return;pointer={x:e.clientX,y:e.clientY};if(!pointerFrame)pointerFrame=requestAnimationFrame(drawPointer);}
  function ripple(e) {
    const button=e.target.closest('.pbtn');if(!button||reduced())return;
    const r=button.getBoundingClientRect(),dot=document.createElement('span');dot.className='fx-ripple';dot.style.left=`${e.clientX-r.x}px`;dot.style.top=`${e.clientY-r.y}px`;dot.setAttribute('aria-hidden','true');button.appendChild(dot);
    animate(dot,[{transform:'translate(-50%,-50%) scale(0)',opacity:.12},{transform:'translate(-50%,-50%) scale(1)',opacity:0}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});setTimeout(()=>dot.remove(),700);
  }
  function confetti(el) {
    if(reduced()||document.hidden)return;
    // A short success glint keeps the existing feedback with a quieter finish.
    animate(el,[{boxShadow:'0 0 0 0 transparent'},{boxShadow:'0 0 0 6px color-mix(in srgb, var(--mg) 18%, transparent)',offset:.45},{boxShadow:'0 0 0 12px transparent'}],{duration:750,easing:'ease-out'});
  }
  function syncBackground() {if(ready&&window.Bg3D)Bg3D.setActive(viewMode==='site'&&!document.hidden&&!document.body.classList.contains('mode-studio')&&!document.body.classList.contains('noscroll'));}
  function setReduced(on) {
    if(on){finishAnimations();resetPointer();hero?.style.removeProperty('--hero-y');hero?.style.removeProperty('--hero-scale');$$('.pj').forEach(el=>{el.style.removeProperty('--media-y');el.style.removeProperty('--media-scale');});}
    if(ready&&window.Bg3D)Bg3D.setReduced(on);if(!on&&ready)scheduleScroll();
  }
  function init() {
    ready=true;
    if(window.Bg3D){Bg3D.init();Bg3D.setTheme(document.documentElement.dataset.theme);Bg3D.setReduced(reduced());syncBackground();}
    refresh();
    addEventListener('scroll',()=>{resetPointer();scheduleScroll();},{passive:true});addEventListener('resize',()=>{resetPointer();scheduleScroll();},{passive:true});
    addEventListener('pointermove',queuePointer,{passive:true});document.addEventListener('pointerleave',resetPointer);document.addEventListener('pointercancel',resetPointer);addEventListener('blur',resetPointer);
    document.addEventListener('pointerdown',ripple,{passive:true});document.addEventListener('keydown',e=>{if(e.key==='Tab')resetPointer();});fine.addEventListener('change',resetPointer);compact.addEventListener('change',scheduleScroll);
    document.addEventListener('visibilitychange',()=>{syncBackground();if(document.hidden){finishAnimations();resetPointer();if(scrollFrame)cancelAnimationFrame(scrollFrame);scrollFrame=0;}else scheduleScroll();});
    new MutationObserver(()=>{syncBackground();if(document.body.classList.contains('noscroll'))resetPointer();else scheduleScroll();}).observe(document.body,{attributes:true,attributeFilter:['class']});
    $('#toTop').onclick=()=>{scrollTo({top:0,behavior:reduced()?'auto':'smooth'});$('.brand').focus({preventScroll:true});};
  }
  function setMode(mode){viewMode=mode;if(mode==='studio'){finishAnimations();resetPointer();revealObserver?.disconnect();sectionObserver?.disconnect();sceneObserver?.disconnect();if(scrollFrame)cancelAnimationFrame(scrollFrame);scrollFrame=0;}else refresh();syncBackground();}
  return {init,refresh,setReduced,confetti,setMode};
})();
