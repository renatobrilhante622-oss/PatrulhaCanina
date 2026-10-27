/* Modelos originais, procedurais e articulados; nenhum GLB externo é necessário. */
window.AdventureModels=(()=>{
'use strict';
const T=THREE,matCache=new Map(),geoCache=new Map();
const COLORS=[0xc84b50,0x285ca9,0xd94c43,0xd45e9b,0x438d62,0xe6b642,0xe67b32,0x698657,0x70b7c7];
function material(color,roughness=.78,metalness=0){const key=color+'-'+roughness+'-'+metalness;if(!matCache.has(key))matCache.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));return matCache.get(key);}
function mesh(geometry,color,parent,x=0,y=0,z=0,scale=null){const m=new T.Mesh(geometry,material(color));m.position.set(x,y,z);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;if(parent)parent.add(m);return m;}
function geo(key,create){if(!geoCache.has(key))geoCache.set(key,create());return geoCache.get(key);}
const sphere=()=>geo('sphere',()=>new T.SphereGeometry(1,16,12));
const box=()=>geo('box',()=>new T.BoxGeometry(1,1,1));
const cylinder=()=>geo('cylinder',()=>new T.CylinderGeometry(1,1,1,12));
function ball(parent,color,x,y,z,sx,sy=sx,sz=sx){return mesh(sphere(),color,parent,x,y,z,[sx,sy,sz]);}
function block(parent,color,x,y,z,sx,sy,sz){return mesh(box(),color,parent,x,y,z,[sx,sy,sz]);}
function tube(parent,color,x,y,z,radius,height){return mesh(cylinder(),color,parent,x,y,z,[radius,height,radius]);}
function line(parent,a,b,radius,color){const delta=new T.Vector3().subVectors(b,a);const m=tube(parent,color,0,0,0,radius,delta.length());m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
function badge(parent,pup,x,y,z,size=.18){const shield=mesh(geo('badge',()=>new T.CylinderGeometry(1,.75,.2,5)),0xf3d578,parent,x,y,z,[size,.7*size,size]);shield.rotation.x=Math.PI/2;ball(parent,COLORS[pup],x,y,z+.08,size*.4,size*.4,.05);}
function pup(index){
 const g=new T.Group();g.name='Filhote '+Adventure3D.NAMES[index];const c=COLORS[index];
 const fur=index===2?0xf6f2e9:index===4?0x9d9e95:index===6?0x694938:index===8?0xa5b6bf:0xc79a68;
 const body=ball(g,fur,0,.95,0,.48,.48,.72);block(g,c,0,1.05,-.03,.94,.72,.95);
 const head=new T.Group();head.position.set(0,1.58,.55);g.add(head);
 ball(head,fur,0,.18,0,.6,.57,.55);ball(head,index===2?0xffffff:0xe6c49a,0,-.05,.48,.34,.26,.29);ball(head,0x302c2b,0,.05,.72,.16,.12,.11);
 for(const side of [-1,1]){ball(head,0xffffff,side*.23,.3,.45,.17,.19,.1);ball(head,0x382b23,side*.23,.31,.53,.088,.12,.04);ball(head,0xffffff,side*.2,.36,.57,.025);}
 // Silhuetas e marcas próprias: cachos, focinho de buldogue, máscara e pelagem.
 if(index===1){ball(g,0x68513d,0,1.3,-.2,.43,.13,.6);for(const side of [-1,1])ball(head,0x745137,side*.26,.47,.35,.18,.06,.13);}
 if(index===3)for(const side of [-1,1])for(let i=0;i<5;i++)ball(head,0xd4b180,side*(.43+Math.sin(i)*.06),.2-i*.09,.04+Math.cos(i)*.09,.13);
 if(index===5){for(const side of [-1,1])ball(head,0xf0dcc0,side*.18,-.08,.48,.24,.23,.22);ball(head,0x725744,0,.06,.72,.16,.11,.08);}
 if(index===7||index===8){for(const side of [-1,1])ball(head,0xece5d2,side*.24,.03,.38,.24,.3,.16);ball(head,0x354753,0,.06,.72,.15,.11,.09);}
 const ears=[];
 for(const side of [-1,1]){
  const ear=new T.Group();ear.position.set(side*.48,.5,0);head.add(ear);
  if([1,4,7,8].includes(index)){
   const e=mesh(geo('ear',()=>new T.ConeGeometry(.2,.58,4)),index===8?0x617e90:0x75563e,ear,0,.2,0);e.rotation.z=-side*.18;
   mesh(geo('innerear',()=>new T.ConeGeometry(.12,.4,4)),0xcc9a8d,ear,0,.2,.05);
  }else ball(ear,index===2?0xffffff:0x87603f,side*.08,-.13,0,.19,.43,.2);
  ears.push(ear);
 }
 if(index===2)for(let i=0;i<8;i++){const spot=ball(i<4?head:g,0x61534d,(i%2?1:-1)*(i<4?.43:.48),i<4?.04+(i%3)*.15:.9,(i%3)*.2,.09,.11,.03);spot.rotation.y=i%2?.9:-.9;}
 const hat=new T.Group();hat.position.set(0,.67,0);head.add(hat);
 if(index===3){for(const side of [-1,1]){const rim=mesh(geo('goggle',()=>new T.TorusGeometry(.17,.045,6,12)),0xf7d2df,hat,side*.2,-.1,.35);ball(hat,0x8ebcc5,side*.2,-.1,.35,.135,.12,.04);}}
 else{ball(hat,c,0,0,0,.58,.2,.55);block(hat,c,0,-.05,.36,1.18,.09,.64);if(index===7){tube(hat,0xd5caa2,0,.05,0,.38,.23);}}
 badge(hat,index,0,.02,.58,.16);badge(g,index,0,1.12,.65,.22);
 const backpack=new T.Group();backpack.position.set(0,1.35,-.25);g.add(backpack);block(backpack,c,0,0,-.22,.72,.62,.67);for(const side of [-1,1]){tube(backpack,0xc8d2cb,side*.45,-.06,-.25,.14,.52);}
 if(index===3){for(const side of [-1,1]){const wing=block(backpack,0xebc0d4,side*.58,0,-.25,.6,.07,.35);wing.rotation.z=side*.17;}}
 const legs=[];for(const x of [-.3,.3])for(const z of [-.4,.4]){const leg=new T.Group();leg.position.set(x,.7,z);g.add(leg);ball(leg,fur,0,-.25,0,.15,.35,.15);ball(leg,index===2?0xffffff:0xe3bd8c,0,-.52,.06,.18,.11,.22);legs.push(leg);}
 const tail=new T.Group();tail.position.set(0,1,-.7);g.add(tail);const tailMesh=ball(tail,fur,0,.15,-.25,.12,.12,.36);tailMesh.rotation.x=.4;
 const mouth=ball(head,0x9d6a62,0,-.17,.64,.11,.035,.04);
 const tool=new T.Group();tool.position.set(0,1.1,.9);tool.visible=false;g.add(tool);
 if(index===1){line(tool,new T.Vector3(.55,0,0),new T.Vector3(.55,0,1.5),.07,0xc7d8ce);const net=mesh(geo('net',()=>new T.TorusGeometry(.45,.04,6,16)),0xc7d8ce,tool,.55,0,1.6);for(let i=0;i<4;i++)line(tool,new T.Vector3(.55-.3+i*.2,-.3,1.6),new T.Vector3(.55-.3+i*.2,.3,1.6),.012,0xe8e8d0);}
 if(index===2){const nozzle=tube(tool,0xa6c8d0,.55,0,.6,.15,1.3);nozzle.rotation.x=Math.PI/2;ball(tool,0x668b95,.55,0,1.2,.23,.2,.12);}
 if(index===3){for(const side of [-1,1])block(tool,0xe5b4ce,side*.8,.1,.2,1.2,.08,.5);}
 if(index===4){line(tool,new T.Vector3(.5,0,0),new T.Vector3(.5,0,1.2),.1,0xa7c1ac);for(const side of [-1,1])line(tool,new T.Vector3(.5,0,1.2),new T.Vector3(.5+side*.35,0,1.65),.08,0xa7c1ac);}
 if(index===5||index===8){block(tool,index===8?0x9dd9df:0xe3bb63,0,-.2,1.1,1.5,.45,.8);}
 if(index===6){mesh(geo('life-ring',()=>new T.TorusGeometry(.5,.16,8,20)),0xf2d8a2,tool,0,0,1.1);}
 if(index===7){for(const side of [-1,1]){const barrel=tube(tool,0x687d68,side*.25,0,.9,.18,.7);barrel.rotation.x=Math.PI/2;}}
 g.userData={legs,tail,ears,head,mouth,backpack,tool};return g;
}
function vehicle(index){
 const g=new T.Group(),c=COLORS[index],wheels=[];g.name='Veículo '+Adventure3D.NAMES[index];
 block(g,c,0,.9,0,2.4,.7,4);block(g,c,0,1.8,.95,2.2,1.2,1.7);block(g,0x86b7ca,0,1.9,1.83,1.7,.65,.03);
 for(const side of [-1,1])block(g,0xa4c6cc,side*1.12,1.9,.95,.04,.6,1.2);
 block(g,0xd7d5c3,0,.7,2.1,2.6,.22,.2);for(const side of [-1,1]){block(g,0xf9e5ad,side*.75,1.1,2.02,.43,.3,.06);block(g,0x9f5552,side*.8,.9,-2.02,.35,.25,.04);}
 if(index!==3&&index!==6){
  for(const side of [-1,1])for(const z of [-1.25,1.25]){
   const wheel=new T.Group();wheel.position.set(side*1.22,.52,z);g.add(wheel);
   const tire=mesh(geo('wheel',()=>new T.CylinderGeometry(.58,.58,.4,16)),0x293640,wheel);tire.rotation.z=Math.PI/2;
   const hub=mesh(geo('hub',()=>new T.CylinderGeometry(.28,.28,.43,12)),0xc4c6bc,wheel);hub.rotation.z=Math.PI/2;
   for(let i=0;i<5;i++){const spoke=block(wheel,0x889b9d,0,Math.sin(i*1.256)*.23,Math.cos(i*1.256)*.23,.46,.07,.07);spoke.rotation.x=-i*1.256;}
   wheels.push(wheel);
  }
 }
 let rotor=null,scoop=null,siren=null;
 if(index===2){for(const side of [-1,1])block(g,0xd6d8d0,side*.65,2.1,-.7,.1,.1,2.8);for(let i=0;i<9;i++)block(g,0xd9dfd8,0,2.1,-1.9+i*.3,1.4,.08,.08);for(const side of [-1,1])tube(g,0xc9d4cf,side*1.25,1.1,-.3,.17,1.3);}
 if(index===1||index===2){siren=new T.Group();siren.position.set(0,2.55,.8);g.add(siren);ball(siren,0xde6265,-.45,0,0,.28,.2,.25);ball(siren,0x7fc6dc,.45,0,0,.28,.2,.25);}
 if(index===3){rotor=new T.Group();rotor.position.set(0,3,.1);g.add(rotor);block(rotor,0xd5c9d8,0,0,0,.16,.08,6);block(rotor,0xd5c9d8,0,.01,0,6,.08,.16);block(g,c,0,1.4,-3,.35,.35,3);for(const side of [-1,1]){line(g,new T.Vector3(side*1,.5,-1.5),new T.Vector3(side*1,.5,1.5),.1,0xd1d5d0);}}
 if(index===4){block(g,0x538f65,0,1.6,-.8,2.1,1.2,2);badge(g,4,0,1.7,-1.9,.5);}
 if(index===5||index===8){scoop=new T.Group();scoop.position.set(0,.8,2.3);g.add(scoop);block(scoop,index===8?0x9cdbde:0xecc15d,0,0,.4,3,.7,.9);for(const side of [-1,1])block(g,0xb6a66c,side*.9,1,1.9,.13,.15,1.6);}
 if(index===6){const torus=mesh(geo('hover',()=>new T.TorusGeometry(1.35,.28,8,24)),0x5f7478,g,0,.4,0);torus.rotation.x=Math.PI/2;torus.scale.set(1,1.65,1);const fan=mesh(geo('fan',()=>new T.TorusGeometry(.7,.1,8,18)),0x62777a,g,0,1.9,-1.8);}
 if(index===7){block(g,0xe7e8db,0,1,-.5,2.45,.75,2);for(let i=0;i<5;i++){const stripe=block(g,0x3f4e4d,0,1.41,-1.4+i*.4,2.4,.02,.13);stripe.rotation.y=(i%2?.2:-.2);}}
 g.userData={wheels,rotor,scoop,siren};return g;
}
function palm(){const g=new T.Group();const trunk=tube(g,0xaa8555,0,4,0,.35,8);trunk.rotation.z=.07;ball(g,0x8eaa5b,.25,8,0,.8,.6,.8);
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7,leaf=new T.Group();leaf.position.set(.3,8,0);leaf.rotation.y=a;g.add(leaf);const m=ball(leaf,i%2?0x4e9761:0x66aa66,0,-.4,2,.55,.15,2.8);m.rotation.x=-.18;}
 return g;}
function pine(){const g=new T.Group();tube(g,0x8e7655,0,1.5,0,.3,3);for(let i=0;i<3;i++)mesh(geo('pine'+i,()=>new T.ConeGeometry(2-i*.3,3,8)),0x528360,g,0,2+i*1.6,0);return g;}
function bone(){const g=new T.Group();block(g,0xf5d87a,0,0,0,.8,.22,.25);for(const side of [-1,1])for(const z of [-.12,.12])ball(g,0xf5d87a,side*.45,0,z,.18);return g;}
function shapeMesh(type,color){if(type==='circle')return mesh(geo('token-circle',()=>new T.TorusGeometry(.65,.17,8,20)),color);if(type==='square')return mesh(box(),color,null,0,0,0,[1.25,1.25,.25]);if(type==='triangle')return mesh(geo('token-triangle',()=>new T.ConeGeometry(.85,1.4,3)),color);const s=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.38:.8;const x=Math.sin(a)*r,y=Math.cos(a)*r;i?s.lineTo(x,y):s.moveTo(x,y);}return mesh(geo('star',()=>new T.ExtrudeGeometry(s,{depth:.2,bevelEnabled:false})),color);}
function animal(type){const g=new T.Group(),c={monkey:0xa57851,toucan:0x465a55,frog:0x76af63}[type];ball(g,c,0,.6,0,.5,.5,.5);ball(g,c,0,1.1,.3,.35,.35,.35);for(const side of [-1,1]){ball(g,0xf3e4be,side*.15,1.2,.55,.12);ball(g,0x293d38,side*.15,1.2,.65,.05);if(type==='monkey')ball(g,c,side*.38,1.2,.3,.17);ball(g,c,side*.4,.25,.2,.23,.15,.3);}if(type==='toucan')ball(g,0xecc561,0,1.05,.9,.19,.16,.48);return g;}
return {COLORS,material,mesh,ball,block,tube,line,geo,pup,vehicle,palm,pine,bone,shapeMesh,animal};
})();
