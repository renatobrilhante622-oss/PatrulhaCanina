/* Simulação 3D determinística. Unidades em metros; sem dependência do renderizador. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Adventure3D=factory();})(globalThis,()=>{
'use strict';
const AREAS={farol:{x:0,z:0,label:'Farol e cidade'},selva:{x:-125,z:-100,label:'Selva do Tracker'},pista:{x:120,z:-85,label:'Grand Prix'},futebol:{x:35,z:125,label:'Estádio da Baía'}};
const NAMES=['Ryder','Chase','Marshall','Skye','Rocky','Rubble','Zuma','Tracker','Everest'];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
class World{
 constructor(){
  this.player={x:0,y:0,z:16,vx:0,vz:0,vy:0,angle:Math.PI,pup:2,vehicle:false,turbo:0,ground:0};
  this.ball={x:35,y:.8,z:125,vx:0,vy:0,vz:0,r:.8};
  this.objects=[];this.events=[];this.bones=0;this.stars=0;this.goals=0;this.time=0;this.lastAction=-10;this.goalCooldown=0;this.carry=null;this.done=new Set();
  this.obstacles=[{x:0,z:-7,r:5},{x:-131,z:-122,r:9},{x:20,z:-17,r:5},{x:-20,z:-19,r:5},{x:137,z:-110,r:6}];
  const add=(type,x,z,data={})=>this.objects.push({id:type+'-'+this.objects.length,type,x,z,done:false,...data});
  for(let i=0;i<10;i++)add('bone',-125+Math.sin(i*.7)*24,-80-i*3,{pup:7,order:i,number:i+1});
  ['monkey','toucan','frog'].forEach((animal,i)=>add('animal',-150+i*24,-123,{pup:7,animal,order:i}));
  for(let i=0;i<8;i++)add('race',120+Math.sin(i*Math.PI/4)*36,-85+Math.cos(i*Math.PI/4)*27,{order:i,shape:['circle','square','triangle','star'][i%4]});
  for(let i=0;i<5;i++)add('boost',120+Math.sin(i*1.25)*36,-85+Math.cos(i*1.25)*27);
  for(let i=0;i<5;i++)add('fire',-22+i*11,-35,{pup:2,order:i,number:i+1});
  ['papel','plastico','metal','vidro'].forEach((material,i)=>{add('waste',-25+i*8,18,{pup:4,material});add('bin',-24+i*8,32,{pup:4,material});});
  ['A','E','I','O','U'].forEach((letter,i)=>add('air',19+i*6,11,{pup:3,letter,order:i}));
  for(let i=0;i<4;i++)add('snow',-57+i*8,-13,{pup:8,order:i});
  for(let i=0;i<12;i++)add('cookie',-60+i*10,53+Math.sin(i)*5);
 }
 emit(kind,data={}){this.events.push({kind,...data});}
 switchPup(id){if(id<1||id>8)return;this.player.pup=id;this.player.vehicle=false;this.emit('voice',{id:NAMES[id]+'_call'});}
 teleport(area){const a=AREAS[area];if(!a)return;Object.assign(this.player,{x:a.x,z:a.z+16,y:0,vy:0,vx:0,vz:0,angle:Math.PI});this.emit('voice',{id:'Ryder_area_'+area});}
 toggleVehicle(){this.player.vehicle=!this.player.vehicle;this.emit('sfx',{id:'siren'});this.emit('voice',{id:NAMES[this.player.pup]+(this.player.vehicle?'_vehicle':'_walk')});}
 jump(){const p=this.player;if(p.vehicle){p.turbo=2;this.emit('sfx',{id:'engine'});}else if(p.y<=p.ground+.05){p.vy=7;this.emit('sfx',{id:'bark'});}}
 next(type){return this.objects.find(o=>o.type===type&&!o.done);}
 instruction(){const p=this.player;if(dist(p,AREAS.futebol)<65)return 'Ryder_football';if(dist(p,AREAS.pista)<60)return 'Ryder_race';if(dist(p,AREAS.selva)<60)return 'Tracker_instruction';return NAMES[p.pup]+'_instruction';}
 finish(o,id){o.done=true;this.stars++;this.emit('voice',{id});this.emit('spark',{x:o.x,y:1,z:o.z});}
 action(){
  if(this.time-this.lastAction<.45)return;this.lastAction=this.time;const p=this.player;
  if(dist(p,this.ball)<5){this.kick();return;}
  this.emit('tool',{pup:p.pup});
  const nearby=this.objects.filter(o=>!o.done&&dist(p,o)<5.5&&(o.pup===p.pup||o.type==='animal')).sort((a,b)=>dist(p,a)-dist(p,b));
  const o=nearby[0];if(!o){this.emit('voice',{id:this.instruction()});return;}
  if(o.type==='fire'){
   this.emit('water',{x:o.x,z:o.z});if(o!==this.next('fire')){this.emit('voice',{id:'Marshall_hint'});return;}
   this.finish(o,'Marshall_step'+o.number);
  }else if(o.type==='waste'){
   if(this.carry){this.emit('voice',{id:'Rocky_full'});return;}o.done=true;this.carry=o.material;this.emit('voice',{id:'Rocky_'+o.material});
  }else if(o.type==='bin'){
   if(this.carry!==o.material){this.emit('voice',{id:'Rocky_hint'});return;}this.carry=null;this.stars++;this.emit('voice',{id:'Rocky_'+o.material});this.emit('spark',{x:o.x,y:2,z:o.z});
  }else if(o.type==='air'){
   if(o!==this.next('air')){this.emit('voice',{id:'Skye_hint'});return;}this.finish(o,'Skye_'+o.letter);
  }else if(o.type==='animal')this.finish(o,'Tracker_'+o.animal);
  else if(o.type==='snow')this.finish(o,'Everest_instruction');
 }
 kick(){const p=this.player,b=this.ball;let dx=b.x-p.x,dz=b.z-p.z,l=Math.hypot(dx,dz);if(l<.1){dx=Math.sin(p.angle);dz=Math.cos(p.angle);l=1;}b.vx=dx/l*19;b.vz=dz/l*19;b.vy=6;this.emit('sfx',{id:'kick'});}
 groundHeight(x,z){if(Math.abs(x-120)>6)return 0;if(z>=-121.5&&z<=-104.5)return 1.8;if(z>-127.5&&z<-121.5)return (z+127.5)/6*1.8;if(z>-104.5&&z<-99.5)return (-99.5-z)/5*1.8;return 0;}
 update(dt,input={x:0,z:0},cameraYaw=0){
  dt=Math.max(0,Math.min(.04,dt));this.time+=dt;this.goalCooldown=Math.max(0,this.goalCooldown-dt);const p=this.player;
  const len=Math.hypot(input.x,input.z),m=Math.min(1,len),speed=(p.vehicle?18:7)*(p.turbo>0?1.55:1);p.turbo=Math.max(0,p.turbo-dt);
  const ix=len>.12?input.x/len*m:0,iz=len>.12?input.z/len*m:0;
  const dx=(ix*Math.cos(cameraYaw)+iz*Math.sin(cameraYaw))*speed,dz=(-ix*Math.sin(cameraYaw)+iz*Math.cos(cameraYaw))*speed;
  const blend=1-Math.exp(-dt*8);p.vx+=(dx-p.vx)*blend;p.vz+=(dz-p.vz)*blend;
  if(Math.hypot(p.vx,p.vz)>.25){const target=Math.atan2(p.vx,p.vz);let delta=Math.atan2(Math.sin(target-p.angle),Math.cos(target-p.angle));p.angle+=delta*Math.min(1,dt*10);}
  const nx=Math.max(-195,Math.min(195,p.x+p.vx*dt)),nz=Math.max(-175,Math.min(190,p.z+p.vz*dt));
  const flying=p.vehicle&&p.pup===3;
  const blocked=(x,z)=>!flying&&p.y<2&&this.obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+1.1);
  if(!blocked(nx,p.z))p.x=nx;if(!blocked(p.x,nz))p.z=nz;
  p.ground=this.groundHeight(p.x,p.z);if(flying){p.y+=(4-p.y)*Math.min(1,dt*4);p.vy=0;}else{p.vy-=18*dt;p.y+=p.vy*dt;if(p.y<p.ground){p.y=p.ground;p.vy=0;}}
  for(const o of this.objects){
   if(o.done)continue;
   if(['bone','race','cookie'].includes(o.type)&&dist(p,o)<2.5){
    if(o.type==='bone'&&o!==this.next('bone'))continue;
    if(o.type==='race'&&!p.vehicle)continue;
    o.done=true;if(o.type==='bone'){this.bones++;this.emit('voice',{id:'Tracker_bone'+o.number});}else if(o.type==='race'){this.stars++;this.emit('voice',{id:'Chase_'+o.shape});}else this.bones++;
    this.emit('sfx',{id:'collect'});this.emit('spark',{x:o.x,y:2,z:o.z});
   }
   if(o.type==='boost'&&p.vehicle&&dist(p,o)<2.8)p.turbo=1.5;
  }
  this.updateBall(dt);
 }
 updateBall(dt){
  const b=this.ball,p=this.player;
  if(dist(p,b)<b.r+1.1&&p.y<1.5){let dx=b.x-p.x,dz=b.z-p.z,l=Math.max(.01,Math.hypot(dx,dz));if(l<.02){dx=Math.sin(p.angle);dz=Math.cos(p.angle);l=1;}b.x=p.x+dx/l*2;b.z=p.z+dz/l*2;b.vx=dx/l*(p.vehicle?12:5)+p.vx*.5;b.vz=dz/l*(p.vehicle?12:5)+p.vz*.5;}
  b.vy-=12*dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;
  if(b.y<b.r){b.y=b.r;if(b.vy<-.7)b.vy=-b.vy*.55;else b.vy=0;}
  const friction=Math.exp(-dt*(b.y<=b.r+.1?1.05:.14));b.vx*=friction;b.vz*=friction;
  // Estádio: limites laterais e gols com boca de 12 metros.
  if(b.x<12||b.x>58){b.x=Math.max(12,Math.min(58,b.x));b.vx*=-.65;}
  if(b.z<92||b.z>158){
   if(Math.abs(b.x-35)<6&&b.y<4.6&&this.goalCooldown===0){
    this.goals++;this.goalCooldown=2.5;this.emit('goal',{number:this.goals});this.emit('voice',{id:this.goals<=10?'Ryder_goal'+this.goals:'Ryder_praise'});this.emit('sfx',{id:'crowd'});Object.assign(b,{x:35,y:2,z:125,vx:0,vy:0,vz:0});
   }else{b.z=Math.max(92,Math.min(158,b.z));b.vz*=-.6;}
  }
 }
}
return {World,AREAS,NAMES,dist};
});
