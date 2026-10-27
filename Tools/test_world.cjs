const assert=require('node:assert/strict');const {World,AREAS}=require('../app/src/main/assets/game/world.js');
const w=new World();let start={...w.player};for(let i=0;i<120;i++)w.update(1/60,{x:1,z:0},0);assert.ok(w.player.x>start.x+8);w.jump();w.update(.02);assert.ok(w.player.y>0);for(let i=0;i<120;i++)w.update(1/60);assert.equal(w.player.y,0);
w.toggleVehicle();assert.ok(w.player.vehicle);w.jump();assert.ok(w.player.turbo>0);const p={...w.player};w.switchPup(7);assert.equal(w.player.x,p.x);assert.equal(w.player.z,p.z);
w.teleport('selva');assert.equal(w.player.x,AREAS.selva.x);for(let n=1;n<=10;n++){const o=w.next('bone');w.player.x=o.x;w.player.z=o.z;w.update(.02);}assert.equal(w.bones,10);
for(const animal of w.objects.filter(o=>o.type==='animal')){w.player.x=animal.x;w.player.z=animal.z;w.time+=1;w.action();assert.equal(animal.done,true);}
w.switchPup(2);let wrong=w.objects.find(o=>o.type==='fire'&&o.number===5);w.player.x=wrong.x;w.player.z=wrong.z;w.time++;w.action();assert.equal(wrong.done,false);
while(w.next('fire')){const o=w.next('fire');w.player.x=o.x;w.player.z=o.z;w.time++;w.action();}assert.equal(w.objects.filter(o=>o.type==='fire'&&o.done).length,5);
w.switchPup(4);for(const waste of w.objects.filter(o=>o.type==='waste')){w.player.x=waste.x;w.player.z=waste.z;w.time++;w.action();assert.equal(w.carry,waste.material);const bin=w.objects.find(o=>o.type==='bin'&&o.material===waste.material);w.player.x=bin.x;w.player.z=bin.z;w.time++;w.action();assert.equal(w.carry,null);}
w.switchPup(3);while(w.next('air')){const o=w.next('air');w.player.x=o.x;w.player.z=o.z;w.time++;w.action();}
w.switchPup(8);while(w.next('snow')){const o=w.next('snow');w.player.x=o.x;w.player.z=o.z;w.time++;w.action();}
const ballWorld=new World();ballWorld.teleport('futebol');Object.assign(ballWorld.player,{x:35,z:129,angle:Math.PI});ballWorld.action();assert.ok(ballWorld.ball.vz<0);assert.ok(ballWorld.ball.vy>0);let maxY=0;for(let i=0;i<120;i++){ballWorld.update(.016);maxY=Math.max(maxY,ballWorld.ball.y);}assert.ok(maxY>1);assert.ok(ballWorld.ball.y>=ballWorld.ball.r);
Object.assign(ballWorld.ball,{x:35,y:1,z:157.9,vz:5,vx:0});ballWorld.goalCooldown=0;ballWorld.player.x=0;ballWorld.update(.04);assert.equal(ballWorld.goals,1);assert.equal(ballWorld.ball.z,125);assert.ok(ballWorld.events.some(e=>e.kind==='goal'));
assert.ok(w.groundHeight(120,-113)>1);assert.ok(w.groundHeight(120,-126)<w.groundHeight(120,-113));
console.log('3D: movimento relativo à câmera, pulo, turbo, troca, selva numerada, resgates, reciclagem, voo, neve, rampa e física/gol aprovados.');
