/* Jogo local: nenhuma biblioteca, imagem, fonte ou serviço remoto. */
'use strict';
(() => {
const canvas=document.getElementById('game'), ctx=canvas.getContext('2d',{alpha:false});
const caption=document.getElementById('caption');
const W=1600,H=900;
const names=['Ryder','Chase','Marshall','Skye','Rocky','Rubble','Zuma'];
const colors=['#bc3544','#275ca8','#d84b3c','#bd4888','#348454','#d6a31d','#df752d'];
const missions=['Farol','Formas e trânsito','Cores e números','Vogais voando','Praia e reciclagem','Blocos e pedrinhas','Memória no mar'];
const shapes=['circle','square','triangle','star'];
let catalog={};
const catalogReady=fetch('catalog.json').then(r=>{if(!r.ok)throw Error('Catálogo');return r.json();}).then(data=>{for(const entry of data.entries)catalog[entry.id]=entry;}).catch(()=>{});

class AudioGuide {
 constructor(){this.context=null;this.cache=new Map();this.tail=Promise.resolve();this.epoch=0;this.last='Ryder_instruction';this.muted=false;this.active=null;this.pendingRepeat=false;this.speaking=false;}
 unlock(){
  if(!this.context){
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
   this.context=new AC();this.master=this.context.createGain();this.master.connect(this.context.destination);
   this.music=this.context.createGain();this.music.gain.value=.32;this.music.connect(this.master);
   // Melodia suave sintetizada; sem arquivo nem dependência de rede.
   const rate=this.context.sampleRate,buffer=this.context.createBuffer(1,rate*8,rate),data=buffer.getChannelData(0);
   const notes=[261.63,329.63,392,329.63,293.66,349.23,392,293.66,261.63,329.63,440,392,349.23,329.63,293.66,261.63];
   for(let i=0;i<data.length;i++){const t=i/rate,beat=t%.5;data[i]=Math.sin(2*Math.PI*notes[Math.floor(t*2)%notes.length]*t)*Math.sin(Math.PI*beat/.5)*.045;}
   const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.music);source.start();
  }
  if(this.context.state==='suspended')this.context.resume().catch(()=>{});
 }
 async load(id){
  if(this.cache.has(id))return this.cache.get(id);
  const task=fetch('audio/'+id+'.wav').then(r=>{if(!r.ok)throw Error('WAV ausente');return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b));
  this.cache.set(id,task);try{return await task;}catch(e){this.cache.delete(id);throw e;}
 }
 say(id,remember=false){
  if(remember)this.last=id;
  const epoch=this.epoch;
  const operation=async()=>{
   await catalogReady;if(epoch!==this.epoch)return;
   const entry=catalog[id];caption.textContent=entry?entry.text:'Vamos tentar juntos, com calma!';
   caption.style.borderLeftColor=colors[Math.max(0,names.indexOf(entry ? entry.speaker : ''))];
   if(!this.context)return;
   this.speaking=true;this.music.gain.setTargetAtTime(.045,this.context.currentTime,.18);
   try{
    let buffer;try{buffer=await this.load(id);}catch(e){this.effect('gentle');return;}
    if(epoch!==this.epoch)return;
    await new Promise(resolve=>{const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.master);source.onended=resolve;this.active=source;source.start();});
   }finally{if(epoch===this.epoch){this.active=null;this.speaking=false;this.music.gain.setTargetAtTime(.32,this.context.currentTime,.3);}}
  };
  this.tail=this.tail.catch(()=>{}).then(operation);return this.tail;
 }
 repeat(){if(this.pendingRepeat)return;this.pendingRepeat=true;this.say(this.last).finally(()=>{this.pendingRepeat=false;});}
 cancel(){this.epoch++;if(this.active){try{this.active.stop();}catch(e){}this.active=null;}this.tail=Promise.resolve();this.speaking=false;this.pendingRepeat=false;if(this.music)this.music.gain.setTargetAtTime(.32,this.context.currentTime,.2);}
 mute(){this.muted=!this.muted;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:1,this.context.currentTime,.08);}
 effect(type){
  if(!this.context)return;const c=this.context;
  if(type==='chew'){
   const b=c.createBuffer(1,c.sampleRate*.6,c.sampleRate),d=b.getChannelData(0);
   for(let i=0;i<d.length;i++){const t=i/c.sampleRate;d[i]=(Math.random()*2-1)*Math.exp(-(t%.2)*40)*.11;}
   const s=c.createBufferSource();s.buffer=b;s.connect(this.master);s.start();
  }
  const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.setValueAtTime(type==='happy'?430:520,c.currentTime);osc.frequency.exponentialRampToValueAtTime(type==='happy'?650:390,c.currentTime+.25);gain.gain.setValueAtTime(.045,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+.4);osc.connect(gain);gain.connect(this.master);osc.start();osc.stop(c.currentTime+.42);
 }
}
const audio=new AudioGuide();
const state={phase:'hub',pup:0,progress:0,busy:false,items:[],targets:[],first:null,stage:0,helicopter:{x:180,y:350},reward:false,stars:[],water:[],session:0};
let buttons=[],drag=null,pending=null,lastTime=0,view={scale:1,x:0,y:0},hintAt=0;
function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);view.scale=Math.min(canvas.width/W,canvas.height/H);view.x=(canvas.width-W*view.scale)/2;view.y=(canvas.height-H*view.scale)/2;}
window.addEventListener('resize',resize);resize();
function label(text,x,y,size=32,color='#20394c'){ctx.fillStyle=color;ctx.font=`bold ${size}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,y);}
function round(x,y,w,h,color,r=20){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.fill();}
function shape(type,x,y,size,color){ctx.fillStyle=color;ctx.beginPath();if(type==='circle')ctx.arc(x,y,size/2,0,Math.PI*2);else if(type==='triangle'){ctx.moveTo(x,y-size/2);ctx.lineTo(x+size/2,y+size/2);ctx.lineTo(x-size/2,y+size/2);}else if(type==='star'){for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2,r=size*(i%2?.23:.5);let px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}}else ctx.rect(x-size/2,y-size/2,size,size);ctx.closePath();ctx.fill();}
function button(text,x,y,w,h,color,action){round(x-w/2,y-h/2,w,h,color);const rgb=parseInt(color.slice(1),16),light=((rgb>>16)*.2126+((rgb>>8)&255)*.7152+(rgb&255)*.0722)>155;label(text,x,y,28,light?'#20394c':'#fff');buttons.push({x,y,w,h,action});}
function inside(p,o){return Math.abs(p.x-o.x)<(o.w||o.size||150)/2&&Math.abs(p.y-o.y)<(o.h||o.size||150)/2;}
function portrait(p,x,y,size=120,mouth=false){
 shape('circle',x,y,size,colors[p]);
 if(p!==0){ctx.fillStyle='#7c5032';ctx.beginPath();ctx.ellipse(x-size*.32,y,18,size*.28,.3,0,7);ctx.ellipse(x+size*.32,y,18,size*.28,-.3,0,7);ctx.fill();}
 shape('circle',x,y,size*.72,p===2?'#fff8ed':'#eac69b');
 shape('circle',x-size*.13,y-size*.03,size*.065,'#273443');shape('circle',x+size*.13,y-size*.03,size*.065,'#273443');
 shape('triangle',x,y+size*.12,size*.11,'#55423b');
 round(x-size*.31,y-size*.34,size*.62,size*.15,colors[p],8);shape('star',x+size*.36,y+size*.28,size*.26,'#fff2b5');
 if(mouth){ctx.strokeStyle='#733f33';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y+size*.2,size*.12,0,Math.PI);ctx.stroke();}
}
function vehicle(p,x,y,scale=1,time=0){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 round(-130,-45,260,90,colors[p]);round(20,-110,100,80,colors[p]);round(40,-95,65,50,'#d4f3ff',12);
 if(p===3){round(-150,-135,300,8,'#effaff');round(-150,-130,12,70,colors[p]);}
 else if(p===6){ctx.fillStyle='#df752d';ctx.beginPath();ctx.moveTo(-160,0);ctx.lineTo(160,0);ctx.lineTo(110,70);ctx.lineTo(-110,70);ctx.fill();}
 else{shape('circle',-80,50,60,'#263a47');shape('circle',80,50,60,'#263a47');}
 if(p===2){for(let i=0;i<5;i++)round(-110+i*25,-100,6,40,'#eee',2);round(-110,-100,120,6,'#eee',2);round(-110,-65,120,6,'#eee',2);}
 if(p===1){round(45,-127,30,15,'#c44343',5);round(75,-127,30,15,'#e7f8ff',5);}
 if(p===5){round(-190,-20,70,55,'#e2b32c',4);round(-150,-15,50,12,'#e2b32c',4);}
 ctx.restore();
}
function background(t){
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#75c4ed');g.addColorStop(1,'#e2f7fb');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 shape('circle',1380,165,110,'#ffe38c');
 for(let i=0;i<5;i++){const x=(i*370+t*7)%1850-120;round(x,180+i%2*65,180,48,'#f8fdff',24);shape('circle',x+70,180+i%2*65,76,'#f8fdff');}
 const p=state.phase==='hub'||state.phase==='call'||state.phase==='reward'?0:state.pup;
 const ground=p===4?'#f5dda0':p===5?'#c5a075':p===1||p===2?'#687783':p===3||p===6?'#54bbd2':'#6fba75';
 ctx.fillStyle=ground;ctx.fillRect(0,500,W,400);
 if([0,4,6].includes(p)){
  ctx.fillStyle='#45b4d7';ctx.fillRect(0,400,W,180);
  ctx.strokeStyle='#c5f5f5';ctx.lineWidth=6;
  for(let row=0;row<3;row++){ctx.beginPath();for(let x=0;x<=W;x+=15){const y=430+row*50+Math.sin(x*.015+t*.7+row)*7;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
 }
 if(p===0){round(700,260,200,310,'#fff7d9',10);round(700,350,200,45,'#c34b4b',1);shape('triangle',800,240,250,'#c34b4b');round(770,465,60,105,'#376b94',20);round(738,280,124,55,'#b1e2ec',12);}
 if(p===1||p===2){for(let i=0;i<7;i++){round(i*270+50,610,130,12,'#f4edcc',3);round(i*270,380,140,115,['#a9bfca','#b6ccd1'][i%2],10);}if(p===2){round(100,500,40,100,'#c44a44');round(80,520,80,20,'#c44a44');}}
 if(p===6){for(let i=0;i<7;i++)round(0,690+i*16,400,12,'#b78558',2);}
 if(state.phase==='mission'&&p!==3)vehicle(p,1320,440,.8,t);
}
function announce(id,remember=false){return audio.say(id,remember);}
function screen(phase){state.session++;audio.cancel();state.phase=phase;state.busy=false;state.items=[];state.targets=[];state.first=null;state.stars=[];state.water=[];drag=null;pending=null;}
function home(){screen('hub');state.pup=0;caption.textContent='Escolha um amigo para brincar. Sem pressa!';audio.last='Ryder_instruction';}
function select(p){
 if(p===0){announce('Ryder_motto');announce('Ryder_instruction',true);return;}
 state.pup=p;screen('call');announce(names[p]+'_call',true);
}
function hint(){if(performance.now()<hintAt||audio.speaking)return;hintAt=performance.now()+3500;announce(names[state.pup]+'_hint');}
async function start(p){
 state.pup=p;screen('mission');state.progress=0;state.stage=0;state.reward=false;state.helicopter={x:180,y:350};const session=state.session;
 if(p===2)state.items=Array.from({length:5},(_,i)=>({x:290+i*260,y:575,w:140,h:190,id:i,done:false,color:colors[(i+1)%7]}));
 if(p===1){state.targets=shapes.map((type,i)=>({x:270+i*350,y:385,size:150,type}));state.items=shapes.map((type,i)=>({x:270+(3-i)*350,y:655,size:135,type,done:false}));}
 if(p===4){state.targets=['Papel','Plástico','Metal'].map((type,i)=>({x:420+i*390,y:380,w:220,h:200,type,color:['#367bc1','#d34c49','#dbb131'][i]}));state.items=Array.from({length:6},(_,i)=>({x:210+i*235,y:670,w:145,h:135,type:['Papel','Plástico','Metal'][i%3],done:false}));}
 if(p===3)state.items=[...'AEIOU'].map((v,i)=>({x:300+i*260,y:490+(i%2)*110,w:150,h:155,v,id:i,done:false}));
 if(p===5){state.targets=[{x:1220,y:510,w:360,h:400}];state.items=Array.from({length:4},(_,i)=>({x:280+(i%2)*400,y:400+Math.floor(i/2)*250,w:300-i*55,h:100,id:i,done:false}));}
 if(p===6){const deck=[0,0,1,1,2,2];for(let i=deck.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}state.items=deck.map((id,i)=>({x:440+(i%3)*360,y:380+Math.floor(i/3)*240,w:270,h:190,id,open:false,done:false}));}
 state.busy=true;await announce(names[p]+'_instruction',true);if(session!==state.session)return;
 if(p===2)await announce('Marshall_step1',true);if(p===3)await announce('Skye_A',true);
 if(session===state.session)state.busy=false;
}
async function correct(total,next){
 state.progress++;state.busy=true;const session=state.session;
 await announce(names[state.pup]+'_praise');if(session!==state.session)return;
 if(state.progress>=total){
  if(state.pup===4&&state.stage===0){state.stage=1;state.progress=0;state.items=[{x:480,y:600,w:150,h:120,type:'roda',done:false}];state.targets=[{x:1080,y:570,w:250,h:210,type:'roda'}];await announce('Rocky_repair',true);}
  else if(state.pup===5&&state.stage===0){state.stage=1;state.progress=0;state.items=Array.from({length:5},(_,i)=>({x:300+i*250,y:610,w:140,h:120,id:i,done:false}));state.targets=[];await announce('Rubble_count',true);}
  else {reward();return;}
 }else if(next)await announce(next,true);
 if(session===state.session)state.busy=false;
}
function reward(){screen('reward');state.reward=false;for(let i=0;i<35;i++)state.stars.push({x:Math.random()*W,y:-Math.random()*750,v:35+Math.random()*45});announce(names[state.pup]+'_reward',true);}
function feed(){if(state.reward)return;state.reward=true;state.eatUntil=performance.now()+2200;audio.effect('chew');setTimeout(()=>{if(state.phase==='reward')audio.effect('happy');},450);}
function drop(item,p){
 const target=state.targets.find(t=>inside(p,t));if(!target)return false;
 if(state.pup===1&&item.type===target.type){item.x=target.x;item.y=target.y;item.done=true;correct(4);return true;}
 if(state.pup===4&&item.type===target.type){item.done=true;correct(state.stage===0?6:1);return true;}
 if(state.pup===5&&item.id===state.progress){item.x=target.x;item.y=650-item.id*105;item.done=true;correct(4,'Rubble_next');return true;}
 return false;
}
async function tapItem(item){
 if(state.busy||item.done)return;
 if(state.pup===2){if(item.id!==state.progress){hint();return;}item.done=true;for(let i=0;i<20;i++)state.water.push({sx:1250,sy:430,tx:item.x+(Math.random()-.5)*80,ty:item.y,life:1,delay:i*.025});correct(5,item.id<4?'Marshall_step'+(item.id+2):null);}
 if(state.pup===3){if(item.id!==state.progress){hint();return;}item.done=true;state.helicopter.target={x:item.x,y:item.y-140};correct(5,item.id<4?'Skye_'+'AEIOU'[item.id+1]:null);}
 if(state.pup===5&&state.stage===1){if(item.id!==state.progress){hint();return;}item.done=true;correct(5,item.id<4?'Rubble_stone'+(item.id+2):null);}
 if(state.pup===6){
  if(item.open)return;item.open=true;
  if(state.first===null){state.first=item;return;}
  const first=state.first;state.first=null;
  if(first.id===item.id){first.done=item.done=true;correct(3);}else{
   state.busy=true;const session=state.session;await announce('Zuma_pair');await new Promise(r=>setTimeout(r,1300));if(session===state.session){first.open=item.open=false;state.busy=false;}
  }
 }
}
function animal(id,x,y){
 const color=['#62a5d5','#5caa69','#d47d65'][id];
 ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,48,27,0,0,7);ctx.fill();
 if(id===0)shape('triangle',x-55,y,40,color);
 else for(let side=-1;side<=1;side+=2){shape('circle',x+side*55,y-10,id===1?24:32,color);if(id===1)shape('circle',x+side*28,y+30,20,color);}
 shape('circle',x+20,y-7,9,'#183548');
}
function drawItem(item,t){
 const p=state.pup,x=item.x,y=item.y;
 if(p===2){if(item.done)return;ctx.save();ctx.translate(x,y+Math.sin(t*1.5+item.id)*4);ctx.fillStyle=item.color;ctx.beginPath();ctx.moveTo(0,-95);ctx.bezierCurveTo(-20,-35,-95,35,-55,75);ctx.bezierCurveTo(0,120,100,55,35,-5);ctx.closePath();ctx.fill();label(String(item.id+1),0,30,55,'white');ctx.restore();}
 if(p===1){shape(item.type,x,y,135,item.done?'#6a9c81':colors[1]);}
 if(p===3&&!item.done){shape('star',x,y+Math.sin(t*.8+item.id)*9,175,'#f5cd52');label(item.v,x,y,52,'#6f345e');}
 if(p===4&&!item.done){
  if(state.stage===1){shape('circle',x,y,115,'#414a51');shape('circle',x,y,45,'#a3c8d7');return;}
  round(x-65,y-65,130,135,'#fff4d7');
  if(item.type==='Papel'){round(x-35,y-50,70,80,'#f7fdff',3);for(let i=0;i<3;i++)round(x-25,y-32+i*18,50,4,'#4284b8',1);}
  if(item.type==='Plástico'){round(x-20,y-60,40,15,'#d14e48',3);round(x-28,y-45,56,75,'#8dd8e7',12);}
  if(item.type==='Metal'){round(x-35,y-50,70,80,'#a7b6c4',10);for(let i=0;i<3;i++)round(x-28,y-35+i*23,56,4,'#6f8797',2);}
  label(item.type,x,y+50,21);
 }
 if(p===5){if(state.stage===1){if(!item.done){shape('circle',x,y,105,'#919fa5');label(String(item.id+1),x,y,40,'white');}}else{round(x-item.w/2,y-50,item.w,100,'#e8b846',12);label(String(4-item.id),x,y,40);}}
 if(p===6){round(x-135,y-95,270,190,item.done?'#e3f2d4':'#f8efce',40);ctx.strokeStyle='#e38a45';ctx.lineWidth=9;ctx.strokeRect(x-110,y-70,220,140);if(item.open||item.done){animal(item.id,x,y-15);label(['Peixe','Tartaruga','Caranguejo'][item.id],x,y+55,25);}else label('?',x,y,70,'#d27737');}
}
function render(ms){
 const t=ms/1000,dt=Math.min(.04,(ms-lastTime)/1000||0);lastTime=ms;buttons=[];
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#91cfe7';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.setTransform(view.scale,0,0,view.scale,view.x,view.y);background(t);
 const title=state.phase==='hub'?'Baía da Aventura':state.phase==='call'?'Chamado no Farol':state.phase==='reward'?'Obrigado por ajudar!':missions[state.pup];label(title,800,75,45);
 if(state.phase!=='hub')button('Farol',115,70,180,75,'#b33b4b',home);
 button('Pup-Pad',1450,70,230,75,'#2863a6',()=>audio.repeat());
 button(audio.muted?'Som desligado':'Som ligado',1450,160,230,65,'#476c82',()=>audio.mute());
 if(state.phase==='hub'){
  label('Escolha um amigo para brincar',800,635,40);
  names.forEach((name,i)=>{portrait(i,140+i*220,700,100);button(name,140+i*220,790,195,75,colors[i],()=>select(i));});
  buttons.push({x:800,y:400,w:220,h:350,action:()=>{announce('Ryder_motto');announce('Ryder_instruction',true);}});
 }
 if(state.phase==='call'){portrait(state.pup,800,620,190);button('Vamos com '+names[state.pup],800,770,620,90,colors[state.pup],()=>start(state.pup));}
 if(state.phase==='mission'){
  for(const target of state.targets){
   if(state.pup===1)shape(target.type,target.x,target.y,160,'#3b5462');
   if(state.pup===4){if(state.stage===0){round(target.x-110,target.y-100,220,200,target.color);round(target.x-125,target.y-110,250,30,target.color,10);label(target.type,target.x,target.y+25,30,'white');}else{vehicle(5,target.x,target.y,.9);label('Conserte o carrinho',target.x,target.y-140,33);shape('circle',target.x-70,target.y+45,80,'#566c76');}}
   if(state.pup===5)round(target.x-180,target.y-200,360,400,'#decca4',12);
  }
  if(state.pup===3){const h=state.helicopter;if(h.target){const blend=1-Math.exp(-dt*2.5);h.x+=(h.target.x-h.x)*blend;h.y+=(h.target.y-h.y)*blend;}vehicle(3,h.x,h.y+Math.sin(t)*6,.65,t);}
  for(const item of state.items)if(!drag||drag.item!==item)drawItem(item,t);
  if(drag)drawItem(drag.item,t);
  for(const water of state.water){water.life-=dt;const q=Math.max(0,Math.min(1,(1-water.life-water.delay)*1.5));shape('circle',water.sx+(water.tx-water.sx)*q,water.sy+(water.ty-water.sy)*q-Math.sin(q*Math.PI)*130,12,'#c2f5ff');}state.water=state.water.filter(d=>d.life>0);
  if(state.pup===5&&state.stage===1)label('Vamos contar cinco pedrinhas',800,250,36);
 }
 if(state.phase==='reward'){
  for(const star of state.stars){star.y+=star.v*dt;if(star.y>810)star.y=-80;shape('star',star.x,star.y,24,'#ffe48b');}
  const eating=state.reward&&ms<state.eatUntil;portrait(state.pup,800,440,230,eating&&Math.floor(ms/180)%2===0);
  if(!state.reward){button('Dar biscoito',800,690,390,105,'#986a39',feed);shape('circle',800,580,75,'#c99251');for(let i=0;i<4;i++)shape('circle',780+i%2*35,565+Math.floor(i/2)*30,8,'#7d542e');}
  else label(eating?'Nhac, nhac!':'Que carinho! Obrigado!',800,620,40);
  button('Brincar de novo',380,745,420,85,colors[state.pup],()=>start(state.pup));button('Escolher amigo',1220,745,420,85,'#326b9f',home);
 }
 requestAnimationFrame(render);
}
function point(e){const rect=canvas.getBoundingClientRect();return{x:((e.clientX-rect.left)*canvas.width/rect.width-view.x)/view.scale,y:((e.clientY-rect.top)*canvas.height/rect.height-view.y)/view.scale};}
function cancelPointer(){if(drag){drag.item.x=drag.home.x;drag.item.y=drag.home.y;}drag=null;pending=null;}
canvas.addEventListener('pointerdown',e=>{
 e.preventDefault();audio.unlock();const p=point(e);if(drag||pending)return;
 const hit=[...buttons].reverse().find(b=>inside(p,b));if(hit){pending={id:e.pointerId,button:hit};canvas.setPointerCapture(e.pointerId);return;}
 if(state.phase!=='mission'||state.busy)return;
 const item=[...state.items].reverse().find(o=>!o.done&&inside(p,o));if(!item)return;
 if([1,4].includes(state.pup)||(state.pup===5&&state.stage===0))drag={id:e.pointerId,item,home:{x:item.x,y:item.y},offset:{x:item.x-p.x,y:item.y-p.y}};
 else pending={id:e.pointerId,item};canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId&&!state.busy){let p=point(e);drag.item.x=Math.max(70,Math.min(W-70,p.x+drag.offset.x));drag.item.y=Math.max(210,Math.min(760,p.y+drag.offset.y));}});
canvas.addEventListener('pointerup',e=>{
 const p=point(e);
 if(pending && pending.id===e.pointerId){const current=pending;pending=null;if(current.button&&inside(p,current.button))current.button.action();else if(current.item&&inside(p,current.item))tapItem(current.item);}
 if(drag && drag.id===e.pointerId){const current=drag;drag=null;if(state.busy||!drop(current.item,p)){current.item.x=current.home.x;current.item.y=current.home.y;if(!state.busy)hint();}}
});
canvas.addEventListener('pointercancel',cancelPointer);canvas.addEventListener('lostpointercapture',cancelPointer);
window.addEventListener('blur',()=>{cancelPointer();if(audio.context)audio.context.suspend().catch(()=>{});});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelPointer();if(audio.context)audio.context.suspend().catch(()=>{});}});
window.game={home:()=>{audio.unlock();home();},pause:()=>{cancelPointer();if(audio.context)audio.context.suspend().catch(()=>{});}};
// Estado somente de leitura para os testes reais de interface no Chromium.
window.game.inspect=()=>JSON.parse(JSON.stringify({phase:state.phase,pup:state.pup,progress:state.progress,stage:state.stage,busy:state.busy,items:state.items,targets:state.targets,reward:state.reward}));
requestAnimationFrame(render);
})();
