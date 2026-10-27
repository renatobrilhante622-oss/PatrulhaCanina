const assert=require('node:assert/strict');
const {World}=require('../app/src/main/assets/game/world.js');
const w=new World();
// Ordens educativas e requisitos são reais, sem tempo limite nem perda de progresso.
for(const pup of [2,1,4,3,5,6]){
 w.switchPup(pup);w.events=[];let safety=0;
 while(!w.complete.has(pup)&&safety++<90){
  const target=w.pending();assert.ok(target,`Objetivo do personagem ${pup}`);
  w.player.x=target.x-65;w.player.y=target.y;w.player.angle=0;
  const before=w.stars;w.action();assert.ok(w.stars>=before,'Sem punição por erro');
 }
 assert.ok(w.complete.has(pup),`Missão ${pup} deve completar`);assert.ok(safety<90);
 w.feed();
 console.log(`Missão ${pup}: ${safety} interações de exploração aprovadas.`);
}
const q=new World();q.switchPup(2);const wrong=q.objects.find(o=>o.type==='fire'&&o.number===10);q.player.x=wrong.x-65;q.player.y=wrong.y;q.player.angle=0;q.action();assert.equal(wrong.done,false);
q.switchPup(4);const bin=q.objects.find(o=>o.type==='bin');q.player.x=bin.x;q.player.y=bin.y;q.action();assert.equal(q.player.carrying,null);
const start={...q.player};q.update(.05,{x:1,y:0});assert.ok(q.player.x>start.x);q.toggleVehicle();assert.equal(q.player.vehicle,true);q.jump();assert.ok(q.player.turbo>0);
const position={x:q.player.x,y:q.player.y};q.switchPup(3);assert.equal(q.player.x,position.x);assert.equal(q.player.y,position.y);
console.log('Ordens, erros gentis, veículos e troca sem teleporte aprovados.');
