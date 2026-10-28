/* Recover transient image failures without leaving the character invisible. */
window.CharacterAssets = (() => {
  const heroSources=['assets/rafael-game/hero-640.webp','assets/rafael-game/hero.webp','assets/rafael-game/hero.png'];
  const ready=image=>!!(image?.complete&&image.naturalWidth&&image.naturalHeight);
  function load(image,sources,onReady=()=>{},onError=()=>{}){
    const queue=[...new Set(sources)].flatMap(src=>[src,src+(src.includes('?')?'&':'?')+'character-retry=1']);
    let index=0,timer=0;
    image.onload=()=>{clearTimeout(timer);if(ready(image))onReady();else retry();};
    image.onerror=retry;
    function retry(){
      clearTimeout(timer);
      if(index>=queue.length){onError();return;}
      timer=setTimeout(next,250);
    }
    function next(){image.src=queue[index++];}
    next();
  }
  function attachHero(image){
    if(!image)return;
    function recover(){
      const selected=image.currentSrc||image.src;
      // A picture source overrides img.src, including after a failed request.
      image.closest('picture')?.querySelectorAll('source').forEach(source=>source.remove());
      load(image,[selected,...heroSources]);
    }
    image.addEventListener('error',recover,{once:true});
    if(image.complete&&!ready(image)){
      image.removeEventListener('error',recover);recover();
    }
  }
  return {load,ready,heroSources,attachHero};
})();
