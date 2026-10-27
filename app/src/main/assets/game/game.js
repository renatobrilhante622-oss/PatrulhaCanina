/* Mundo 3D real e inteiramente offline. Malhas, sombras, câmera e interfaces originais. */
'use strict';
(()=>{
const T=THREE,M=AdventureModels,S=Adventure3D,canvas=document.getElementById('game'),audio=new AdventureAudio(),world=new S.World();
const ui=document.getElementById('interface'),info=document.getElementById('objective'),score=document.getElementById('score'),modal=document.getElementById('modal'),map=document.getElementById('radar'),mc=map.getContext('2d');
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){document.getElementById('webgl-error').hidden=false;return;}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const scene=new T.Scene();scene.background=new T.Color(0x80c9e6);scene.fog=new T.FogExp2(0x9dd3e6,.0036);
const skyFaces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=64;const context=c.getContext('2d'),g=context.createLinearGradient(0,0,0,64);g.addColorStop(0,i===2?'#68b8e4':'#6dbce8');g.addColorStop(1,'#c2e4ed');context.fillStyle=g;context.fillRect(0,0,64,64);return c;});const skybox=new T.CubeTexture(skyFaces);skybox.needsUpdate=true;skybox.colorSpace=T.SRGBColorSpace;scene.background=skybox;
const camera=new T.PerspectiveCamera(60,innerWidth/innerHeight,.15,500);
const mapCamera=new T.OrthographicCamera(-66,66,50,-50,.1,180);mapCamera.up.set(0,0,-1);
const mapTarget=new T.WebGLRenderTarget(192,144),mapScene=new T.Scene(),mapQuad=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({map:mapTarget.texture,depthTest:false,depthWrite:false}));mapScene.add(mapQuad);const mapQuadCamera=new T.OrthographicCamera(-1,1,1,-1,.1,3);mapQuadCamera.position.z=1;
const mapMarker=M.mesh(new T.ConeGeometry(1.2,2,3),0xf0a863,scene);mapMarker.visible=false;scene.add(new T.HemisphereLight(0xd5edff,0x8da675,2));
const sun=new T.DirectionalLight(0xfff0d0,3);sun.position.set(35,65,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:150});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;scene.add(sun,sun.target);
const ground=M.mesh(new T.PlaneGeometry(400,400),0x7eb56c,scene,0,-.035,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
const scenery=[],collisionMeshes=[],interactive=new Map(),animated=[],particles=[];
const v=new T.Vector3(),desired=new T.Vector3(),look=new T.Vector3(),ray=new T.Raycaster();
function place(group,x,z,y=0,distance=105){group.position.set(x,y,z);scene.add(group);scenery.push({group,x,z,distance});return group;}
function flat(x,z,w,d,color,y=.01){const mesh=M.block(scene,color,x,y,z,w,.08,d);mesh.castShadow=false;return mesh;}
function textSprite(text,color='#233c49',size=1.2){const c=document.createElement('canvas');c.width=256;c.height=96;const cx=c.getContext('2d');cx.fillStyle='#fff4d8';cx.fillRect(0,0,256,96);cx.fillStyle=color;cx.font='bold 46px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(text,128,48);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true}));s.scale.set(size*2.66,size,1);return s;}
function house(x,z,color=0xe6cca4,clock=false){const g=new T.Group();M.block(g,color,0,3,0,9,6,8);const roof=M.mesh(new T.ConeGeometry(7,4,4),0xb36955,g,0,8,0);roof.rotation.y=Math.PI/4;
 M.block(g,0x537f92,0,1.6,4.03,1.8,3.2,.08);for(const side of [-1,1])M.block(g,0xa4d1da,side*2.7,3.8,4.05,1.4,1.8,.08);
 if(clock){M.tube(g,0xdcc6a2,0,7,0,2,10);const face=M.mesh(new T.CircleGeometry(1.2,24),0xffefd0,g,0,10,2.05);M.block(g,0x566c70,0,10.4,2.1,.08,.8,.1);M.block(g,0x566c70,.3,10,2.1,.7,.08,.1);}
 place(g,x,z,0,150);g.traverse(m=>{if(m.isMesh)collisionMeshes.push(m);});return g;}
function mountain(x,z,scale,color){const g=new T.Group();const m=M.mesh(new T.ConeGeometry(scale*.6,scale,6),color,g,0,scale/2,0);M.mesh(new T.ConeGeometry(scale*.23,scale*.35,6),0xd7e3d9,g,0,scale*.84,0);place(g,x,z,0,400);}
function fence(x,z,width,angle=0){const g=new T.Group();for(let i=0;i<=width;i+=3)M.block(g,0xb38e5c,i-width/2,1,0,.22,2,.22);for(const y of [.55,1.4])M.block(g,0xd3b47c,0,y,0,width,.16,.14);g.rotation.y=angle;place(g,x,z,0,95);}
function path(x,z,w,d,color=0xb4aa93){return flat(x,z,w,d,color);}
function water(x,z,w,d){const g=new T.Mesh(new T.PlaneGeometry(w,d,10,10),new T.MeshStandardMaterial({color:0x4baac9,roughness:.3,metalness:.18}));g.rotation.x=-Math.PI/2;g.position.set(x,-.09,z);g.receiveShadow=true;scene.add(g);animated.push({type:'water',mesh:g});return g;}
function makeWorld(){
 water(70,-155,240,50);water(-165,80,65,220);flat(-145,75,30,220,0xe9d09c);
 path(-62,-50,18,125,0xd0bb91);path(52,-40,125,16,0xc4baa0);path(17,65,16,120,0xd1bc94);
 // Farol central, torre, veículos estacionados e cidade.
 const tower=new T.Group();M.tube(tower,0xf2e7c7,0,8,0,3.8,16);M.tube(tower,0xc65d55,0,8,0,3.9,2);M.tube(tower,0x9ec8d2,0,17,0,3.2,3);M.mesh(new T.ConeGeometry(4.5,3,16),0xbb6254,tower,0,20,0);M.block(tower,0x567c8d,0,2,3.78,1.8,4,.12);place(tower,0,-7,0,250);
 house(-20,-19);house(20,-17,0xd2d8b5);flat(0,3,50,12,0xd7c599);flat(0,-35,65,14,0x778994);
 for(let i=0;i<14;i++)flat(-29+i*4.5,-35,2,.15,0xebe6cd,.07);
 for(let i=1;i<=8;i++){const parked=M.vehicle(i);parked.scale.setScalar(.8);place(parked,-32+i*7,42,0,70);}
 const ryder=new T.Group();M.ball(ryder,0xd8b697,0,2.25,0,.4,.48,.4);M.block(ryder,0xcf5b54,0,1.35,0,.8,1.1,.5);M.block(ryder,0xdce6db,0,1.7,.08,.85,.5,.55);for(const side of [-1,1]){M.block(ryder,0x467592,side*.23,.5,0,.32,.9,.35);M.ball(ryder,0xd8b697,side*.58,1.4,0,.17,.5,.17);}place(ryder,-6,7,0,75);
 const sign=textSprite('FAROL',undefined,2);sign.position.set(0,3,9);scene.add(sign);
 // Selva tropical: trilha de lajes, paredões, templo, vegetação e animais.
 flat(-125,-100,85,70,0xb09a73);for(let i=0;i<30;i++){const x=-148+i%6*9,z=-75-Math.floor(i/6)*9;const slab=M.block(scene,0xe1d5b8,x,.07,z,7.5,.25,6.5);slab.rotation.y=(i%3-1)*.09;}
 for(let i=0;i<28;i++){const angle=i*2.399,x=-125+Math.cos(angle)*(28+i%3*10),z=-100+Math.sin(angle)*(25+i%4*8);const palm=M.palm();palm.rotation.y=angle;place(palm,x,z,0,125);animated.push({type:'palm',mesh:palm});}
 const temple=new T.Group();for(let i=0;i<4;i++)M.block(temple,0xb8b596,0,i*.85,0,22-i*3,1.2,17-i*2);for(const side of [-1,1])M.tube(temple,0xc4c0a1,side*5,5,0,1,7);M.block(temple,0x607e72,0,4.2,3,4,6,.2);M.block(temple,0xc8c1a2,0,8,0,14,2,8);place(temple,-131,-122,0,160);
 for(let i=0;i<20;i++){const g=new T.Group();M.ball(g,0x8b9a83,0,2,0,4+i%3,2+i%4,3);M.ball(g,0x829480,2,4,-1,3,4,3);place(g,-173+i*4.8,-143-Math.sin(i)*7,0,160);}
 for(let i=0;i<18;i++){const g=new T.Group();for(let j=0;j<4;j++){const leaf=M.ball(g,0x528b5d,Math.sin(j*1.57),1,Math.cos(j*1.57),.3,1.4,.6);leaf.rotation.z=j*.5;}M.ball(g,i%2?0xdc8060:0xe6a459,0,2.1,0,.35);place(g,-165+(i*13)%75,-135+(i*17)%65);}
 for(let i=0;i<6;i++){const g=new T.Group();M.tube(g,0x9d7954,0,.8,0,.55,1.6);for(const y of [.2,1.3])M.tube(g,0x6c7c75,0,y,0,.58,.1);place(g,-155+i*10,-64,0,85);}
 // Circuito oval de paralelepípedos e ponte sobre água.
 flat(120,-85,100,80,0x7daa72);
 const track=new T.Group();const steps=100;
 for(let i=0;i<steps;i++){
  const a=i/steps*Math.PI*2,b=(i+1)/steps*Math.PI*2;const x=120+Math.sin(a)*36,z=-85+Math.cos(a)*27;
  const tile=M.block(track,i%2?0x9ca5a0:0xa9ada5,x,.03,z,3,.15,10);tile.rotation.y=a;
  if(i%4===0){for(const side of [-1,1]){const curb=M.block(track,i%8?0xeee4cc:0xb76d62,120+Math.sin(a)*(36+side*5),.35,-85+Math.cos(a)*(27+side*5),3.5,.6,1.2);curb.rotation.y=a;}}
 }
 scene.add(track);
 water(120,-117,27,18);
 const bridge=new T.Group();M.block(bridge,0xb4b9ae,0,1.65,0,12,.35,17);for(const side of [-1,1]){M.block(bridge,0xd6cbb5,side*6,2.4,0,.5,1.4,18);for(const z of [-7,0,7])M.block(bridge,0x9dafa9,side*5,.7,z,1,2,1);}place(bridge,120,-113,0,180);
 // Rampas combinam com a altura de colisão do modelo; são suaves nas extremidades.
 for(const z of [-124,-103]){const ramp=M.block(scene,0xa7afa7,120,.8,z,12,.2,7);ramp.rotation.x=z<-110?-.24:.24;}
 for(let i=0;i<18;i++){const a=i*Math.PI*2/18;const tree=M.pine();tree.scale.setScalar(.8+i%3*.2);place(tree,120+Math.sin(a)*52,-85+Math.cos(a)*43,0,130);}
 for(let i=0;i<8;i++){const a=i*Math.PI/4,g=new T.Group();M.tube(g,0xd7d9ce,0,3,0,.1,6);M.block(g,i%2?0xc95757:0x527da9,1.1,5.2,0,2.1,1.3,.05);M.block(g,0xf0d278,1.1,5.05,.1,1,.15,.08);for(let k=0;k<3;k++)M.mesh(new T.ConeGeometry(.18,.4,3),0xf0d278,g,.75+k*.35,5.3,.1);place(g,120+Math.sin(a)*47,-85+Math.cos(a)*38);}
 house(137,-110,0xebd8af,true);
 // Estádio 3D completo: gramado, pista, linhas, redes e arquibancadas.
 flat(35,125,60,84,0xb97261);flat(35,125,46,66,0x4e9b67,.1);
 for(let i=0;i<11;i++)flat(35,95+i*6,46,3,0x559e69,.16);
 const stripe=(x,z,w,d)=>flat(x,z,w,d,0xf2eddb,.22);
 stripe(35,92,46,.18);stripe(35,158,46,.18);stripe(12,125,.18,66);stripe(58,125,.18,66);stripe(35,125,46,.18);
 const circle=M.mesh(new T.TorusGeometry(7,.09,4,64),0xf1e7ce,scene,35,.24,125);circle.rotation.x=Math.PI/2;
 for(const end of [-1,1]){const z=125+end*33;stripe(35,z-end*8,24,.18);stripe(23,z-end*4,.18,8);stripe(47,z-end*4,.18,8);
  const g=new T.Group();for(const side of [-1,1])M.line(g,new T.Vector3(side*6,0,0),new T.Vector3(side*6,4.5,0),.15,0xf8f4df);M.line(g,new T.Vector3(-6,4.5,0),new T.Vector3(6,4.5,0),.15,0xf8f4df);
  for(let i=0;i<=12;i++){const x=-6+i;M.line(g,new T.Vector3(x,0,end*3),new T.Vector3(x,4.5,0),.025,0xe9ecdd);}
  for(let y=0;y<=4.5;y+=.6)M.line(g,new T.Vector3(-6,y,end*(3-y/1.5)),new T.Vector3(6,y,end*(3-y/1.5)),.025,0xe9ecdd);
  place(g,35,z,0,140);flat(35,z-end*1.5,12,4,0x9fa277,.18);
 }
 fence(35,81,62);fence(35,169,62);fence(3,125,85,Math.PI/2);fence(67,125,85,Math.PI/2);
 for(const side of [-1,1]){const g=new T.Group();for(let row=0;row<4;row++)M.block(g,row%2?0xc5d0bf:0xbec7b5,0,row*.8,0,5+row*1.6,.6,48);place(g,35+side*37,125,0,130);}
 const crowd=new T.InstancedMesh(new T.SphereGeometry(.35,8,6),M.material(0xffffff),80),dummy=new T.Object3D();
 for(let i=0;i<80;i++){const side=i%2?1:-1,row=Math.floor(i/20);dummy.position.set(35+side*(37+row),1+row*.8,104+(i%20)*2.2);dummy.scale.set(1,1.4,1);dummy.updateMatrix();crowd.setMatrixAt(i,dummy.matrix);crowd.setColorAt(i,new T.Color(M.COLORS[1+i%8]));}scene.add(crowd);
 // Horizonte com montanhas e nuvens volumétricas.
 for(let i=0;i<18;i++){const a=i*Math.PI*2/18;mountain(Math.sin(a)*195,Math.cos(a)*190,20+i%4*8,0x829d91);}
 for(let i=0;i<12;i++){const g=new T.Group();for(let j=0;j<4;j++){const cloud=M.ball(g,0xf1f6eb,j*3,0,0,4,2.3,2.5);cloud.castShadow=false;}place(g,-170+(i*47)%330,-160+(i*83)%340,30+i%3*8,400);animated.push({type:'cloud',mesh:g,origin:g.position.x});}
 const airship=new T.Group();M.ball(airship,0x9568ac,0,0,0,9,3.7,3.7);M.block(airship,0xc3a9ca,0,-4,0,4,1.5,2);M.block(airship,0x694f89,-8,1,0,.4,5,4);place(airship,-90,-60,38,500);animated.push({type:'airship',mesh:airship});
 for(let i=0;i<24;i++){const tree=M.pine();place(tree,-20+(i*31)%185,70+(i*17)%100,0,105);}
}
makeWorld();
const pupModels=Array.from({length:9},(_,i)=>M.pup(i)),carModels=Array.from({length:9},(_,i)=>M.vehicle(i));
for(const model of [...pupModels,...carModels]){scene.add(model);model.visible=false;}
const keeper=M.pup(6);scene.add(keeper);keeper.position.set(35,0,152);keeper.rotation.y=Math.PI;
const ballGeometry=new T.IcosahedronGeometry(.8,1),positions=ballGeometry.attributes.position,faceColors=[];
for(let i=0;i<positions.count;i++){const face=Math.floor(i/3),color=new T.Color(face%5===0?0x2c4550:0xf1eee0);faceColors.push(color.r,color.g,color.b);}
ballGeometry.setAttribute('color',new T.Float32BufferAttribute(faceColors,3));const football=new T.Mesh(ballGeometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.75}));football.castShadow=true;football.receiveShadow=true;scene.add(football);
function makeObject(o){let g=new T.Group();
 if(o.type==='bone'){g.add(M.bone());const n=textSprite(String(o.number),'#755532',.6);n.position.y=1.1;g.add(n);}
 if(o.type==='animal')g.add(M.animal(o.animal));
 if(o.type==='race')g.add(M.shapeMesh(o.shape,0xf0ce72));
 if(o.type==='boost'){const m=M.block(g,0x78cfd0,0,0,0,3,.12,3);m.material=new T.MeshStandardMaterial({color:0x62c7cd,emissive:0x23676e,emissiveIntensity:.6});}
 if(o.type==='fire'){for(let i=0;i<4;i++){const m=M.mesh(new T.ConeGeometry(.65,2.6,7),i%2?0xf0c45e:0xe78d4f,g,Math.sin(i*2)*.45,1,Math.cos(i*2)*.45);m.rotation.z=(i-1.5)*.17;}const n=textSprite(String(o.number),'#b74e39',.8);n.position.y=3;g.add(n);}
 if(o.type==='bin'){const color={papel:0x4989b9,plastico:0xc86a61,metal:0xd6b351,vidro:0x659f71}[o.material];M.block(g,color,0,.8,0,1.4,1.6,1.3);M.block(g,color,0,1.7,0,1.55,.18,1.4);const n=textSprite(o.material,undefined,.55);n.position.set(0,2.3,0);g.add(n);}
 if(o.type==='waste'){const m=M.tube(g,0xc4d9ce,0,.5,0,.3,.9);if(o.material==='papel'){m.visible=false;M.block(g,0xf0e4c3,0,.2,0,.8,.12,1);}}
 if(o.type==='air'){g.add(M.shapeMesh('star',0xf1cd75));const n=textSprite(o.letter,'#8b5580',.9);n.position.y=1.6;g.add(n);}
 if(o.type==='snow'){M.ball(g,0xe1f1eb,0,.8,0,1.3,.8,1);}
 if(o.type==='cookie'){M.tube(g,0xd1aa6e,0,.5,0,.35,.18);for(let i=0;i<3;i++)M.ball(g,0x8b7155,Math.sin(i*2)*.2,.62,Math.cos(i*2)*.2,.04);}
 g.position.set(o.x,['bone','race'].includes(o.type)?1.1:o.type==='air'?4:0,o.z);scene.add(g);interactive.set(o.id,g);return g;
}
world.objects.forEach(makeObject);
let yaw=0,pitch=.4,cameraDrag=null,lastManualCamera=-10,time=0,last=0,modalOpen=false,selection='pups',currentActor=null,toolLife=0,actionHeld=false,actionCooldown=0;
const joystick={id:null,x:0,y:0},keyset=new Set(),padPrevious=[];
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();document.getElementById('rotate').hidden=innerWidth>=innerHeight;}
window.addEventListener('resize',resize);resize();
function selectPup(id){world.switchPup(id);closeModal();audio.cancel();audio.say(S.NAMES[id]+'_call');world.events=world.events.filter(e=>e.kind!=='voice');}
function openModal(type){modalOpen=true;selection=type;joystick.x=joystick.y=0;joystick.id=null;modal.replaceChildren();const heading=document.createElement('h2');heading.textContent=type==='pups'?'Escolha seu amigo':'Para onde vamos?';modal.append(heading);
 const options=type==='pups'?S.NAMES.slice(1).map((name,i)=>[name,i+1]):Object.entries(S.AREAS).map(([id,a])=>[a.label,id]);
 for(const [name,id]of options){const b=document.createElement('button');b.textContent=name;b.style.background=type==='pups'?'#'+M.COLORS[id].toString(16).padStart(6,'0'):'#467c94';b.onclick=()=>{audio.unlock();if(type==='pups')selectPup(id);else{world.teleport(id);yaw=0;snapCamera=true;closeModal();}};modal.append(b);}
 const close=document.createElement('button');close.textContent='Continuar';close.onclick=closeModal;modal.append(close);modal.hidden=false;
}
function closeModal(){modal.hidden=true;modalOpen=false;}
function doAction(id){audio.unlock();if(id==='friends'){openModal('pups');return;}if(id==='areas'){openModal('areas');return;}if(modalOpen)return;
 if(id==='jump')world.jump();if(id==='vehicle')world.toggleVehicle();if(id==='tool')world.action();if(id==='repeat'){audio.cancel();audio.say(world.instruction(),true);}if(id==='mute'){audio.mute();document.getElementById('mute').textContent=audio.muted?'Som desligado':'Som ligado';}
}
for(const b of document.querySelectorAll('[data-action]'))b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();doAction(b.dataset.action);if(b.dataset.action==='tool')actionHeld=true;});
window.addEventListener('pointerup',()=>{actionHeld=false;});window.addEventListener('pointercancel',()=>{actionHeld=false;});
const joy=document.getElementById('joystick'),knob=document.getElementById('knob');
function moveJoy(e){const r=joy.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,len=Math.hypot(x,y),max=r.width*.32;const value=Math.min(1,len/max);joystick.x=len>3?x/len*value:0;joystick.y=len>3?y/len*value:0;knob.style.transform=`translate(${joystick.x*max}px,${joystick.y*max}px)`;}
joy.addEventListener('pointerdown',e=>{e.preventDefault();audio.unlock();if(joystick.id!==null)return;joystick.id=e.pointerId;joy.setPointerCapture(e.pointerId);moveJoy(e);});joy.addEventListener('pointermove',e=>{if(joystick.id===e.pointerId)moveJoy(e);});
function releaseJoy(e){if(joystick.id===e.pointerId){joystick.id=null;joystick.x=joystick.y=0;knob.style.transform='translate(0,0)';}}
joy.addEventListener('pointerup',releaseJoy);joy.addEventListener('pointercancel',releaseJoy);joy.addEventListener('lostpointercapture',releaseJoy);
canvas.addEventListener('pointerdown',e=>{audio.unlock();if(e.clientX<innerWidth*.4)return;canvas.setPointerCapture(e.pointerId);cameraDrag={id:e.pointerId,x:e.clientX,y:e.clientY};});canvas.addEventListener('pointermove',e=>{if(cameraDrag&&cameraDrag.id===e.pointerId){yaw-=(e.clientX-cameraDrag.x)*.005;pitch=Math.max(.1,Math.min(1,pitch+(e.clientY-cameraDrag.y)*.004));cameraDrag.x=e.clientX;cameraDrag.y=e.clientY;lastManualCamera=time;}});canvas.addEventListener('pointerup',()=>cameraDrag=null);canvas.addEventListener('pointercancel',()=>cameraDrag=null);
window.addEventListener('keydown',e=>{if(e.repeat)return;keyset.add(e.key);audio.unlock();if(e.key===' ')doAction('jump');if(e.key==='j')doAction('tool');if(e.key==='k')doAction('vehicle');if(e.key==='l')doAction('friends');if(e.key==='m')doAction('areas');});window.addEventListener('keyup',e=>keyset.delete(e.key));
function reset(){keyset.clear();joystick.id=null;joystick.x=joystick.y=0;knob.style.transform='translate(0,0)';cameraDrag=null;actionHeld=false;world.player.vx=world.player.vz=0;}
window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden){reset();if(audio.context)audio.context.suspend().catch(()=>{});}});
function getAxes(){let x=joystick.x,z=joystick.y;if(joystick.id===null){x=(keyset.has('d')||keyset.has('ArrowRight')?1:0)-(keyset.has('a')||keyset.has('ArrowLeft')?1:0);z=(keyset.has('s')||keyset.has('ArrowDown')?1:0)-(keyset.has('w')||keyset.has('ArrowUp')?1:0);}
 const pad=navigator.getGamepads&&Array.from(navigator.getGamepads()).find(p=>p&&p.connected);if(pad){if(Math.abs(pad.axes[0])>.15||Math.abs(pad.axes[1])>.15){x=pad.axes[0];z=pad.axes[1];}const actions=['tool','jump','vehicle','friends','areas'];actions.forEach((id,i)=>{const pressed=!!pad.buttons[i]&&pad.buttons[i].pressed;if(pressed&&!padPrevious[i])doAction(id);padPrevious[i]=pressed;});if(Math.abs(pad.axes[2]||0)>.2){yaw-=pad.axes[2]*.035;lastManualCamera=time;}}
 return {x,z};}
function burst(x,y,z,count=24,color=0xf6d77f){for(let i=0;i<count;i++){const m=M.mesh(new T.SphereGeometry(.08,5,4),color,scene,x,y,z);m.castShadow=false;particles.push({mesh:m,vx:(Math.random()-.5)*7,vy:Math.random()*6+2,vz:(Math.random()-.5)*7,life:1.5});}}
function handleEvents(){for(const e of world.events.splice(0)){
 if(e.kind==='voice')audio.say(e.id,true);if(e.kind==='sfx')audio.effect(e.id);
 if(e.kind==='spark')burst(e.x,e.y,e.z,12);
 if(e.kind==='goal'){football.material.color.setHex([0x75bddd,0xe68e86,0xf0d274][world.goals%3]);audio.effect('whistle');burst(35,6,125,40,0xedcd6c);burst(23,9,150,30,0xdd9cb9);burst(47,9,100,30,0x8ed2ce);score.classList.add('celebrate');setTimeout(()=>score.classList.remove('celebrate'),1000);}
 if(e.kind==='water'){audio.effect('water');for(let i=0;i<25;i++){const p=world.player,m=M.mesh(new T.SphereGeometry(.09,5,4),0xaddde4,scene,p.x,p.y+1,p.z);m.castShadow=false;particles.push({mesh:m,vx:(e.x-p.x)*1.8+(Math.random()-.5),vy:3+Math.random(),vz:(e.z-p.z)*1.8+(Math.random()-.5),life:.65});}}
 if(e.kind==='tool')toolLife=.7;
}}
function renderMap(){mc.clearRect(0,0,180,140);mc.fillStyle='#a7c28e';mc.fillRect(0,0,180,140);mc.fillStyle='#65b6cb';mc.fillRect(0,0,180,18);for(const [id,a]of Object.entries(S.AREAS)){const x=(a.x+200)/400*180,z=(a.z+200)/400*140;mc.fillStyle=id==='futebol'?'#f8e5b3':'#608d74';mc.fillRect(x-7,z-5,14,10);}for(const o of world.objects)if(!o.done&&['bone','race','fire','air'].includes(o.type)){mc.fillStyle='#e7bb57';mc.fillRect((o.x+200)/400*180,(o.z+200)/400*140,2,2);}mc.fillStyle='#c55752';mc.beginPath();mc.arc((world.player.x+200)/400*180,(world.player.z+200)/400*140,4,0,7);mc.fill();}
function animateModels(dt){const p=world.player,speed=Math.hypot(p.vx,p.vz),active=p.vehicle?carModels[p.pup]:pupModels[p.pup];
 if(currentActor!==active){for(const m of [...pupModels,...carModels])m.visible=false;active.visible=true;currentActor=active;}
 active.position.set(p.x,p.y,p.z);active.rotation.y=p.angle;
 audio.setEngine(p.vehicle,speed);
 const data=active.userData;if(data.legs){data.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(time*speed*1.7+i%2*Math.PI)*Math.min(.65,speed*.09));data.tail.rotation.z=Math.sin(time*7)*.35;data.ears.forEach((ear,i)=>ear.rotation.x=Math.sin(time*5+i)*Math.min(.18,speed*.03));data.head.rotation.z=Math.sin(time*2)*.025;data.backpack.rotation.x=toolLife>0?Math.sin(toolLife*15)*.12:0;}
 if(data.tool){data.tool.visible=toolLife>0;data.tool.scale.z=.7+Math.sin(toolLife*4)*.3;}
 if(data.wheels)data.wheels.forEach(w=>w.rotation.x+=speed*dt*1.8);if(data.rotor)data.rotor.rotation.y+=dt*35;if(data.scoop)data.scoop.rotation.x=toolLife>0?Math.sin(toolLife*7)*.5:0;
 if(data.siren){data.siren.children.forEach((m,i)=>{m.material=M.material((Math.sin(time*3+i*Math.PI)>0)?(i?0x85b7d7:0xda7f77):0xc0b6a2);});}
}
let snapCamera=false;
let mainCalls=0,mainTriangles=0;
let frames=0,lastInfo='',fatal=false;
function frame(ms){if(fatal)return;try{
 const dt=Math.min(.035,(ms-last)/1000||.016);last=ms;time+=dt;toolLife=Math.max(0,toolLife-dt);actionCooldown-=dt;
 if(!modalOpen){const input=getAxes();world.update(dt,input,yaw);if(actionHeld&&actionCooldown<=0){world.action();actionCooldown=.6;}}
 handleEvents();animateModels(dt);
 const p=world.player;
 // A câmera recua por trás e a luz acompanha o jogador para manter sombras úteis.
 if(!cameraDrag&&time-lastManualCamera>2.5&&Math.hypot(p.vx,p.vz)>.8){const target=p.angle+Math.PI;const delta=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));yaw+=delta*Math.min(1,dt*1.7);}
 const distance=p.vehicle?12:8.5;look.set(p.x,p.y+1.5,p.z);desired.set(p.x+Math.sin(yaw)*distance,p.y+3+pitch*5,p.z+Math.cos(yaw)*distance);
 v.subVectors(desired,look);ray.set(look,v.clone().normalize());ray.far=v.length();const hits=ray.intersectObjects(collisionMeshes,false);if(hits.length&&hits[0].distance>1)desired.copy(look).addScaledVector(v.normalize(),Math.max(1.2,hits[0].distance-.5));
 if(frames===0||snapCamera){camera.position.copy(desired);snapCamera=false;}else camera.position.lerp(desired,1-Math.exp(-dt*6));camera.lookAt(look);
 sun.position.set(p.x+35,65,p.z+20);sun.target.position.set(p.x,0,p.z);sun.target.updateMatrixWorld();
 for(const item of scenery)item.group.visible=Math.hypot(item.x-p.x,item.z-p.z)<item.distance;
 for(const a of animated){if(a.type==='palm')a.mesh.rotation.z=Math.sin(time*.6+a.mesh.position.x)*.025;if(a.type==='cloud')a.mesh.position.x=a.origin+Math.sin(time*.03)*15;if(a.type==='airship'){a.mesh.position.x=-90+Math.sin(time*.035)*55;a.mesh.rotation.y=time*.02;}if(a.type==='water')a.mesh.material.roughness=.27+Math.sin(time)*.025;}
 for(const o of world.objects){const mesh=interactive.get(o.id);mesh.visible=!o.done&&Math.hypot(o.x-p.x,o.z-p.z)<110;if(['bone','race','air','cookie'].includes(o.type)){mesh.rotation.y+=dt*.8;mesh.position.y=(o.type==='air'?4:1)+Math.sin(time*1.8+o.x)*.17;}if(o.type==='fire')mesh.scale.y=1+Math.sin(time*3+o.number)*.06;}
 const b=world.ball;football.position.set(b.x,b.y,b.z);football.rotation.x+=b.vz*dt/.8;football.rotation.z-=b.vx*dt/.8;
 keeper.position.x+=(Math.max(31,Math.min(39,b.x))-keeper.position.x)*Math.min(1,dt*.9);keeper.userData.tail.rotation.z=Math.sin(time*5)*.3;
 // Goleiro amistoso: só defende bolas baixas; chutes com arco podem passar.
 if(Math.hypot(b.x-keeper.position.x,b.z-152)<1.8&&b.y<1.5&&b.vz>0){b.vz=-Math.abs(b.vz)*.5;b.vy=2;}
 for(let i=particles.length-1;i>=0;i--){const a=particles[i];a.life-=dt;a.vy-=6*dt;a.mesh.position.x+=a.vx*dt;a.mesh.position.y+=a.vy*dt;a.mesh.position.z+=a.vz*dt;if(a.life<=0){scene.remove(a.mesh);a.mesh.geometry.dispose();particles.splice(i,1);}}
 if(frames%10===0){score.textContent=`${S.NAMES[p.pup]} · Ossinhos ${world.bones} · Estrelas ${world.stars} · Gols ${world.goals}`;const id=world.instruction();if(lastInfo!==id){const titles={Ryder_football:'Futebol: aproxime-se da bola e use a mochila para chutar!',Ryder_race:'Grand Prix: dirija, pegue formas e passe pelos aceleradores!',Tracker_instruction:'Selva: encontre ossinhos em ordem e descubra os animais.'};info.textContent=titles[id]||'Explore, chegue perto dos objetos e use a mochila!';lastInfo=id;}mc.clearRect(0,0,180,140);}
 if(frames%15===0){mapCamera.position.set(p.x,120,p.z);mapCamera.lookAt(p.x,0,p.z);mapMarker.position.set(p.x,p.y+4,p.z);mapMarker.visible=true;renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(mapTarget);renderer.render(scene,mapCamera);renderer.setRenderTarget(null);mapMarker.visible=false;renderer.shadowMap.autoUpdate=true;}
 renderer.setViewport(0,0,innerWidth,innerHeight);renderer.render(scene,camera);mainCalls=renderer.info.render.calls;mainTriangles=renderer.info.render.triangles;
 const rect=map.getBoundingClientRect();renderer.autoClear=false;renderer.setScissorTest(true);renderer.setScissor(rect.left+7,innerHeight-rect.bottom+7,rect.width-14,rect.height-14);renderer.setViewport(rect.left+7,innerHeight-rect.bottom+7,rect.width-14,rect.height-14);renderer.clearDepth();renderer.render(mapScene,mapQuadCamera);renderer.setScissorTest(false);renderer.setViewport(0,0,innerWidth,innerHeight);renderer.autoClear=true;
 frames++;requestAnimationFrame(frame);
 }catch(error){fatal=true;document.getElementById('webgl-error').hidden=false;console.error(error);}}
window.game={pause:()=>{reset();if(audio.context)audio.context.suspend().catch(()=>{});},home:()=>openModal('areas'),inspect:()=>({player:{...world.player},ball:{...world.ball},goals:world.goals,bones:world.bones,stars:world.stars,objects:world.objects.map(o=>({...o})),modal:modalOpen,frames,camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z,yaw},renderer:renderer.capabilities.isWebGL2?'WebGL2':'WebGL',drawCalls:mainCalls,triangles:mainTriangles,characters:pupModels.length-1,areas:Object.keys(S.AREAS)})};
requestAnimationFrame(frame);
})();
