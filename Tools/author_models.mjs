/* Assets originais exportados como GLB reais, para carga offline pelo loader oficial. */
import * as T from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:'+blob.type+';base64,'+Buffer.from(b).toString('base64');this.onloadend?.();});}};
const out='app/src/main/assets/models/',sphere=new T.SphereGeometry(1,24,16),box=new T.BoxGeometry(1,1,1),materials=new Map();
const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.7}));return materials.get(c);};
function add(g,geo,c,x,y,z,sx,sy=sx,sz=sx,name=''){const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.name=name;g.add(m);return m;}
const ball=(...a)=>add(a[0],sphere,...a.slice(1)),block=(...a)=>add(a[0],box,...a.slice(1));
function line(g,c,a,b,r){const delta=new T.Vector3(...b).sub(new T.Vector3(...a));const m=add(g,new T.CylinderGeometry(r,r,delta.length(),10),c,0,0,0,1);m.position.copy(new T.Vector3(...a)).add(new T.Vector3(...b)).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
async function write(name,g){const data=await new GLTFExporter().parseAsync(g,{binary:true,onlyVisible:true});fs.writeFileSync(out+name+'.glb',Buffer.from(data));}
function animal(type){const g=new T.Group();g.name=type;const colors={chicken:0xf8e5b1,cow:0xe6e4dd,sheep:0xf4eee0,pig:0xe6a4a5,horse:0x946037,toucan:0x192f3c,monkey:0x886044,turtle:0x5c9e69,panda:0xeae9d9,penguin:0x253b53,lion:0xd6b365,dolphin:0x77baca,tiger:0xffc449,dragon:0x76bebb,wolf:0xb1d5e2,dinosaur:0x54a27a};const c=colors[type],bird=['chicken','toucan','penguin'].includes(type),aquatic=['dolphin','turtle'].includes(type);const h=type==='dinosaur'?1.7:type==='horse'?1.5:.85;
 ball(g,c,0,h,0,.58,bird?.7:.52,bird?.48:1);ball(g,c,0,h+.55,.7,.43,.44,.43);if(type==='horse'||type==='dinosaur')ball(g,c,0,h+.25,.65,.28,.8,.3);
 const headZ=.99;ball(g,type==='pig'?0xd98d95:bird?0xe8b341:0xe9d5af,0,h+.43,headZ,.26,.22,bird?.4:.26);
 for(const side of [-1,1]){ball(g,0xffffff,side*.22,h+.68,.99,.12,.14,.06);ball(g,0x162939,side*.22,h+.69,1.044,.065,.09,.025);ball(g,0xffffff,side*.205,h+.725,1.07,.018);
 if(!bird&&!aquatic)ball(g,c,side*.36,h+.92,.62,.16,.25,.1);
 if(bird){ball(g,c,side*.52,h,.02,.15,.48,.35);line(g,0xc9a055,[side*.2,.3,.1],[side*.2,.04,.23],.06);ball(g,0xd4ac62,side*.22,.06,.28,.17,.06,.23);}
 else if(aquatic){const fin=ball(g,c,side*.6,h-.2,0,.4,.07,.22);fin.rotation.y=side*.4;}
 else for(const z of [-.55,.55]){const leg=new T.Group();leg.name='leg'+side+z;leg.position.set(side*.4,h-.2,z);g.add(leg);ball(leg,c,0,-h*.38,0,.15,h*.45,.17);ball(leg,0x555955,0,-h*.72,.03,.17,.12,.21);}}
 if(type==='turtle'){ball(g,0x376e4c,0,h+.2,-.1,.65,.35,.85);for(let i=0;i<7;i++){const a=i*2.4;ball(g,0xadc47a,Math.sin(a)*.4,h+.46,-.1+Math.cos(a)*.55,.16,.045,.19);}}
 if(type==='cow'||type==='tiger'){for(let i=0;i<9;i++){const a=i*2.4;const spot=ball(g,type==='cow'?0x394351:0x654e2f,Math.sin(a)*.54,h+Math.cos(a)*.4,(i%3-1)*.5,.09,type==='tiger'?.33:.18,.17);spot.rotation.z=a;}}
 if(type==='sheep')for(let i=0;i<32;i++){const a=i*2.399;ball(g,0xf5f1e3,Math.cos(a)*.52,h+Math.sin(a)*.4,(i%5-2)*.33,.24);}
 if(type==='panda'){for(const side of [-1,1]){ball(g,0x293c44,side*.25,h+.66,1,.19,.22,.06);ball(g,0xf8faf2,side*.25,h+.7,1.06,.07,.09,.03);ball(g,0x27373c,side*.3,h+.98,.66,.16);}for(const side of [-1,1])ball(g,0x27373c,side*.4,.35,.5,.2,.35,.2);}
 if(type==='lion'){const mane=ball(g,0x9f6a30,0,h+.54,.6,.61,.61,.25);}
 if(type==='pig')for(const side of [-1,1])ball(g,0x8c595b,side*.09,h+.45,1.25,.045,.04,.02);
 if(type==='chicken'){ball(g,0xd45552,0,h+1,.67,.13,.25,.15);ball(g,0xdb5c52,0,h+.25,1.08,.1,.15,.06);}
 if(type==='toucan'){ball(g,0xf0cd42,0,h+.48,1.27,.2,.18,.43);ball(g,0xdb7b39,0,h+.48,1.6,.17,.16,.15);}
 if(type==='penguin')ball(g,0xf7f0dc,0,h-.04,.41,.45,.54,.1);
 const tail=new T.Group();tail.name='tail';tail.position.set(0,h,-.85);g.add(tail);if(!bird)ball(tail,c,0,.1,-.28,.13,.15,.5);
 if(type==='horse'){for(let i=0;i<6;i++)ball(g,0x493b31,0,h+.95-i*.1,.36-i*.06,.16);}
 if(type==='dragon'){for(const side of [-1,1]){const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(side*1.35,.7);shape.lineTo(side*1.1,-.6);shape.lineTo(side*.5,-.4);shape.closePath();const wing=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshStandardMaterial({color:0xb2dcce,side:T.DoubleSide}));wing.position.set(side*.3,h+.3,-.2);g.add(wing);line(g,0x668c88,[side*.3,h+.3,-.2],[side*1.65,h+1,-.2],.05);}for(let i=0;i<5;i++)add(g,new T.ConeGeometry(.13,.35,10),0xe2d28d,0,h+.45,-.25-i*.25,1);}
 if(type==='dinosaur')for(let i=0;i<6;i++)add(g,new T.ConeGeometry(.18,.4,10),0x9dd195,0,h+.5,-.3-i*.22,1);
 if(type==='wolf'){ball(g,0xe3f1ef,0,h+.1,.25,.5,.45,.4);for(const side of [-1,1])add(g,new T.ConeGeometry(.18,.45,16),0xa0cbd9,side*.29,h+1.05,.65,1);}
 if(type==='dolphin'){const fin=add(g,new T.ConeGeometry(.26,.8,12),c,0,h+.7,-.4,1);fin.rotation.x=-.3;for(const side of [-1,1])ball(tail,c,side*.35,.12,-.7,.48,.08,.22);}
 return g;}
for(const name of ['chicken','cow','sheep','pig','horse','toucan','monkey','turtle','panda','penguin','lion','dolphin','tiger','dragon','wolf','dinosaur'])await write('pet-'+name,animal(name));
const barn=new T.Group();block(barn,0xb74c3a,0,2,0,5,4,5);for(let i=0;i<10;i++)for(const side of [-1,1])block(barn,0xd17754,side*2.52,2,-2.3+i*.5,.06,3.8,.08);const roof=add(barn,new T.ConeGeometry(4.3,2.5,4),0x344b61,0,5,0,1,1,1);roof.rotation.y=Math.PI/4;block(barn,0xf5e4c8,0,1.5,2.54,2.4,3,.12);for(const side of [-1,1])line(barn,0xa24538,[side*1.1,.1,2.65],[-side*1.1,2.9,2.65],.1);block(barn,0xe4c995,0,6,0,.25,.6,.25);await write('barn',barn);
const fence=new T.Group();for(const x of [-2.5,0,2.5]){block(fence,0xaa794f,x,.9,0,.25,1.8,.25);ball(fence,0xd2b379,x,1.85,0,.19,.1,.19);}for(const y of [.5,1.25])block(fence,0xd2ad78,0,y,0,5,.2,.17);await write('fence',fence);
const rock=new T.Group();add(rock,new T.IcosahedronGeometry(1,2),0x81929b,0,.6,0,1.6,1.2,1.3);await write('rock',rock);
const palm=new T.Group();for(let i=0;i<9;i++)add(palm,new T.CylinderGeometry(.24-i*.012,.27-i*.012,.75,12),0x9d7b4d,Math.sin(i*.12)*.5,.37+i*.72,0,1);for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const leaf=ball(palm,0x40976b,Math.sin(a)*1.6,6.5,Math.cos(a)*1.6,.45,.13,2.2);leaf.rotation.y=a;leaf.rotation.x=-.2;}for(let i=0;i<3;i++)ball(palm,0x775a3b,Math.sin(i*2)*.4,6.2,Math.cos(i*2)*.4,.3);await write('palm',palm);
console.log('20 GLBs originais: 16 espécies, palmeira, celeiro, cerca e pedra.');
