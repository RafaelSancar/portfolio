/* Abertura curta, pulável e acessível; não depende do carregamento das novas poses. */
window.StudioIntro = (function () {
  const duration=8000;
  let dialog,options,timer=0,exitTimer=0,raf=0,start=0,last=0,elapsed=0,remaining=duration,leaving=false;
  let gesture=null,pending=null,autoIndex=0,lean=0,leanTarget=0,wasReduced=false;
  const hero=new Image(),poses={wave:new Image(),present:new Image(),celebrate:new Image()},L=()=>App.lang()==='pt',reduced=()=>App.reduced(),$=s=>document.querySelector(s);
  const range=n=>Array.from({length:n},(_,i)=>i);
  // Every gesture returns to a resting pose before the next starts.
  const clips={
    wave:{frames:range(16),fps:10},
    present:{frames:[...range(12),11,11,11,...range(12).reverse()],fps:12},
    celebrate:{frames:range(16),fps:11}
  };
  const sequence=[{at:.55,name:'wave'},{at:2.6,name:'present'},{at:5.3,name:'celebrate'}];
  function renewTimer(){
    clearTimeout(timer);remaining=duration;start=performance.now();
    if(!reduced())timer=setTimeout(()=>finish(),remaining);
    const line=$('.intro-timeline i');line.getAnimations().forEach(a=>a.cancel());
    if(!reduced())line.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration,fill:'both'});
  }
  function react(name,manual=false){
    if(!dialog.open||reduced()||leaving||!clips[name])return;
    if(manual){autoIndex=sequence.length;renewTimer();}
    if(gesture)pending=name;else gesture={name,start:elapsed};
  }
  function seen(){try{return sessionStorage.getItem('studio-intro-seen')==='1';}catch(e){return false;}}
  function labels(){
    $('#intro-skip').textContent=L()?'Pular intro ↗':'Skip intro ↗';$('#intro-kicker').innerHTML=L()?'<span></span> UM ESPAÇO PARA IDEIAS REAIS':'<span></span> A SPACE FOR REAL IDEAS';
    $('#intro-title').innerHTML=L()?'Bem-vindo ao<br>meu <em>estúdio.</em>':'Welcome to<br>my <em>studio.</em>';
    $('#intro-description').textContent=L()?'Sou Rafael Carvalho, desenvolvedor full stack. Explore um pouco do meu mundo e conheça as ideias que transformei em produtos.':'I’m Rafael Carvalho, a full stack developer. Explore a little of my world and discover the ideas I turned into products.';
    $('#intro-enter').textContent=L()?'Entrar no estúdio →':'Enter the studio →';$('#intro-portfolio').textContent=L()?'Ir para o portfólio':'Go to portfolio';
    $('#intro-instructions').textContent=L()?'Role para caminhar. Clique para descobrir.':'Scroll to walk. Click to discover.';
    $('#intro-room-label').textContent=L()?'01 / 06 — O PONTO DE PARTIDA':'01 / 06 — THE STARTING POINT';
    $('#intro-name-role').textContent=L()?'DESENVOLVEDOR FULL STACK':'FULL STACK DEVELOPER';
    $('#intro-projects-label').textContent=L()?'PROJETOS QUE VOCÊ VAI ENCONTRAR':'PROJECTS YOU’LL DISCOVER';
    $('#intro-art-caption').textContent=L()?'Um estúdio. Muitas possibilidades.':'One studio. Many possibilities.';
    $('#intro-motion').textContent=reduced()?(L()?'Ativar animações':'Enable animations'):(L()?'Reduzir movimento':'Reduce motion');
    $('#intro-motion').setAttribute('aria-pressed',String(reduced()));
    $('#intro-greet').textContent=L()?'Acenar ↗':'Say hello ↗';$('#intro-greet').hidden=reduced();
    $('#intro-present').textContent=L()?'Apresentar ↗':'Present ↗';
    $('#intro-celebrate').textContent=L()?'Comemorar ↗':'Celebrate ↗';
    $('.intro-character-actions').hidden=reduced();
    $('.intro-character-actions').ariaLabel=L()?'Gestos do personagem':'Character gestures';
    const canvas=$('#intro-character');canvas.ariaLabel=L()?'Rafael: clique ou pressione Enter para uma reação.':'Rafael: click or press Enter for a reaction.';
    canvas.tabIndex=reduced()?-1:0;canvas.setAttribute('role',reduced()?'img':'button');
    dialog.classList.toggle('intro-static',reduced());
    if(reduced())$('.intro-timeline i').getAnimations().forEach(a=>a.cancel());
    $('#intro-auto').textContent=reduced()?(L()?'Explore no seu ritmo.':'Explore at your own pace.'):(L()?'O passeio começa em instantes.':'Your tour starts in a moment.');
    dialog.ariaLabel=L()?'Introdução ao estúdio de Rafael':'Introduction to Rafael’s studio';
  }
  function draw(now){
    raf=0;if(!dialog.open||document.hidden)return;
    if(!reduced())elapsed+=Math.min(.05,(now-last)/1000||0);last=now;
    if(!reduced()){
      if(autoIndex<sequence.length&&elapsed>=sequence[autoIndex].at)react(sequence[autoIndex++].name);
      if(gesture&&elapsed-gesture.start>=clips[gesture.name].frames.length/clips[gesture.name].fps){gesture=null;if(pending){const name=pending;pending=null;gesture={name,start:elapsed};}}
    }
    const canvas=$('#intro-character'),g=canvas.getContext('2d'),motion=reduced()?'idle':gesture?.name||'idle';
    if($('.intro-character-actions').dataset.motion!==motion)$('.intro-character-actions').dataset.motion=motion;
    g.clearRect(0,0,420,700);
    if(poses.wave.naturalWidth&&!reduced()){
      const name=gesture?.name||'wave',atlas=STUDIO_MOTION[name],clip=clips[name],step=gesture?Math.min(clip.frames.length-1,Math.floor((elapsed-gesture.start)*clip.fps)):0;
      const image=poses[name].naturalWidth?poses[name]:poses.wave,frames=poses[name].naturalWidth?atlas.frames:STUDIO_MOTION.wave.frames;
      const f=frames[poses[name].naturalWidth?clip.frames[step]:0],scale=625/(f.referenceHeight||atlas.referenceHeight);
      lean+=(leanTarget-lean)*.1;
      // Tiny weight shifts and breathing pivot at the feet, never move the baseline.
      const breath=Math.sin(elapsed*2.2)*.0025,sway=Math.sin(elapsed*1.1)*.002+lean*.006;
      g.save();g.translate(210,680);g.rotate(sway);g.scale(1,1+breath);
      g.drawImage(image,f.x,f.y,f.w,f.h,-f.anchorX*scale,-f.baseline*scale,f.w*scale,f.h*scale);g.restore();
    }else if(hero.naturalWidth){const height=625,width=height*hero.naturalWidth/hero.naturalHeight;g.drawImage(hero,210-width/2,680-height,width,height);}
    if(!reduced())raf=requestAnimationFrame(draw);
  }
  function animate(){if(!raf&&dialog.open&&!document.hidden)raf=requestAnimationFrame(draw);}
  function finish(destination='studio',immediate=false){
    if(!dialog.open||leaving)return;leaving=true;clearTimeout(timer);if(raf)cancelAnimationFrame(raf);raf=0;
    try{sessionStorage.setItem('studio-intro-seen','1');}catch(e){}
    const close=()=>{clearTimeout(exitTimer);dialog.close();dialog.classList.remove('intro-leaving');document.body.classList.remove('intro-playing');leaving=false;if(destination==='portfolio')options.onPortfolio();else options.onEnter();};
    if(!immediate&&!reduced()&&destination==='studio'){dialog.classList.add('intro-leaving');exitTimer=setTimeout(close,360);}else close();
  }
  function show(){
    if(dialog.open)return;clearTimeout(timer);remaining=duration;start=performance.now();last=start;elapsed=0;gesture=pending=null;autoIndex=0;lean=leanTarget=0;wasReduced=reduced();labels();dialog.classList.remove('intro-leaving');
    document.body.classList.add('intro-playing');dialog.showModal();$('#intro-enter').focus({preventScroll:true});
    if(!reduced())timer=setTimeout(()=>finish(),remaining);animate();
  }
  function init(callbacks){
    options=callbacks;dialog=document.createElement('dialog');dialog.id='studio-intro';
    dialog.innerHTML=`<div class="intro-grain" aria-hidden="true"></div><div class="intro-top"><span class="intro-brand">&lt;RC/&gt; <b>Rafael Carvalho</b></span><button id="intro-skip"></button></div><div class="intro-layout"><div class="intro-copy"><p id="intro-kicker"></p><h1 id="intro-title"></h1><p id="intro-description"></p><div class="intro-actions"><button id="intro-enter" class="pbtn"></button><button id="intro-portfolio" class="intro-text-button"></button></div><p id="intro-instructions"></p><div class="intro-projects"><p id="intro-projects-label"></p><ul><li><i></i>Uply<span>01</span></li><li><i></i>DFinanceiro<span>02</span></li><li><i></i>Nous<span>03</span></li></ul></div></div><div class="intro-art"><span id="intro-room-label"></span><div class="intro-room" aria-hidden="true"><div class="intro-window"><i></i><i></i><i></i><i></i></div><div class="intro-room-shelf"><i></i><i></i><i></i><i></i></div><div class="intro-room-monitor"><span>&lt;RC/&gt;</span><i></i><i></i><i></i></div><div class="intro-room-desk"></div><div class="intro-room-light"></div><div class="intro-room-floor"></div></div><canvas id="intro-character" width="420" height="700" aria-hidden="true"></canvas><div class="intro-identity"><span>RAFAEL CARVALHO</span><b id="intro-name-role"></b></div><span class="intro-tag">WEB <i>+</i> MOBILE</span><p id="intro-art-caption"></p></div></div><div class="intro-bottom"><span>PORTFOLIO <i>/</i> RAFAEL CARVALHO</span><span id="intro-auto"></span><div class="intro-timeline" aria-hidden="true"><i></i></div></div>`;
    dialog.setAttribute('aria-labelledby','intro-title');dialog.setAttribute('aria-describedby','intro-description');
    dialog.querySelector('.intro-top').insertAdjacentHTML('beforeend','<button id="intro-motion"></button>');
    dialog.querySelector('.intro-art').insertAdjacentHTML('beforeend','<div class="intro-motes" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="intro-character-actions" role="group"><button id="intro-greet" data-intro-gesture="wave"></button><button id="intro-present" data-intro-gesture="present"></button><button id="intro-celebrate" data-intro-gesture="celebrate"></button></div>');
    dialog.querySelector('#intro-character').removeAttribute('aria-hidden');
    document.body.appendChild(dialog);labels();$('#intro-skip').onclick=()=>finish('studio',true);$('#intro-enter').onclick=()=>finish();$('#intro-portfolio').onclick=()=>finish('portfolio',true);
    $('#intro-motion').onclick=()=>$('#btnMotion').click();
    $('.intro-character-actions').addEventListener('click',e=>{const button=e.target.closest('[data-intro-gesture]');if(button)react(button.dataset.introGesture,true);});
    const canvas=$('#intro-character');let reaction=0;
    canvas.onclick=()=>react(['celebrate','wave','present'][reaction++%3],true);
    canvas.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();canvas.click();}};
    $('.intro-art').addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduced())return;const r=canvas.getBoundingClientRect();leanTarget=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2)));});
    $('.intro-art').addEventListener('pointerleave',()=>leanTarget=0);
    dialog.addEventListener('cancel',e=>{e.preventDefault();finish('studio',true);});hero.onload=animate;for(const name of Object.keys(poses)){poses[name].onload=animate;poses[name].src=STUDIO_MOTION[name].source;}hero.src='assets/rafael-game/hero-640.webp';
    document.addEventListener('visibilitychange',()=>{if(!dialog.open||leaving)return;dialog.classList.toggle('intro-paused',document.hidden);if(document.hidden){clearTimeout(timer);remaining=Math.max(0,remaining-(performance.now()-start));if(raf)cancelAnimationFrame(raf);raf=0;}else{last=start=performance.now();if(!reduced())timer=setTimeout(()=>finish(),remaining);animate();}});
    $('#btnLang').addEventListener('click',labels);
    new MutationObserver(()=>{if(!dialog.open||leaving)return;clearTimeout(timer);if(raf)cancelAnimationFrame(raf);raf=0;if(reduced()!==wasReduced){gesture=pending=null;autoIndex=sequence.length;lean=leanTarget=0;wasReduced=reduced();if(!reduced())react('wave');}labels();if(!reduced()){last=start=performance.now();timer=setTimeout(()=>finish(),remaining);}animate();}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  }
  return {init,show,finish,get active(){return !!dialog?.open;},get seen(){return seen();},get motion(){return reduced()?'idle':gesture?.name||'idle';}};
})();
