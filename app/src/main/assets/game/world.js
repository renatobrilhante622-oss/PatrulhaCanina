/* Simulação independente do desenho: movimento, objetivos, colisões e interações. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AdventureWorld=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const WIDTH=3200,HEIGHT=2400,NAMES=['Ryder','Chase','Marshall','Skye','Rocky','Rubble','Zuma'];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
class World {
 constructor(){
  this.player={x:1600,y:1140,vx:0,vy:0,angle:0,pup:0,vehicle:false,jump:0,turbo:0,carrying:null};
  this.objects=[];this.events=[];this.time=0;this.stars=0;this.cookies=0;this.complete=new Set();this.reward=null;this.traffic=0;this.bridge=0;this.slide=0;this.lastHint=0;
  this.obstacles=[{x:1490,y:800,w:220,h:225},{x:280,y:120,w:250,h:190},{x:810,y:110,w:260,h:190},{x:1210,y:110,w:220,h:190},{x:2450,y:1370,w:200,h:160}];
  const add=(type,x,y,extra={})=>{const o={id:type+'-'+this.objects.length,type,x,y,done:false,...extra};this.objects.push(o);return o;};
  add('board',1600,1080,{pup:0});add('slide',1790,1010);add('food',1410,1130);
  for(let i=0;i<10;i++)add('fire',240+i%5*290,395+Math.floor(i/5)*240,{pup:2,order:i,number:i+1});
  ['red','yellow','green'].forEach((color,i)=>add('traffic',250+i*230,970,{pup:1,order:i,color}));
  ['circle','square','triangle','star'].forEach((shape,i)=>add('cat',270+i*280,1230,{pup:1,order:i+3,shape}));
  ['papel','plastico','metal','vidro'].forEach((material,i)=>{add('waste',1940+i*270,1940,{pup:4,material,order:i});add('bin',1950+i*270,1660,{pup:4,material});});
  add('wheel',2180,2110,{pup:4});add('toy',2510,2110,{pup:4});
  ['turtle','octopus','starfish'].forEach((animal,i)=>add('marine',2390+i*230,2280,{pup:6,order:i,animal}));
  [...'AEIOU'].forEach((letter,i)=>add('vowel',2080+i%3*370,410+Math.floor(i/3)*390,{pup:3,order:i,letter}));
  for(let i=0;i<4;i++)add('rock',220+i*255,1690,{pup:5,order:i,number:4-i,size:100-i*17});
  ['circle','square','triangle','star'].forEach((shape,i)=>{add('piece',200+i*250,1980,{pup:5,shape,order:i});add('socket',300+i*150,2240,{pup:5,shape,order:i});});
  ['cow','pig','sheep'].forEach((animal,i)=>add('farm',1190,1650+i*240,{pup:5,order:i,animal}));
  ['azul','vermelha','amarela','verde'].forEach((color,i)=>add('seed',1210+i*95,760,{pup:2,color}));
  for(let i=0;i<5;i++)add('footprint',850+i*110,1360+Math.sin(i)*90,{pup:1,order:i});
  add('chest',1430,1320,{pup:1});
  for(let i=0;i<18;i++)add(i%3===0?'bone':'cookie',180+(i*193)%2850,760+(i*149)%1450);
  for(let i=0;i<22;i++)add('flower',170+(i*389)%2870,850+(i*229)%1350,{bloom:0});
  for(let i=0;i<8;i++)add('hydrant',140+i*200,760);
 }
 emit(kind,id,extra={}){this.events.push({kind,id,...extra});}
 say(id){this.emit('voice',id);}
 switchPup(pup){if(pup<0||pup>6)return;this.player.pup=pup;this.player.vehicle=false;this.say(NAMES[pup]+'_call');}
 toggleVehicle(){this.player.vehicle=!this.player.vehicle;this.emit('vehicle','enter');this.say(NAMES[this.player.pup]+(this.player.vehicle?'_vehicle':'_walk'));}
 jump(){if(this.player.vehicle){this.player.turbo=1.3;this.emit('turbo','turbo');}else if(this.player.jump<=0){this.player.jump=.65;this.emit('jump','jump');}}
 pending(pup=this.player.pup){
  const by=t=>this.objects.filter(o=>o.type===t&&!o.done);
  if(pup===2)return by('fire')[0]||by('seed')[0];
  if(pup===1)return this.objects.find(o=>['traffic','cat'].includes(o.type)&&!o.done)||by('footprint')[0]||by('chest')[0];
  if(pup===3)return by('vowel')[0];
  if(pup===4){if(this.player.carrying)return this.objects.find(o=>o.type===(this.player.carrying==='wheel'?'toy':'bin')&&(o.material===this.player.carrying||this.player.carrying==='wheel'));return by('waste')[0]||(!this.objects.find(o=>o.type==='toy').done?by('wheel')[0]||this.objects.find(o=>o.type==='toy'):null);}
  if(pup===5)return by('rock')[0]||(this.player.carrying?this.objects.find(o=>o.type==='socket'&&o.shape===this.player.carrying&&!o.done):by('piece')[0])||by('farm')[0];
  if(pup===6)return by('marine')[0];
  return this.objects.find(o=>o.type==='board');
 }
 instruction(){const goal=this.pending();if(!goal)return NAMES[this.player.pup]+'_instruction';if(goal.type==='seed')return 'flower_'+goal.color;if(goal.type==='fire')return 'Marshall_step'+goal.number;if(goal.type==='vowel')return 'Skye_'+goal.letter;if(goal.type==='bin')return 'Rocky_'+goal.material;if(goal.type==='toy'||goal.type==='wheel')return 'Rocky_repair';if(goal.type==='traffic')return 'Chase_'+goal.color;if(goal.type==='cat')return 'Chase_'+goal.shape;if(goal.type==='rock')return 'Rubble_next';if(['piece','socket'].includes(goal.type))return 'Rubble_bridge';if(goal.type==='farm')return 'Rubble_'+goal.animal;if(goal.type==='marine')return 'Zuma_'+goal.animal;return NAMES[this.player.pup]+'_instruction';}
 hint(){if(this.time-this.lastHint<2)return;this.lastHint=this.time;this.say(this.instruction());}
 finish(o,line){o.done=true;this.stars++;this.emit('success',o.id,{x:o.x,y:o.y});this.say(line||NAMES[this.player.pup]+'_praise');this.checkComplete();}
 checkComplete(){
  const p=this.player.pup,types={1:['traffic','cat'],2:['fire'],3:['vowel'],4:['waste','toy'],5:['rock','socket','farm'],6:['marine']}[p];
  if(types&&!this.complete.has(p)&&this.objects.filter(o=>types.includes(o.type)).every(o=>o.done)){
   this.complete.add(p);this.reward=p;this.emit('reward',NAMES[p]+'_reward');
  }
 }
 feed(){this.cookies=Math.max(0,this.cookies-1);this.emit('eat','eat');this.say('Ryder_food');this.reward=null;}
 action(){
  const p=this.player;this.emit('tool','tool',{x:p.x,y:p.y,angle:p.angle,pup:p.pup});
  const near=this.objects.filter(o=>!o.done&&distance(p,o)<145).sort((a,b)=>distance(p,a)-distance(p,b));
  // Coisas livres só tomam prioridade quando estão claramente mais perto.
  const compatible=near.filter(o=>o.pup===p.pup||['board','slide','food','hydrant','flower'].includes(o.type));
  compatible.sort((a,b)=>(distance(p,a)+(a.type==='flower'?500:a.type==='hydrant'?180:0))-(distance(p,b)+(b.type==='flower'?500:b.type==='hydrant'?180:0)));
  const o=compatible[0];if(!o){this.hint();return;}
  if(o.type==='board'){this.say(NAMES[p.pup]+'_instruction');return;}
  if(o.type==='food'){this.feed();return;}
  if(o.type==='slide'){this.slide=1;p.jump=.65;p.x=1810;p.y=1130;this.say('Ryder_slide');this.emit('slide','slide');return;}
  if(o.type==='hydrant'){if(p.pup===2){this.emit('water','water',{x:o.x,y:o.y});this.say('Marshall_instruction');}else this.hint();return;}
  if(o.type==='flower'){o.bloom=1;this.say('Ryder_star');return;}
  if(o.type==='fire'){
   const aim=Math.cos(Math.atan2(o.y-p.y,o.x-p.x)-p.angle);
   this.emit('water','water',{x:o.x,y:o.y});
   if(o!==this.pending()||aim<.25){this.hint();return;}this.finish(o,'Marshall_praise');if(!this.complete.has(2))this.say(this.instruction());return;
  }
  if(o.type==='seed'){o.bloom=1;this.finish(o,'flower_'+o.color);this.emit('water','water',{x:o.x,y:o.y});return;}
  if(['traffic','cat','vowel','marine','rock'].includes(o.type)){
   if(o!==this.pending()){this.hint();return;}
   if(o.type==='traffic'){this.traffic++;this.finish(o,'Chase_'+o.color);}
   if(o.type==='cat')this.finish(o,'Chase_'+o.shape);
   if(o.type==='vowel')this.finish(o,'Skye_'+o.letter);
   if(o.type==='marine')this.finish(o,'Zuma_'+o.animal);
   if(o.type==='rock'){this.finish(o,'Rubble_next');this.emit('dig','dig',{x:o.x,y:o.y});}
   return;
  }
  if(o.type==='waste'||o.type==='wheel'){
   if(p.carrying){this.say('Rocky_full');return;}
   if(o.type==='wheel'&&this.objects.some(k=>k.type==='waste'&&!k.done)){this.hint();return;}
   p.carrying=o.type==='wheel'?'wheel':o.material;o.done=true;this.say(o.type==='wheel'?'Rocky_repair':'Rocky_'+o.material);return;
  }
  if(o.type==='bin'){
   if(p.carrying!==o.material){this.hint();return;}p.carrying=null;this.stars++;this.emit('success',o.id,{x:o.x,y:o.y});this.say('Rocky_'+o.material);return;
  }
  if(o.type==='toy'){if(p.carrying!=='wheel'){this.hint();return;}p.carrying=null;this.finish(o,'Rocky_praise');return;}
  if(o.type==='piece'){
   if(p.carrying||this.objects.some(k=>k.type==='rock'&&!k.done)){this.hint();return;}p.carrying=o.shape;o.done=true;this.say('Rubble_bridge');return;
  }
  if(o.type==='socket'){
   if(p.carrying!==o.shape){this.hint();return;}p.carrying=null;this.bridge++;this.finish(o,'Chase_'+o.shape);return;
  }
  if(o.type==='farm'){
   if(this.objects.some(k=>k.type==='socket'&&!k.done)){this.hint();return;}this.finish(o,'Rubble_'+o.animal);this.emit('animal',o.animal);return;
  }
  if(o.type==='footprint'){
   const first=this.objects.find(k=>k.type==='footprint'&&!k.done);if(o!==first){this.hint();return;}this.finish(o,'Chase_praise');return;
  }
  if(o.type==='chest'){if(this.objects.some(k=>k.type==='footprint'&&!k.done)){this.hint();return;}this.cookies+=5;this.finish(o,'Chase_treasure');}
 }
 update(dt,axes){
  dt=Math.min(.05,Math.max(0,dt));this.time+=dt;const p=this.player;
  p.jump=Math.max(0,p.jump-dt);p.turbo=Math.max(0,p.turbo-dt);this.slide=Math.max(0,this.slide-dt);
  const len=Math.hypot(axes.x,axes.y),m=Math.min(1,len),speed=(p.vehicle?520:245)*(p.turbo>0?1.5:1);
  const dx=len>.1?axes.x/len*m*speed:0,dy=len>.1?axes.y/len*m*speed:0;
  const blend=1-Math.exp(-dt*12);p.vx+=(dx-p.vx)*blend;p.vy+=(dy-p.vy)*blend;
  if(Math.hypot(p.vx,p.vy)>8)p.angle=Math.atan2(p.vy,p.vx);
  const blocked=(x,y)=>this.obstacles.some(r=>x>r.x-20&&x<r.x+r.w+20&&y>r.y-20&&y<r.y+r.h+20);
  let x=Math.max(45,Math.min(WIDTH-45,p.x+p.vx*dt)),y=Math.max(45,Math.min(HEIGHT-45,p.y+p.vy*dt));
  if(p.jump>0||p.pup===3&&p.vehicle||!blocked(x,p.y))p.x=x;
  if(p.jump>0||p.pup===3&&p.vehicle||!blocked(p.x,y))p.y=y;
  for(const o of this.objects){
   if(!o.done&&['cookie','bone'].includes(o.type)&&distance(p,o)<55){o.done=true;this.cookies++;this.emit('collect',o.id);}
   if(o.type==='flower')o.bloom+=(distance(p,o)<140?1-o.bloom:-o.bloom)*Math.min(1,dt*2);
  }
 }
}
return {World,WIDTH,HEIGHT,NAMES,distance};
});
