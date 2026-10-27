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
  const task=fetch('/audio/'+id+'.mp3').then(r=>{if(!r.ok)throw Error('MP3 neural ausente');return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b));
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
    let buffer;try{buffer=await this.load(id);}catch(e){return;}
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
  const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.setValueAtTime(type==='happy'?430:type==='siren'?380:520,c.currentTime);osc.frequency.exponentialRampToValueAtTime(type==='happy'?650:type==='siren'?700:390,c.currentTime+.25);gain.gain.setValueAtTime(.045,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+.4);osc.connect(gain);gain.connect(this.master);osc.start();osc.stop(c.currentTime+.42);
 }
}
const audio=new AudioGuide(),world=new AdventureWorld.World();
const player=world.player;
let view={scale:1,x:0,y:0},camera={x:1600,y:1140},buttons=[],modal=null,lastTime=0,dust=[],effects=[],guideGlow=0,wheelPointer=null;
const joystick={id:null,x:175,y:705,dx:0,dy:0},held=new Map(),keys=new Set();
let firstTouch=true,lastAction=0;
let gamepadPrevious=[],gamepadAxes={x:0,y:0},walkPhase=0,vehicleArrival=0,captionTimer=0;
const mapCanvas=document.createElement('canvas');mapCanvas.width=3200;mapCanvas.height=2400;const mapCtx=mapCanvas.getContext('2d');
const palette={papel:'#397bb8',plastico:'#cd5753',metal:'#e3bc43',vidro:'#499667'};
function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);view.scale=Math.min(canvas.width/W,canvas.height/H);view.x=(canvas.width-W*view.scale)/2;view.y=(canvas.height-H*view.scale)/2;document.getElementById('rotate').hidden=innerWidth>=innerHeight;}
window.addEventListener('resize',resize);
function round(x,y,w,h,color,r=16){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.fill();}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function label(text,x,y,size=27,color='#233d48'){ctx.fillStyle=color;ctx.font=`bold ${size}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,y);}
function shape(type,x,y,size,color){ctx.fillStyle=color;ctx.beginPath();if(type==='circle')ctx.arc(x,y,size/2,0,Math.PI*2);else if(type==='triangle'){ctx.moveTo(x,y-size/2);ctx.lineTo(x+size/2,y+size/2);ctx.lineTo(x-size/2,y+size/2);}else if(type==='star'){for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=size*(i%2?.24:.5),px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}}else ctx.rect(x-size/2,y-size/2,size,size);ctx.closePath();ctx.fill();}
function button(text,x,y,w,h,color,action){round(x-w/2,y-h/2,w,h,color);label(text,x,y,26,'#fff');buttons.push({x,y,w,h,action});}
function inside(p,b){return Math.abs(p.x-b.x)<b.w/2&&Math.abs(p.y-b.y)<b.h/2;}
function portrait(p,x,y,size=100,mouth=false){
 ellipse(x,y,size*.51,size*.51,colors[p]);
 if(p!==0){ellipse(x-size*.3,y+3,size*.14,size*.32,p===2?'#fff4e4':'#825333');ellipse(x+size*.3,y+3,size*.14,size*.32,p===2?'#fff4e4':'#825333');}
 ellipse(x,y,size*.35,size*.38,p===2?'#fff7ec':p===4?'#b8b0a1':'#e3b783');
 round(x-size*.33,y-size*.37,size*.66,size*.18,colors[p],6);
 if(p===1){shape('star',x,y-size*.28,size*.15,'#f8d477');}
 if(p===2){ellipse(x-size*.18,y+size*.1,size*.085,size*.11,'#7d665b');}
 ellipse(x-size*.13,y-size*.03,size*.038,size*.047,'#213e4a');ellipse(x+size*.13,y-size*.03,size*.038,size*.047,'#213e4a');
 ellipse(x,y+size*.15,size*.07,size*.05,'#3c3d37');
 ctx.strokeStyle='#4f4439';ctx.lineWidth=Math.max(2,size*.025);ctx.beginPath();ctx.arc(x,y+size*.2,size*.1,0,Math.PI);ctx.stroke();
 if(mouth)ellipse(x,y+size*.27,size*.08,size*.055,'#d58486');
}
function makeMap(){
 const c=mapCtx;c.fillStyle='#99c87c';c.fillRect(0,0,3200,2400);
 c.fillStyle='#9dcb80';for(let i=0;i<2000;i++){const x=(i*173)%3200,y=(i*337)%2400;c.fillRect(x,y,3,7);}
 c.fillStyle='#bfc9ca';c.fillRect(60,70,1450,1300);c.fillStyle='#687d89';c.fillRect(80,340,1400,390);c.fillRect(90,895,1340,140);
 c.fillStyle='#e2dfc6';for(let x=150;x<1480;x+=140)c.fillRect(x,526,70,8);
 c.fillStyle='#8eb36f';c.fillRect(1860,70,1270,1250);c.fillStyle='#c8d88f';c.fillRect(1920,280,1130,780);
 c.fillStyle='#d4b383';c.fillRect(60,1460,1500,900);
 c.fillStyle='#f1d99d';c.fillRect(1830,1430,1300,750);
 c.fillStyle='#56b1c5';c.fillRect(1820,2190,1380,210);c.fillRect(3080,1200,120,1200);
 c.fillStyle='#b4a176';c.fillRect(2200,2190,850,140);
 for(let x=2210;x<3050;x+=32){c.fillStyle='#d0b181';c.fillRect(x,2200,24,120);}
 c.fillStyle='#d9c79e';c.fillRect(1460,1050,450,160);c.fillRect(1510,1150,180,1100);c.fillRect(1400,1300,1750,130);
 c.fillStyle='#7ab372';c.beginPath();c.arc(1600,1010,350,0,7);c.fill();
 c.fillStyle='#e4d0a0';c.fillRect(190,2170,1000,180);c.fillStyle='#5babc0';c.fillRect(190,2200,1000,120);
 c.strokeStyle='#e9d7b0';c.lineWidth=6;for(let x=90;x<1400;x+=90){c.beginPath();c.moveTo(x,1490);c.lineTo(x,1520);c.stroke();}
}
makeMap();
const trees=Array.from({length:85},(_,i)=>({x:100+(i*397)%2980,y:80+(i*251)%2240,size:42+(i%3)*9})).filter(t=>!world.obstacles.some(r=>t.x>r.x-80&&t.x<r.x+r.w+80&&t.y>r.y-80&&t.y<r.y+r.h+80)&&!(t.y>330&&t.y<750&&t.x<1500)&&!(t.y>2150));
function tree(o,t){ellipse(o.x,o.y+25,o.size*.75,18,'#6c9b64');round(o.x-7,o.y-20,14,55,'#997648',3);const sway=Math.sin(t*.7+o.x)*3;ellipse(o.x+sway,o.y-27,o.size,o.size*.77,'#4b9367');ellipse(o.x-16+sway,o.y-39,o.size*.6,o.size*.55,'#69ad72');if(o.x>1850&&o.y<1100)for(let i=0;i<3;i++)ellipse(o.x+(i-1)*20,o.y-30+(i%2)*20,7,7,'#dc8b64');}
function building(r,index){
 ellipse(r.x+r.w/2,r.y+r.h,r.w*.54,22,'#789171');round(r.x,r.y,r.w,r.h,['#eed6ad','#d9dbc9','#bed6cd','#eed7a9'][index%4],12);
 ctx.fillStyle=['#b96353','#6f91aa','#ba8c51','#a97457'][index%4];ctx.beginPath();ctx.moveTo(r.x-20,r.y+15);ctx.lineTo(r.x+r.w/2,r.y-95);ctx.lineTo(r.x+r.w+20,r.y+15);ctx.closePath();ctx.fill();
 for(let i=0;i<3;i++)round(r.x+25+i*r.w*.28,r.y+45,40,48,'#94bac6',5);
 round(r.x+r.w/2-25,r.y+r.h-80,50,80,'#6b8a8d',7);
}
function drawLighthouse(t){const x=1600,y=860;ellipse(x,y+140,160,35,'#527f65');round(x-95,y-65,190,215,'#f2e4b6',15);round(x-95,y+10,190,35,'#c65c54',2);round(x-75,y-140,150,80,'#86b2ba',12);shape('triangle',x,y-150,205,'#bd6155');round(x-26,y+75,52,75,'#607e8c',12);label('FAROL',x,y+180,30,'#355951');round(1690,940,70,45,'#c28669',8);ctx.strokeStyle='#e9b657';ctx.lineWidth=26;ctx.beginPath();ctx.moveTo(1710,965);ctx.bezierCurveTo(1740,1000,1730,1070,1810,1100);ctx.stroke();}
function vehicle(x,y,p,angle,t){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ellipse(0,8,83,51,'#526d7150');
 if(p!==3&&p!==6){for(const side of [-1,1]){round(-45,side*35-9,30,20,'#334651',5);round(27,side*35-9,30,20,'#334651',5);}}
 round(-70,-37,140,74,colors[p],20);round(10,-28,45,56,'#b1d9df',12);round(-25,-28,28,56,'#587d86',5);
 if(p===2){ctx.strokeStyle='#f3d9b0';ctx.lineWidth=5;ctx.strokeRect(-60,-22,45,44);for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-50+i*13,-22);ctx.lineTo(-50+i*13,22);ctx.stroke();}}
 if(p===3){ctx.strokeStyle='#d9e1d8';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-20,-95);ctx.lineTo(-20,95);ctx.stroke();round(-95,-7,40,14,colors[p],5);}
 if(p===5){round(70,-25,48,50,'#dfb45d',5);round(40,-6,42,12,'#bb913f',3);}
 if(p===6){ctx.strokeStyle='#f2cc9a';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(0,0,78,42,0,0,7);ctx.stroke();}
 portrait(p,-10,0,36);ctx.restore();
}
function character(t){
 const moving=Math.hypot(player.vx,player.vy)>15,x=player.x,y=player.y,jump=Math.sin(Math.PI*player.jump/.65)*42;
 if(player.vehicle){vehicle(x,y,player.pup,player.angle,t);if(vehicleArrival>0){ctx.strokeStyle='#fff7b1';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,90+vehicleArrival*60,0,7);ctx.stroke();}return;}
 ellipse(x,y+19,32,12,'#36594850');ctx.save();ctx.translate(x,y-jump);ctx.rotate(player.angle+Math.PI/2);
 const step=moving?Math.sin(walkPhase)*9:0;
 for(const side of [-1,1]){ellipse(side*19,-2+side*step,8,14,'#d5ab7c');ellipse(side*16,23-side*step,8,12,'#d5ab7c');}
 round(-22,-7,44,53,colors[player.pup],16);round(-34,1,14,25,'#8faaa2',5);round(20,1,14,25,'#8faaa2',5);
 portrait(player.pup,0,-22,57);ctx.restore();
 if(player.carrying){round(x-60,y-100,120,35,palette[player.carrying]||'#6a8f92',10);label(player.carrying==='wheel'?'Roda':player.carrying,x,y-82,20,'white');}
}
function animal(kind,x,y,t){
 const land=['cow','pig','sheep','cat'].includes(kind),color=kind==='pig'?'#d79b96':kind==='cow'?'#f0e6d0':kind==='sheep'?'#e7e1ce':kind==='turtle'?'#739d6e':kind==='octopus'?'#bd85a0':kind==='cat'?'#d1a06c':'#e0b16b';
 ellipse(x,y,land?35:32,land?24:22,color);
 if(kind==='starfish'){shape('star',x,y,85,color);return;}
 if(kind==='octopus'){for(let i=0;i<5;i++){ctx.strokeStyle=color;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x-28+i*14,y+8);ctx.quadraticCurveTo(x-30+i*14+Math.sin(t+i)*8,y+40,x-35+i*16,y+38);ctx.stroke();}}
 if(kind==='turtle')for(const side of [-1,1])ellipse(x+side*29,y+17,14,9,'#587955');
 ellipse(x+25,y-14,17,18,color);ellipse(x+28,y-19,3,4,'#344546');
 if(kind==='cat'){shape('triangle',x+15,y-29,20,color);shape('triangle',x+37,y-29,20,color);}
 if(kind==='cow'){ellipse(x-9,y-7,9,12,'#7b7866');ellipse(x+18,y+18,5,12,'#6d7864');}
 if(kind==='sheep')for(let i=0;i<5;i++)ellipse(x-20+i*10,y-17,12,12,'#fff4df');
}
function object(o,t){
 const x=o.x,y=o.y;
 if(o.done&&!['fire','cat','traffic','socket','toy','farm','seed'].includes(o.type))return;
 if(o.type==='fire'){
  if(o.done){ellipse(x,y+20,26,10,'#a7b9b3');return;}
  ellipse(x,y+38,38,11,'#4f657350');ctx.fillStyle='#dc8664';ctx.beginPath();ctx.moveTo(x,y-61+Math.sin(t*2+o.number)*4);ctx.bezierCurveTo(x-20,y-15,x-55,y+20,x-25,y+43);ctx.bezierCurveTo(x+40,y+64,x+53,y+5,x,y-61);ctx.fill();shape('triangle',x,y+22,35,'#f0ca77');label(String(o.number),x,y+13,31,'#fffdf2');return;
 }
 if(o.type==='board'){round(x-62,y-45,124,75,'#e7d6a7',12);label('Missões',x,y-10,23);portrait(0,x,y-52,48);return;}
 if(o.type==='food'){ellipse(x,y,35,22,'#729698');ellipse(x,y-4,25,14,'#bd9569');label('Biscoitos',x,y+40,18);return;}
 if(o.type==='slide')return;
 if(o.type==='traffic'){round(x-24,y-80,48,116,'#51646a',12);for(let i=0;i<3;i++)ellipse(x,y-55+i*32,12,12,['#cb6d65','#e1bd63','#86b286'][i]);round(x-5,y+35,10,50,'#587379',3);label(o.done?'✓':['PARE','ATENÇÃO','SIGA'][o.order],x,y+110,20);return;}
 if(o.type==='cat'){tree({x,y:y+5,size:43},t);animal('cat',x,y-35,t);shape(o.shape,x,y-95,42,o.done?'#91b99c':'#f3dd96');return;}
 if(o.type==='bin'){round(x-37,y-44,74,89,palette[o.material],10);round(x-43,y-51,86,16,palette[o.material],6);label({papel:'Papel',plastico:'Plástico',metal:'Metal',vidro:'Vidro'}[o.material],x,y+68,20);shape(o.material==='metal'?'circle':'square',x,y-2,25,'#edf0d6');return;}
 if(o.type==='waste'){
  round(x-24,y-30,48,55,'#f1e3bc',8);const c=palette[o.material];
  if(o.material==='papel'){round(x-15,y-20,30,35,'#fff6db',2);for(let i=0;i<3;i++)round(x-10,y-12+i*9,20,2,c,1);}
  else{round(x-14,y-21,28,39,c,7);round(x-8,y-29,16,10,c,2);}return;
 }
 if(o.type==='wheel'){ellipse(x,y,27,27,'#5b6970');ellipse(x,y,12,12,'#b9c8c2');return;}
 if(o.type==='toy'){vehicle(x,y,5,0,t);if(!o.done){ctx.strokeStyle='#f1e1ae';ctx.setLineDash([6,6]);ctx.strokeRect(x-65,y-55,150,110);ctx.setLineDash([]);}return;}
 if(o.type==='marine'){ellipse(x,y+10,49,39,'#e7c794');ellipse(x,y+10,36,29,'#8ec5c8');animal(o.animal,x,y-10,t);return;}
 if(o.type==='vowel'){const bob=Math.sin(t*.8+o.order)*8;ctx.strokeStyle='#9aaf85';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+55);ctx.quadraticCurveTo(x+15,y+10,x,y-20+bob);ctx.stroke();ellipse(x,y-35+bob,37,47,['#c18da5','#e4ba78','#8eafa1','#95afc3','#c5a3b1'][o.order]);label(o.letter,x,y-34+bob,38,'#fff7e8');return;}
 if(o.type==='rock'){ellipse(x,y+10,o.size*.6,15,'#aa926f');shape('circle',x,y,o.size,'#9daba5');label(String(o.number),x,y,30,'#fff7df');return;}
 if(o.type==='piece'){shape(o.shape,x,y,65,'#ddb766');return;}
 if(o.type==='socket'){round(x-65,y-48,130,96,o.done?'#b48f60':'#a7bab0',4);shape(o.shape,x,y,55,o.done?'#ebcc82':'#667c7c');return;}
 if(o.type==='farm'){animal(o.animal,x,y,t);if(o.done)shape('heart',x,y-60,18,'#d59b8b');return;}
 if(o.type==='seed'||o.type==='flower'){
  const b=o.bloom||0;ctx.strokeStyle='#749663';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y+10);ctx.lineTo(x,y-15*b);ctx.stroke();
  if(b>0.05)for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*13*b,y-15*b+Math.sin(a)*13*b,7*b,7*b,{azul:'#81a9be',vermelha:'#cd897c',amarela:'#e1c472',verde:'#9bb97a'}[o.color]||'#dcae98');}
  ellipse(x,y-15*b,5,5,'#ebd58d');return;
 }
 if(o.type==='hydrant'){round(x-13,y-20,26,47,'#bc7063',6);round(x-25,y-10,50,12,'#bc7063',5);return;}
 if(o.type==='footprint'){ellipse(x-8,y,8,12,'#efdfa6');ellipse(x+9,y+17,8,12,'#efdfa6');return;}
 if(o.type==='chest'){round(x-36,y-25,72,50,'#b58b55',6);round(x-40,y-33,80,20,'#d2ae69',7);round(x-5,y-12,10,15,'#eee1b1',2);return;}
 if(o.type==='cookie'||o.type==='bone'){ellipse(x,y+8,22,7,'#7c9e6d50');if(o.type==='cookie'){ellipse(x,y,16,16,'#d1ae73');ellipse(x-5,y-3,3,3,'#876c4d');ellipse(x+7,y+5,3,3,'#876c4d');}else{round(x-14,y-5,28,10,'#f0dfad',4);for(const side of [-1,1]){ellipse(x+side*14,y-5,7,7,'#f0dfad');ellipse(x+side*14,y+5,7,7,'#f0dfad');}}}
}
function drawWorld(t,dt){
 ctx.save();ctx.translate(800-camera.x,450-camera.y);ctx.drawImage(mapCanvas,0,0);
 const visible=o=>Math.abs(o.x-camera.x)<950&&Math.abs(o.y-camera.y)<650;
 // Ondas nunca piscam; deslocamento baixo e contínuo.
 ctx.strokeStyle='#b0ddd5';ctx.lineWidth=4;for(let row=0;row<4;row++){ctx.beginPath();for(let x=1830;x<3200;x+=20){let y=2220+row*48+Math.sin(x*.02+t*.9)*5;x===1830?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
 for(let i=0;i<world.obstacles.length;i++)building(world.obstacles[i],i);
 drawLighthouse(t);
 const carX=120+(t*26)%1200;vehicle(carX,835,1,0,t);
 for(const tr of trees)if(visible(tr))tree(tr,t);
 const guide=world.pending();if(guide){const a=Math.atan2(guide.y-player.y,guide.x-player.x);ctx.save();ctx.translate(player.x+Math.cos(a)*115,player.y+Math.sin(a)*115);ctx.rotate(a+Math.PI/2);ctx.globalAlpha=.6+Math.sin(t*2)*.12;shape('triangle',0,0,guideGlow>0?63:45,'#f4df9e');ctx.restore();}
 for(const o of world.objects)if(visible(o))object(o,t);
 character(t);
 for(const d of dust){d.life-=dt;ctx.globalAlpha=Math.max(0,d.life*.35);ellipse(d.x,d.y,8+(1-d.life)*12,5,'#e0c9a1');}ctx.globalAlpha=1;dust=dust.filter(d=>d.life>0);
 for(const e of effects){e.life-=dt;if(e.type==='water'){for(let i=0;i<15;i++){const q=((1-e.life)*2+i*.04)%1;ellipse(e.sx+(e.x-e.sx)*q,e.sy+(e.y-e.sy)*q-Math.sin(q*Math.PI)*35,4,6,'#bfe9e1');}}else if(e.type==='tool'){
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);ctx.strokeStyle='#e8e4c4';ctx.lineWidth=5;
  if(e.pup===1){ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(95,0);ctx.stroke();ctx.strokeRect(75,-30,55,60);for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(85+i*15,-30);ctx.lineTo(85+i*15,30);ctx.stroke();}}
  if(e.pup===4){ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(95,0);ctx.lineTo(115,-25);ctx.moveTo(95,0);ctx.lineTo(115,25);ctx.stroke();}
  if(e.pup===3){ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(85,-65);ctx.moveTo(0,20);ctx.lineTo(85,65);ctx.stroke();}
  if(e.pup===5){round(35,-9,75,18,'#d2aa5c',3);round(100,-35,34,70,'#e0ba6a',5);}
  if(e.pup===6){ctx.beginPath();ctx.arc(95,0,28,0,7);ctx.stroke();ctx.strokeStyle='#de9764';ctx.lineWidth=10;ctx.beginPath();ctx.arc(95,0,28,0,Math.PI);ctx.stroke();}
  ctx.restore();
 }else{shape('star',e.x,e.y-(1-e.life)*80,30*Math.max(0,e.life),'#f8e5a6');}}
 effects=effects.filter(e=>e.life>0);ctx.restore();
}
function radar(){
 const x=1380,y=110,w=185,h=140;round(x-100,y-78,200,158,'#f8efdb',18);round(x-90,y-68,180,138,'#9fbc95',10);
 ctx.fillStyle='#a3ccd0';ctx.fillRect(x+15,y+25,75,45);
 for(const o of world.objects)if(!o.done&&['fire','vowel','waste','marine','rock','cat'].includes(o.type))ellipse(x-90+o.x/3200*180,y-68+o.y/2400*138,2.5,2.5,'#a17957');
 shape('star',x-90+1600/3200*180,y-68+860/2400*138,12,'#f0e1aa');
 const goal=world.pending();if(goal)shape('star',x-90+goal.x/3200*180,y-68+goal.y/2400*138,13,'#e3b564');
 ellipse(x-90+player.x/3200*180,y-68+player.y/2400*138,5,5,colors[player.pup]);
}
function controlButton(letter,title,x,y,color,key){ellipse(x,y,54,54,'#f5ebd5c9');ellipse(x,y,46,46,held.has(key)?'#587c7f':color);label(letter,x,y-7,34,'white');label(title,x,y+72,19,'#294956');buttons.push({x,y,w:110,h:110,key});}
function hud(t){
 round(25,24,500,88,'#f8efd9ec',22);portrait(player.pup,77,68,65);label(names[player.pup],210,51,28);label('Biscoitos '+world.cookies+'   Estrelas '+world.stars,295,87,21);
 button('Pup-Pad · Ouvir',720,67,275,75,'#3e7188',()=>{guideGlow=4;audio.cancel();audio.say(world.instruction(),true);});
 button(audio.muted?'Som: desligado':'Som: ligado',1060,67,240,75,'#6e8582',()=>audio.mute());radar();
 const goal=world.pending();const message=goal?('Aproxime-se: '+({fire:'chama '+goal.number,vowel:'vogal '+goal.letter,waste:'material reciclável',bin:'lixeira '+goal.material,marine:'animal marinho',rock:'pedra '+goal.number,board:'painel do Ryder',piece:'forma para a ponte',socket:'encaixe '+goal.shape,cat:'gatinho',traffic:'semáforo',farm:'animal da fazenda',toy:'brinquedo',wheel:'roda',seed:'sementinha',footprint:'pegadas',chest:'baú de biscoitos'}[goal.type]||'surpresa')):'Passeie e encontre novas surpresas';
 round(420,130,760,49,'#fff6e2dc',15);label(message,800,154,25);
 ellipse(175,705,105,105,'#e8efdc80');ctx.strokeStyle='#f6f2d4';ctx.lineWidth=5;ctx.beginPath();ctx.arc(175,705,105,0,7);ctx.stroke();ellipse(175+joystick.dx*69,705+joystick.dy*69,47,47,'#64888dcc');ellipse(175+joystick.dx*69-8,705+joystick.dy*69-9,25,25,'#91b2afd9');
 label('Passear',175,835,23,'#254951');
 controlButton('A','Ferramenta',1450,625,'#bb6460','A');controlButton('B',player.vehicle?'Turbo':'Pular',1300,750,'#719b71','B');controlButton('X','Veículo',1300,500,'#608ba8','X');controlButton('Y','Amigos',1150,625,'#bd9a52','Y');
}
function drawModal(t){
 if(!modal)return;ctx.fillStyle='#26434d77';ctx.fillRect(0,0,W,H);
 round(350,200,900,530,'#fbf1db',34);
 if(modal==='select'){
  label('Quem vai passear com você?',800,260,38);for(let p=0;p<7;p++){let x=470+p%4*220,y=380+Math.floor(p/4)*210;portrait(p,x,y,102);button(names[p],x,y+85,180,60,colors[p],()=>{world.switchPup(p);modal=null;audio.cancel();audio.say(names[p]+'_call');audio.say(world.instruction(),true);});}
  button('Continuar',1180,260,180,60,'#5b8381',()=>modal=null);
 }else{
  label('Que bom ajudar nossos amigos!',800,260,36);portrait(player.pup,800,430,195,world.time<captionTimer);
  for(let i=0;i<25;i++){const x=390+(i*151)%820,y=300+(t*35+i*43)%360;shape('star',x,y,15,'#debd6f');}
  button('Dar biscoito',800,620,330,85,'#ad8050',()=>{world.cookies+=1;world.feed();captionTimer=world.time+2;modal='fed';});
  if(modal==='fed'){round(570,566,460,115,'#fbf1db',5);button('Continuar explorando',800,620,420,85,'#5e8f81',()=>modal=null);}
 }
}
function act(key){
 if(key==='Y'){modal=modal==='select'?null:'select';audio.cancel();audio.say('Ryder_switch',true);return;}
 if(modal)return;
 if(key==='A'&&performance.now()-lastAction>400){lastAction=performance.now();world.action();}if(key==='B')world.jump();if(key==='X')world.toggleVehicle();
}
function gamepad(){
 gamepadAxes={x:0,y:0};const pad=navigator.getGamepads&&Array.from(navigator.getGamepads()).find(p=>p&&p.connected);if(!pad){gamepadPrevious=[];return;}
 const curve=v=>Math.abs(v)<.15?0:Math.sign(v)*(Math.abs(v)-.15)/.85;
 gamepadAxes={x:curve(pad.axes[0]||0),y:curve(pad.axes[1]||0)};
 const mapping={0:'A',1:'B',2:'X',3:'Y'};for(let i=0;i<4;i++){const pressed=!!pad.buttons[i]&&pad.buttons[i].pressed;if(pressed&&!gamepadPrevious[i]){audio.unlock();act(mapping[i]);}gamepadPrevious[i]=pressed;}
 if(pad.buttons[12]&&pad.buttons[12].pressed)gamepadAxes.y=-1;if(pad.buttons[13]&&pad.buttons[13].pressed)gamepadAxes.y=1;if(pad.buttons[14]&&pad.buttons[14].pressed)gamepadAxes.x=-1;if(pad.buttons[15]&&pad.buttons[15].pressed)gamepadAxes.x=1;
}
function flushEvents(){for(const e of world.events.splice(0)){
 if(e.kind==='voice')audio.say(e.id,true);
 if(e.kind==='tool')effects.push({type:'tool',x:e.x,y:e.y,angle:e.angle,pup:e.pup,life:.7});
 if(e.kind==='water')effects.push({type:'water',sx:player.x,sy:player.y,x:e.x,y:e.y,life:1});
 if(e.kind==='success'){effects.push({type:'star',x:e.x,y:e.y,life:1});audio.effect('happy');}
 if(e.kind==='collect')audio.effect('gentle');
 if(e.kind==='jump'||e.kind==='turbo')audio.effect('happy');
 if(e.kind==='vehicle'){vehicleArrival=1;audio.effect('siren');}
 if(e.kind==='eat')audio.effect('chew');
 if(e.kind==='animal'){audio.effect(e.id);}
 if(e.kind==='reward'){modal='reward';audio.say(e.id,true);}
}}
function frame(ms){
 const t=ms/1000,dt=Math.min(.04,(ms-lastTime)/1000||0);lastTime=ms;buttons=[];gamepad();
 const keyboard={x:(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0),y:(keys.has('ArrowDown')||keys.has('s')?1:0)-(keys.has('ArrowUp')||keys.has('w')?1:0)};
 const axes=joystick.id!==null?{x:joystick.dx,y:joystick.dy}:Math.hypot(gamepadAxes.x,gamepadAxes.y)>.1?gamepadAxes:keyboard;
 if(!modal&&(held.has('A')||gamepadPrevious[0])&&performance.now()-lastAction>650)act('A');
 if(!modal)world.update(dt,axes);else world.update(dt,{x:0,y:0});
 const moving=Math.hypot(player.vx,player.vy);walkPhase+=dt*moving*.045;if(moving>190&&Math.random()<dt*15)dust.push({x:player.x,y:player.y+16,life:1});
 vehicleArrival=Math.max(0,vehicleArrival-dt);guideGlow=Math.max(0,guideGlow-dt);flushEvents();
 const cx=Math.max(800,Math.min(2400,player.x)),cy=Math.max(450,Math.min(1950,player.y));const blend=1-Math.exp(-dt*5);camera.x+=(cx-camera.x)*blend;camera.y+=(cy-camera.y)*blend;
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#294b5b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(view.scale,0,0,view.scale,view.x,view.y);
 drawWorld(t,dt);hud(t);drawModal(t);requestAnimationFrame(frame);
}
function point(e){const rect=canvas.getBoundingClientRect();return{x:((e.clientX-rect.left)*canvas.width/rect.width-view.x)/view.scale,y:((e.clientY-rect.top)*canvas.height/rect.height-view.y)/view.scale};}
function joystickMove(p){const dx=p.x-175,dy=p.y-705,len=Math.hypot(dx,dy),scale=Math.min(1,len/85);joystick.dx=len>4?dx/len*scale:0;joystick.dy=len>4?dy/len*scale:0;}
function resetInput(){joystick.id=null;joystick.dx=joystick.dy=0;held.clear();keys.clear();player.vx=player.vy=0;}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();audio.unlock();if(firstTouch){firstTouch=false;audio.say('Ryder_instruction',true);}const p=point(e);canvas.setPointerCapture(e.pointerId);
 if(!modal&&p.x<330&&p.y>520&&joystick.id===null){joystick.id=e.pointerId;joystickMove(p);return;}
 const b=[...buttons].reverse().find(b=>inside(p,b));if(!b)return;if(b.key){held.set(b.key,e.pointerId);act(b.key);}else b.action();
});
canvas.addEventListener('pointermove',e=>{if(joystick.id===e.pointerId)joystickMove(point(e));});
function release(e){if(joystick.id===e.pointerId){joystick.id=null;joystick.dx=joystick.dy=0;}for(const [key,id]of held)if(id===e.pointerId)held.delete(key);}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
window.addEventListener('keydown',e=>{if(e.repeat)return;audio.unlock();keys.add(e.key);const key={j:'A',' ':'B',k:'X',l:'Y'}[e.key];if(key){e.preventDefault();act(key);}});window.addEventListener('keyup',e=>keys.delete(e.key));
window.addEventListener('blur',()=>{resetInput();if(audio.context)audio.context.suspend().catch(()=>{});});document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInput();if(audio.context)audio.context.suspend().catch(()=>{});}});
window.game={home:()=>{resetInput();modal='select';},pause:()=>{resetInput();if(audio.context)audio.context.suspend().catch(()=>{});},inspect:()=>({player:{...player},camera:{...camera},stars:world.stars,cookies:world.cookies,modal,objects:world.objects.map(o=>({...o})),complete:Array.from(world.complete)})};
resize();requestAnimationFrame(frame);
})();
