/* Cenário editável em Canvas: madeira, plantas, monitores e iluminação quente. */
window.StudioWorld = function (canvas, character, screens, motionImages) {
  const g=canvas.getContext('2d'),{walk,run}=motionImages;
  const isolatedFrames=new Map();
  // Rectangles overlap at the feet. Keep only the character connected to each
  // pose, so a neighbouring shoe can never enter the rendered frame.
  function isolatedFrame(name,step){
    const key=name+step;if(isolatedFrames.has(key))return isolatedFrames.get(key);
    const f=STUDIO_MOTION[name].frames[step],surface=document.createElement('canvas');surface.width=f.w;surface.height=f.h;
    const ctx=surface.getContext('2d',{willReadFrequently:true});ctx.drawImage(motionImages[name],f.x,f.y,f.w,f.h,0,0,f.w,f.h);
    const pixels=ctx.getImageData(0,0,f.w,f.h),data=pixels.data,n=f.w*f.h,labels=new Int32Array(n),queue=new Int32Array(n);let label=0,best=0,bestSize=0;
    const solid=new Uint8Array(n);
    for(let i=0;i<n;i++){const p=i*4,r=data[p],green=data[p+1],b=data[p+2];const fringe=(b>170&&b>r*2.4&&b>green*1.7)||(green>170&&b>170&&r<green*.7);solid[i]=data[p+3]>32&&!fringe?1:0;}
    for(let i=0;i<n;i++){
      if(!solid[i]||labels[i])continue;label++;let head=0,tail=1;queue[0]=i;labels[i]=label;
      while(head<tail){const p=queue[head++],x=p%f.w;for(const next of [x>0?p-1:-1,x<f.w-1?p+1:-1,p-f.w,p+f.w]){if(next>=0&&next<n&&solid[next]&&!labels[next]){labels[next]=label;queue[tail++]=next;}}}
      if(tail>bestSize){bestSize=tail;best=label;}
    }
    for(let i=0;i<n;i++){
      let keep=labels[i]===best;
      if(!keep&&solid[i]){const x=i%f.w;for(let dy=-1;dy<=1&&!keep;dy++)for(let dx=-1;dx<=1;dx++){const next=i+dy*f.w+dx;if(x+dx>=0&&x+dx<f.w&&next>=0&&next<n&&labels[next]===best)keep=true;}}
      if(!keep)data[i*4+3]=0;
    }
    ctx.putImageData(pixels,0,0);isolatedFrames.set(key,surface);return surface;
  }
  let dark=true;
  const night={'#eee6d7':'#141e25','#f3eadb':'#1d292e','#d5b185':'#302c27','#e7ddcb':'#202b31','#eee4d2':'#253035','#d7c6ab':'#1b252a','#b99a75':'#6b5540','#d7b58b':'#57432f','#c39669':'#443426','#af815b':'#30271f','#a88c6a':'#53483a','#ad9270':'#594a38','#8d755a':'#40372e','#f5eddf':'#283530','#827257':'#c3bd9c','#bd956c':'#8c6a47','#e0b88a':'#ad8658','#a98058':'#715237','#b79670':'#67523d','#c9ab84':'#796249','#837259':'#af9471','#4a4a43':'#343c3b','#192d31':'#0c171c','#e9deca':'#4b5048','#b48b64':'#6f5842','#c5d5cb':'#101d32','#f5dbb5':'#28334b','#e7b88c':'#775344','#fff6d9':'#f6dfb4','#6d6150':'#d0c3a5','#8c7d66':'#9ca993','#67583f':'#c9c1a1','#a37f5e':'#544331','#b99a75':'#6b5540','#d7b58e':'#8c6b48','#ece3d0':'#c9b995','#6b7f6e':'#3f5b4c','#919f8e':'#3e584b','#a2af9b':'#4f6a59','#7b8e7d':'#314b40','#8a9c87':'#46624f','#b0b8a2':'#56634c','#b6b69c':'#646348','#baa98d':'#6f5d44','#c9ad82':'#b48a58','#b28d64':'#775a3e','#eee4cd':'#283833','#655641':'#d0c7a7','#89a394':'#99b59b','#635144':'#b8b7a0'};
  const tone=c=>dark&&(typeof c==='string')?(night[c]||c):c;
  const rr=(x,y,w,h,r,c)=>{g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=tone(c);g.fill();};
  const poly=(points,c)=>{g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=tone(c);g.fill();};
  const txt=(s,x,y,size=16,c='#635144',weight=600,align='left')=>{g.font=`${weight} ${size}px "Plus Jakarta Sans",sans-serif`;g.textAlign=align;g.fillStyle=tone(c);g.fillText(s,x,y);};
  const grad=(x,y,x2,y2,cs)=>{const a=g.createLinearGradient(x,y,x2,y2);cs.forEach((c,i)=>a.addColorStop(i/(cs.length-1),tone(c)));return a;};
  let time=0,camera=0;
  function plant(x,y,s=1){
    g.save();g.translate(x,y);g.scale(s,s);
    for(let i=0;i<8;i++){g.save();g.translate(0,-75);g.rotate((i-3.5)*.35+Math.sin(time*.8+i)*.018);g.fillStyle=i%2?'#48684b':dark?'#658363':'#6b8d61';g.beginPath();g.ellipse(0,-50,15,58,0,0,Math.PI*2);g.fill();g.restore();}
    poly([[-40,-77],[40,-77],[30,0],[-30,0]],grad(-40,0,40,0,['#bd7354','#e4a27c','#ae644a']));rr(-44,-87,88,16,5,'#d69c79');g.restore();
  }
  function windowView(x){
    g.save();g.beginPath();g.roundRect(x-225,-510,450,330,24);g.clip();g.fillStyle=grad(0,-510,0,-180,['#c5d5cb','#f5dbb5','#e7b88c']);g.fillRect(x-230,-510,460,330);
    g.fillStyle=tone('#fff6d9');g.beginPath();g.arc(x+130,-426,dark?25:35,0,Math.PI*2);g.fill();
    if(dark){g.fillStyle='#ede2ba';for(let i=0;i<22;i++){g.globalAlpha=.3+(i%3)*.16;g.fillRect(x-210+(i*97)%420,-495+(i*43)%145,1.6,1.6);}g.globalAlpha=1;}
    for(let i=0;i<12;i++){const bx=x-240+i*45+(camera*.025)%45,bh=40+(i*31)%125;g.fillStyle=dark?(i%2?'#14212b':'#1d2c36'):(i%2?'#9fae9f':'#b3b7a1');g.fillRect(bx,-180-bh,35,bh);for(let y=-180-bh+10;y<-190;y+=22){g.fillStyle=dark?((i+y)%3?'#c6a77588':'#657d7744'):'#e6d3ad';g.fillRect(bx+8,y,5,9);g.fillRect(bx+22,y,5,9);}}
    g.strokeStyle=dark?'#cddfef12':'#ffffff33';g.lineWidth=16;g.beginPath();g.moveTo(x-180,-500);g.lineTo(x+50,-190);g.stroke();
    g.restore();g.strokeStyle=tone('#e9deca');g.lineWidth=12;g.beginPath();g.roundRect(x-225,-510,450,330,24);g.stroke();g.fillStyle=tone('#e9deca');g.fillRect(x-5,-510,10,330);rr(x-242,-175,484,17,6,'#b48b64');
  }
  function pendant(x){
    g.strokeStyle='#6e6252';g.lineWidth=3;g.beginPath();g.moveTo(x,-1000);g.lineTo(x,-490);g.stroke();poly([[x-55,-490],[x+55,-490],[x+88,-440],[x-88,-440]],'#aa8962');rr(x-88,-444,176,8,4,'#f1d3a0');
    const a=g.createRadialGradient(x,-425,8,x,-250,370);a.addColorStop(0,'#ffe2a034');a.addColorStop(1,'#ffe2a000');g.fillStyle=a;g.fillRect(x-440,-450,880,550);
  }
  function rug(x,color){g.save();g.globalAlpha=.75;poly([[x-370,25],[x+320,25],[x+410,155],[x-440,155]],color);g.strokeStyle='#f3e6cf88';g.lineWidth=2;for(let j=0;j<4;j++){g.beginPath();g.moveTo(x-360-j*12,50+j*25);g.lineTo(x+333+j*18,50+j*25);g.stroke();}g.restore();}
  function mug(x,y){rr(x-16,y-35,32,35,6,'#eee0c8');g.strokeStyle='#eee0c8';g.lineWidth=5;g.beginPath();g.arc(x+19,y-19,10,-1.5,1.5);g.stroke();g.fillStyle='#71513a';g.beginPath();g.ellipse(x,y-33,13,3,0,0,Math.PI*2);g.fill();g.strokeStyle='#ffffff66';g.lineWidth=2;for(let i=0;i<2;i++){g.beginPath();g.moveTo(x-5+i*10,y-45);g.bezierCurveTo(x-15,y-65-Math.sin(time+i)*5,x+15,y-70,x,y-90);g.stroke();}}
  function books(x,y){for(let i=0;i<8;i++){const h=46+(i*19)%28;rr(x+i*15,y-h,12,h,2,['#a57753','#6e8e7a','#c6ad83','#8d9298'][i%4]);g.fillStyle='#e0cfac';g.fillRect(x+i*15+3,y-h+9,6,2);}}
  function desk(x,project){
    g.save();g.shadowColor='#51341f33';g.shadowBlur=20;g.fillStyle='#624c3a';g.beginPath();g.ellipse(x,22,290,26,0,0,Math.PI*2);g.fill();g.restore();
    rr(x-252,-200,12,204,4,'#4c514a');rr(x+224,-200,12,204,4,'#4c514a');poly([[x-280,-224],[x+257,-224],[x+295,-183],[x-310,-183]],grad(x,-224,x,-183,['#bd956c','#e0b88a']));rr(x-310,-183,605,13,3,'#a98058');
    if(dark){const glow=g.createRadialGradient(x+20,-325,30,x+20,-325,250);glow.addColorStop(0,'#90c9bc22');glow.addColorStop(1,'#90c9bc00');g.fillStyle=glow;g.fillRect(x-260,-560,560,430);}
    rr(x-145,-423,330,205,12,'#4a4a43');rr(x-136,-414,312,184,7,'#192d31');
    if(project&&screens[project.id]?.naturalWidth){g.save();g.beginPath();g.roundRect(x-131,-410,302,176,5);g.clip();g.drawImage(screens[project.id],x-131,-410,302,176);g.restore();}
    else {txt('<RC/>',x+20,-327,44,'#d3bd93',800,'center');txt('WEB  ·  MOBILE  ·  IDEAS',x+20,-288,11,'#a3b9b1',600,'center');}
    poly([[x-126,-190],[x+185,-190],[x+211,-145],[x-147,-145]],dark?'#233735':'#849386');
    rr(x+6,-216,20,29,3,'#6b6e65');rr(x-24,-191,80,8,4,'#6b6e65');poly([[x-95,-176],[x+112,-176],[x+131,-151],[x-107,-151]],dark?'#626f67':'#ccc7b7');for(let r=0;r<3;r++)for(let k=0;k<16;k++)rr(x-88+k*12,-173+r*7,9,4,1,dark?'#a4b3a0':'#a6a99f');
    rr(x+153,-176,25,22,11,dark?'#a5b5a2':'#d6d4c6');rr(x-282,-178,95,28,3,'#283c3b');rr(x-277,-175,85,3,1,'#cfb986');
    rr(x-288,-170,555,3,1,dark?'#e6b87888':'#d5bb85');
    mug(x+221,-187);books(x-264,-199);rr(x-240,-154,114,145,10,'#b79670');for(let i=0;i<3;i++){rr(x-230,-145+i*43,94,35,4,'#c9ab84');rr(x-195,-132+i*43,24,3,1,'#837259');}
  }
  function details(x,index,pt){
    // Small, stationary props give each stop its own purpose.
    rr(x-425,-385,178,9,3,'#a98058');books(x-412,-386);plant(x-269,-386,.27);
    if(index===0){rr(x+255,-450,117,93,5,'#b48b64');rr(x+262,-443,103,79,2,'#eee4cd');txt(pt?'FAÇA':'MAKE',x+313,-412,15,'#655641',800,'center');txt(pt?'ACONTECER.':'IT HAPPEN.',x+313,-388,12,'#655641',700,'center');}
    if(index===1){rr(x+137,-292,44,78,7,'#162b2c');rr(x+141,-286,36,66,4,'#d9e3d7');rr(x+147,-272,24,18,3,'#7d9d76');rr(x+147,-246,24,3,1,'#8d9a8c');rr(x+153,-213,12,16,2,'#6b6e65');}
    if(index===2){rr(x+253,-422,143,101,6,'#b48b64');rr(x+260,-415,129,87,3,'#eee4cd');for(let i=0;i<5;i++)rr(x+277+i*20,-348-i*9,12,12+i*9,2,['#7c9981','#9cb28f','#c6b27e'][i%3]);txt('DF',x+276,-393,11,'#655641',700);}
    if(index===3){rr(x+310,-180,93,181,8,'#18282b');for(let i=0;i<4;i++){rr(x+318,-170+i*40,77,32,4,'#304341');rr(x+326,-159+i*40,34,3,1,'#718275');rr(x+379,-159+i*40,4,4,2,'#bbd59d');}txt('NOUS',x+356,-192,10,'#827257',800,'center');}
    if(index===4){rr(x-390,-385,124,154,6,'#b48b64');rr(x-383,-378,110,140,3,'#eee4cd');txt('NOUS',x-328,-345,15,'#655641',800,'center');txt(pt?'IDEIA → PRODUTO':'IDEA → PRODUCT',x-328,-320,8,'#655641',600,'center');for(let i=0;i<3;i++){rr(x-368,-299+i*16,78-i*13,3,1,'#89a394');}}
    if(index===5){poly([[x+63,-146],[x+151,-146],[x+168,-19],[x+86,-19]],'#b48b64');g.strokeStyle='#d8c49a88';g.lineWidth=2;for(let i=0;i<6;i++){g.beginPath();g.moveTo(x+69+i*13,-140);g.lineTo(x+92+i*13,-25);g.stroke();}books(x-53,66);}
    if(index===0||index===5){rr(x+340,-292,7,291,3,'#6b6e65');rr(x+306,-2,76,9,4,'#4c514a');poly([[x+306,-354],[x+381,-354],[x+401,-286],[x+284,-286]],'#c9ad82');if(dark){const glow=g.createRadialGradient(x+343,-280,4,x+343,-250,170);glow.addColorStop(0,'#efc48b22');glow.addColorStop(1,'#efc48b00');g.fillStyle=glow;g.fillRect(x+170,-420,350,440);}}
  }
  function shelf(x,pt){rr(x-220,-420,440,420,12,'#a37f5e');rr(x-205,-405,410,390,5,'#b99a75');for(let i=0;i<3;i++){rr(x-205,-298+i*126,410,13,2,'#d7b58e');books(x-180,-299+i*126);books(x+30,-299+i*126);}txt(pt?'EXPERIÊNCIA & FORMAÇÃO':'EXPERIENCE & EDUCATION',x,-460,16,'#67583f',800,'center');rr(x+75,-370,100,62,5,'#ece3d0');txt('2024',x+125,-333,18,'#6b7f6e',800,'center');}
  function sofa(x,pt){
    rug(x,'#b0b8a2');rr(x-230,-170,420,135,32,'#919f8e');rr(x-216,-154,190,95,22,'#a2af9b');rr(x-16,-154,190,95,22,'#a2af9b');rr(x-230,-73,420,77,22,'#7b8e7d');rr(x-264,-126,56,139,19,'#8a9c87');rr(x+169,-126,56,139,19,'#8a9c87');rr(x-230,8,18,20,4,'#8a7156');rr(x+182,8,18,20,4,'#8a7156');g.save();g.translate(x-130,-140);g.rotate(-.15);rr(0,0,65,66,10,'#c9ad82');g.restore();rr(x-80,66,220,16,8,'#b99269');rr(x-60,82,9,46,3,'#7f6a52');rr(x+104,82,9,46,3,'#7f6a52');mug(x+70,67);
    rr(x-165,-437,330,215,12,'#b28d64');rr(x-151,-423,302,187,6,'#eee4cd');txt(pt?'VAMOS CONVERSAR?':'LET’S TALK?',x,-380,18,'#655641',800,'center');g.strokeStyle='#89a394';g.lineWidth=3;g.beginPath();g.roundRect(x-58,-346,116,71,7);g.stroke();g.beginPath();g.moveTo(x-58,-341);g.lineTo(x,-305);g.lineTo(x+58,-341);g.stroke();
  }
  function render(state,stations){
    const {W,H,DPR,K,floor,zoom,lift,characterX,moving,pointerX,pointerY,reduced,pt,walkPhase,walkBlend,direction,speed,gait,gesture,gestureProgress}=state;time=state.time;camera=state.camera;dark=state.theme==='dark';
    g.setTransform(DPR,0,0,DPR,0,0);g.clearRect(0,0,W,H);g.fillStyle=grad(0,0,0,H,['#eee6d7','#f3eadb','#d5b185']);g.fillRect(0,0,W,H);
    const z=K*zoom,ox=W/2-camera*z+pointerX,oy=floor+lift+pointerY;g.save();g.translate(ox,oy);g.scale(z,z);
    const min=camera-W/z/2-600,max=camera+W/z/2+600;g.fillStyle=grad(0,-650,0,0,['#e7ddcb','#eee4d2','#d7c6ab']);g.fillRect(min,-1500,max-min,1500);
    for(let x=Math.floor(min/90)*90;x<max;x+=90){g.strokeStyle=dark?'#79918c12':'#c3b69c33';g.lineWidth=1;g.beginPath();g.moveTo(x,-650);g.lineTo(x,0);g.stroke();}
    rr(min,-20,max-min,20,0,'#b99a75');g.fillStyle=grad(0,0,0,450,['#d7b58b','#c39669','#af815b']);g.fillRect(min,0,max-min,1500);
    for(let row=0;row<12;row++){const y=row*40;g.strokeStyle=dark?'#b98e5826':'#956b4350';g.lineWidth=1;g.beginPath();g.moveTo(min,y);g.lineTo(max,y);g.stroke();for(let x=Math.floor(min/190)*190;x<max;x+=190){const sx=x+(row%2)*95;g.beginPath();g.moveTo(sx,y);g.lineTo(sx+10,y+40);g.stroke();}}
    rr(min,-570,max-min,30,0,'#a88c6a');stations.forEach((s,i)=>{if(s.x+650<min||s.x-650>max)return;windowView(s.x-90);pendant(s.x+70);plant(s.x+430,0,.95);plant(s.x-490,0,.65);if(i<4){rug(s.x,i%2?'#baa98d':'#b6b69c');desk(s.x,i===0?null:DATA.projects.find(p=>p.id===s.id));}else if(i===4)shelf(s.x,pt);else sofa(s.x,pt);details(s.x,i,pt);if(i<5){rr(s.x+580,-540,24,542,4,'#ad9270');rr(s.x+573,-22,38,24,3,'#8d755a');}rr(s.x-160,-525,320,38,5,'#f5eddf');txt(i===0?(pt?'BEM-VINDO AO MEU ESTÚDIO':'WELCOME TO MY STUDIO'):s.name[pt?0:1].toUpperCase(),s.x,-500,12,'#827257',800,'center');});
    const bob=reduced?0:Math.sin(time*(moving?9:1.5))*(moving?1:.6),chH=360,chW=chH*(character.naturalWidth/character.naturalHeight||.56);g.fillStyle='#513c2838';g.beginPath();g.ellipse(characterX,65,chW*.42,12,0,0,Math.PI*2);g.fill();const fallback=Object.keys(motionImages).find(name=>CharacterAssets.ready(motionImages[name]));if(CharacterAssets.ready(character)||fallback){
      const action=gesture&&CharacterAssets.ready(motionImages[gesture])&&!reduced;
      const sprint=gait==='run'&&CharacterAssets.ready(run)&&!reduced;
      const walking=CharacterAssets.ready(walk)&&!reduced&&walkBlend>.12;
      g.save();g.translate(characterX,66+bob);
      if(action||walking||!CharacterAssets.ready(character)){
        const name=action?gesture:walking?(sprint?'run':'walk'):fallback,atlas=STUDIO_MOTION[name];
        const raw=action?Math.floor(gestureProgress*(atlas.fps||12)):walking?Math.floor((walkPhase%1)*atlas.frames.length):0;
        const step=action?Math.min(atlas.frames.length-1,raw):raw%atlas.frames.length;
        const f=atlas.frames[Math.max(0,step)],scale=chH/(f.referenceHeight||atlas.referenceHeight);
        if(!action&&direction<0)g.scale(-1,1);
        if(!atlas.isolated&&(name==='run'||name==='walk'))g.drawImage(isolatedFrame(name,Math.max(0,step)),-f.anchorX*scale,-f.baseline*scale,f.w*scale,f.h*scale);
        else g.drawImage(motionImages[name],f.x,f.y,f.w,f.h,-f.anchorX*scale,-f.baseline*scale,f.w*scale,f.h*scale);
      }else g.drawImage(character,-chW/2,-chH,chW,chH);
      g.restore();
    }
    if(!reduced){g.fillStyle='#fff6df';for(let i=0;i<12;i++){g.globalAlpha=.2+Math.sin(time+i)*.09;g.beginPath();g.arc(camera-700+(i*143)%1400,-430+((i*97+time*9)%440),1.8,0,Math.PI*2);g.fill();}g.globalAlpha=1;}g.restore();return {ox,oy,z};
  }
  return {render};
};
