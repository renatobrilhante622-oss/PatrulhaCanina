const assert=require('node:assert/strict');const {World}=require('../app/src/main/assets/game/world.js');const {Store,KEY}=require('../app/src/main/assets/game/save.js');const {Campaign,MISSIONS}=require('../app/src/main/assets/game/campaign.js');
const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
const save=new Store(storage);save.options({voice:.4,music:.1,sfx:.7,joystick:1.3,quality:'low',fps:30});
const w=new World(),c=new Campaign(w,save);w.campaign=c;
function depart(){assert.equal(c.phase,'call');c.advanceRitual();assert.equal(c.phase,'briefing');c.advanceRitual();assert.equal(c.phase,'departure');for(let i=0;i<70;i++)w.update(.04);assert.equal(c.phase,'play');}
for(const def of MISSIONS){
 c.start(def.id);depart();let guard=0;
 while(c.phase==='play'&&guard++<60){const target=c.target(),before=c.index;assert.ok(target);
  if(def.id===1&&before===0){const wrong=w.objects.find(o=>o.mission===1&&o.stepIndex===9);w.player.x=wrong.x;w.player.z=wrong.z;w.time++;w.action();assert.equal(c.index,0,'Erro numérico não avança');}
  if(target.mode==='goal'){
   const wrong=target.end==='north'?'south':'north';w.emit('goal',{number:1,end:wrong});assert.equal(c.index,before,'Gol na cor errada continua sem penalidade');
   w.player.x=0;w.goalCooldown=0;Object.assign(w.ball,{x:35,y:1,z:target.end==='north'?92.05:157.95,vx:0,vz:target.end==='north'?-6:6});w.update(.04);
  }else{
   Object.assign(w.player,{x:target.x,z:target.z,vx:0,vz:0,vehicle:!!target.vehicle||['drive','fly'].includes(target.mode),y:target.mode==='fly'||target.kind==='chicken'?10:0});
   w.time++;
   if(target.mode)w.update(.04);else w.action();
  }
  assert.equal(c.index,before+1,`Missão ${def.id} objetivo ${before} (${target.kind}) deve executar`);
 }
 assert.equal(c.phase,'reward');assert.equal(save.data.missions[def.id-1],3);assert.ok(save.data.stickers.includes(def.id));
 console.log(`Campanha ${def.id}: ritual e ${def.steps.length} objetivos aprovados.`);
}
const reloaded=new Store(storage);assert.deepEqual(reloaded.data.missions,Array(12).fill(3));assert.equal(reloaded.data.stickers.length,12);assert.equal(reloaded.data.options.voice,.4);assert.equal(reloaded.data.options.fps,30);assert.equal(reloaded.data.cookies,36);assert.equal(reloaded.feed(),true);assert.equal(new Store(storage).data.cookies,35);
c.start(4);depart();const take=c.target();Object.assign(w.player,{x:take.x,z:take.z});w.time++;w.action();assert.equal(c.carry,'papel');
const w2=new World(),c2=new Campaign(w2,new Store(storage));w2.campaign=c2;c2.start(4,true);assert.equal(c2.index,1);assert.equal(c2.carry,'papel');
const bad=new Store({getItem:()=>'{inválido',setItem:()=>{}});assert.equal(bad.data.missions.length,12);
const blocked=new Store({getItem:()=>null,setItem:()=>{throw Error('sem espaço');}});assert.equal(blocked.write(),false);
assert.ok(JSON.parse(values.get(KEY)).active);console.log('Save: 12 missões, biscoitos, álbum, volumes, checkpoint com material, corrupção e falta de espaço aprovados.');
