/* mundo.js - cena, luz, céu, cidade, farol, torre com escorregador, praia, mar, píer e barco */
(function(){
'use strict';
const PC = window.PC = window.PC || {};
const rnd = (a,b) => a + Math.random()*(b-a);
PC.colisores = []; PC.semaforos = []; PC.animados = []; PC.veiculos = []; PC.helis = [];
const colisores = PC.colisores;

function texCanvas(w,h,desenhar,rep){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  desenhar(c.getContext('2d'), w, h);
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  if(rep) t.repeat.set(rep[0], rep[1]);
  t.anisotropy=4;
  return t;
}
PC.texCanvas = texCanvas;

function mat(cor,o){ return new THREE.MeshStandardMaterial(Object.assign({color:cor,roughness:0.6},o||{})); }

/* ---------- RENDERER, CENA E LUZ ---------- */
const renderer = new THREE.WebGLRenderer({canvas:document.getElementById('cena'), antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
PC.renderer = renderer;

const cena = new THREE.Scene();
cena.fog = new THREE.FogExp2(0xf6d9b6, 0.0045);
PC.cena = cena;

const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 500);
camera.position.set(0,12,-2);
PC.camera = camera;

cena.add(new THREE.HemisphereLight(0xcfe9ff, 0x4a7a34, 0.75));
const sol = new THREE.DirectionalLight(0xffd6a0, 1.35);
sol.castShadow = true;
sol.shadow.mapSize.set(2048,2048);
const sc = sol.shadow.camera;
sc.left=-45; sc.right=45; sc.top=45; sc.bottom=-45; sc.near=1; sc.far=220;
sc.updateProjectionMatrix();
sol.shadow.radius = 5;
sol.shadow.bias = -0.0006;
sol.shadow.normalBias = 0.02;
sol.position.set(30,28,-20);
cena.add(sol); cena.add(sol.target);
PC.sol = sol;

function caixa(w,h,d,m,x,y,z,pai){
  const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m);
  o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true;
  (pai||cena).add(o);
  return o;
}

/* ---------- CÉU ---------- */
cena.add(new THREE.Mesh(
  new THREE.SphereGeometry(300,32,16),
  new THREE.MeshBasicMaterial({side:THREE.BackSide, fog:false, map:texCanvas(4,512,(g,w,h)=>{
    const gr=g.createLinearGradient(0,0,0,h);
    gr.addColorStop(0,'#1d6fd1'); gr.addColorStop(0.45,'#6fbdf2');
    gr.addColorStop(0.72,'#ffd7a0'); gr.addColorStop(1,'#ffe6bf');
    g.fillStyle=gr; g.fillRect(0,0,w,h);
  })})
));

function chaoPlano(w,d,x,z,y,mapa){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d), new THREE.MeshStandardMaterial({map:mapa, roughness:0.95}));
  m.rotation.x=-Math.PI/2; m.position.set(x,y,z); m.receiveShadow=true;
  cena.add(m);
  return m;
}

/* ---------- GRAMADO COM FLORES PROCEDURAIS ---------- */
const grama = texCanvas(512,512,(g,w,h)=>{
  g.fillStyle='#5cb548'; g.fillRect(0,0,w,h);
  for(let i=0;i<5000;i++){
    g.fillStyle=['#4fa23e','#6cc957','#479636','#7fd46a'][i%4];
    g.fillRect(Math.random()*w, Math.random()*h, 2+Math.random()*2, 4+Math.random()*4);
  }
  for(let i=0;i<260;i++){
    g.fillStyle=['#ff6fa8','#ffd23f','#ffffff','#b388ff'][i%4];
    g.beginPath(); g.arc(Math.random()*w, Math.random()*h, 2.2, 0, Math.PI*2); g.fill();
  }
}, [45,45]);
chaoPlano(148,400,-6,0,0,grama);

// Areia da praia
const areia = texCanvas(256,256,(g,w,h)=>{
  g.fillStyle='#f3dca4'; g.fillRect(0,0,w,h);
  for(let i=0;i<2500;i++){ g.fillStyle=Math.random()<.5?'#e8cc8a':'#fff1c9'; g.fillRect(Math.random()*w,Math.random()*h,2,2); }
}, [8,40]);
chaoPlano(36,400,52,0,0.03,areia);

// Praça de pedra e calçada
const pedra = texCanvas(256,256,(g,w,h)=>{
  g.fillStyle='#d9c7a0'; g.fillRect(0,0,w,h);
  g.strokeStyle='#b7a27a'; g.lineWidth=4;
  for(let y=0;y<h;y+=64) for(let x=0;x<w;x+=64) g.strokeRect(x,y,64,64);
}, [3,3]);
const praca = new THREE.Mesh(new THREE.CylinderGeometry(15,15,0.1,48), new THREE.MeshStandardMaterial({map:pedra, roughness:0.9}));
praca.position.y=0.05; praca.receiveShadow=true; cena.add(praca);
const calcada = new THREE.Mesh(new THREE.RingGeometry(15.4,17.6,64), mat(0xd7d2c8,{roughness:0.9}));
calcada.rotation.x=-Math.PI/2; calcada.position.y=0.04; calcada.receiveShadow=true; cena.add(calcada);

// Ruas com faixa tracejada (E-O e N-S)
const asfalto = texCanvas(128,128,(g,w,h)=>{
  g.fillStyle='#3a3f47'; g.fillRect(0,0,w,h);
  g.fillStyle='#ffe066';
  for(let x=0;x<w;x+=32) g.fillRect(x+4,h/2-3,16,6);
}, [4,1]);
const ruaEO = chaoPlano(30,6,31,0,0.03,asfalto);
chaoPlano(6,14,0,23,0.03,asfalto);

/* ---------- CIDADE: PRÉDIOS COLORIDOS COM JANELAS ACESAS ---------- */
const janTex = texCanvas(128,128,(g,w,h)=>{
  g.fillStyle='#ffffff'; g.fillRect(0,0,w,h);
  g.fillStyle='#3d6a8c';
  for(let y=12;y<h;y+=40) for(let x=10;x<w;x+=34) g.fillRect(x,y,20,24);
}, [2,3]);
const janLuz = texCanvas(128,128,(g,w,h)=>{
  g.fillStyle='#000000'; g.fillRect(0,0,w,h);
  for(let y=12;y<h;y+=40) for(let x=10;x<w;x+=34){
    if(Math.random()<0.55){ g.fillStyle='#ffd27a'; g.fillRect(x,y,20,24); }
  }
}, [2,3]);

function predio(x,z,w,h,d,cor){
  const m=new THREE.MeshStandardMaterial({color:cor, map:janTex, emissive:0xffffff, emissiveMap:janLuz, emissiveIntensity:0.85, roughness:0.6});
  const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m);
  b.position.set(x,h/2,z); b.castShadow=true; b.receiveShadow=true; cena.add(b);
  // telhado e antena
  const tel=caixa(w+0.4,0.5,d+0.4,mat(0x5d4037),x,h+0.25,z);
  const ant=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,2.2,6), mat(0x9e9e9e));
  ant.position.set(x+w*0.2,h+1.6,z); cena.add(ant);
  colisores.push({x,z,r:Math.max(w,d)/2+0.6});
}
predio(34,-8,8,14,10,0xff8a65);
predio(34,8,9,20,10,0x4fc3f7);
predio(-34,-6,8,12,9,0xffd54f);
predio(-34,10,10,18,10,0x81c784);
predio(-8,34,12,10,8,0xba68c8);
predio(14,34,10,16,8,0xf06292);
predio(-30,-40,9,16,9,0x7e57c2);

/* ---------- HIDRANTES E SEMÁFOROS ---------- */
function hidrante(x,z){
  const g=new THREE.Group(); g.position.set(x,0,z); cena.add(g);
  const m=mat(0xd32f2f,{roughness:0.4});
  const corpo=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.45,1.0,14), m);
  corpo.position.y=0.5; corpo.castShadow=true; g.add(corpo);
  const topo=new THREE.Mesh(new THREE.SphereGeometry(0.42,14,10), m);
  topo.position.y=1.0; topo.scale.set(1,0.5,1); g.add(topo);
  const lado=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.5,10), mat(0xffc107,{metalness:0.6}));
  lado.rotation.z=Math.PI/2; lado.position.set(0.4,0.5,0); g.add(lado);
  colisores.push({x,z,r:0.6});
}
hidrante(-4,4); hidrante(10,-10); hidrante(-11,-9); hidrante(9,12);

function semaforo(x,z,rot,off){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rot; cena.add(g);
  const poste=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.14,4,8), mat(0x37474f));
  poste.position.y=2; poste.castShadow=true; g.add(poste);
  caixa(0.5,1.3,0.4, mat(0x263238), 0,4.3,0, g);
  const cores=[0xff3b30,0xffc400,0x34c759];
  const luzes=cores.map((c,i)=>{
    const m=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.05});
    const l=new THREE.Mesh(new THREE.SphereGeometry(0.15,12,10), m);
    l.position.set(0,4.7-i*0.4,0.21); g.add(l);
    return m;
  });
  colisores.push({x,z,r:0.4});
  PC.semaforos.push({luzes, off});
}
semaforo(11.6,11.6,-Math.PI/4+Math.PI,0);
semaforo(-11.6,11.6,Math.PI/4+Math.PI,3);
semaforo(11.6,-11.6,-Math.PI/4,5);
semaforo(-11.6,-11.6,Math.PI/4,7);

PC.animados.push((t)=>{
  for(const s of PC.semaforos){
    const f=(t+s.off)%9;
    const red=f<4, green=f>=4&&f<7, yellow=f>=7;
    s.luzes[0].emissiveIntensity=red?2.2:0.05;
    s.luzes[1].emissiveIntensity=yellow?2.2:0.05;
    s.luzes[2].emissiveIntensity=green?2.2:0.05;
  }
});

/* ---------- FAROL DA BAÍA DA AVENTURA ---------- */
const LX=0, LZ=-22;
const farol=new THREE.Group(); farol.position.set(LX,0,LZ); cena.add(farol);
const listras=texCanvas(64,256,(g,w,h)=>{
  for(let i=0;i<8;i++){ g.fillStyle=i%2?'#ffffff':'#e53935'; g.fillRect(0,i*32,w,32); }
});
const corpoFarol=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.6,16,28), new THREE.MeshStandardMaterial({map:listras}));
corpoFarol.position.y=8; corpoFarol.castShadow=true; corpoFarol.receiveShadow=true; farol.add(corpoFarol);
const basePedra=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.4,1.2,28), mat(0x90a4ae,{roughness:0.9}));
basePedra.position.y=0.6; basePedra.receiveShadow=true; farol.add(basePedra);
const varanda=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,0.4,28), mat(0x607d8b,{metalness:0.4,roughness:0.5}));
varanda.position.y=16.2; farol.add(varanda);
const lanterna=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,2.4,24), new THREE.MeshStandardMaterial({color:0xfff6b0,emissive:0xffe066,emissiveIntensity:1.2,transparent:true,opacity:0.9}));
lanterna.position.y=17.6; farol.add(lanterna);
const telhado=new THREE.Mesh(new THREE.ConeGeometry(2.1,2.4,24), mat(0xc62828));
telhado.position.y=19.8; telhado.castShadow=true; farol.add(telhado);
const feixo=new THREE.Group(); feixo.position.set(0,17.6,0); farol.add(feixo);
const feixoCone=new THREE.Mesh(new THREE.ConeGeometry(1.6,26,16,1,true), new THREE.MeshBasicMaterial({color:0xfff3b0,transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide}));
feixoCone.rotation.z=Math.PI/2; feixoCone.position.x=13; feixo.add(feixoCone);
colisores.push({x:LX,z:LZ,r:3.2});
PC.animados.push((t,dt)=>{
  feixo.rotation.y+=dt*0.9;
  lanterna.material.emissiveIntensity=1.1+Math.sin(t*3)*0.2;
});

/* ---------- TORRE-MIRANTE COM ESCORREGADOR ESPIRAL ---------- */
function torreMirante(x,z){
  const g=new THREE.Group(); g.position.set(x,0,z); cena.add(g);
  const laranja=mat(0xf4511e,{roughness:0.5});
  for(const [dx,dz] of [[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6]]){
    const perna=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,12,10), laranja);
    perna.position.set(dx,6,dz); perna.castShadow=true; g.add(perna);
  }
  caixa(5,0.4,5, mat(0xffc107), 0,11.8,0, g);
  // guarda-corpo
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2;
    const h=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,1,6), mat(0xffffff));
    h.position.set(Math.cos(a)*2.4,12.4,Math.sin(a)*2.4); g.add(h);
  }
  const telhadoM=new THREE.Mesh(new THREE.ConeGeometry(3.4,2.4,20), mat(0x1e88e5));
  telhadoM.position.y=13.5; telhadoM.castShadow=true; g.add(telhadoM);

  // Escorregador em espiral (curva helicoidal + tubo)
  const pontos=[];
  const voltas=2.2, R=2.8, H=11.5;
  for(let i=0;i<=60;i++){
    const k=i/60, a=k*voltas*Math.PI*2;
    pontos.push(new THREE.Vector3(Math.cos(a)*R, H*(1-k)+0.3, Math.sin(a)*R));
  }
  const curva=new THREE.CatmullRomCurve3(pontos);
  const tubo=new THREE.Mesh(new THREE.TubeGeometry(curva,160,0.55,12,false), mat(0xff3b6b,{roughness:0.35}));
  tubo.castShadow=true; g.add(tubo);
  const borda=new THREE.Mesh(new THREE.TubeGeometry(curva,160,0.12,8,false), mat(0xffd21f,{roughness:0.3}));
  borda.position.y=0.2; g.add(borda);

  colisores.push({x,z,r:2.2});
}
torreMirante(-26,-24);

/* ---------- PALMEIRAS COM FOLHAS DETALHADAS ---------- */
const folhaForma=new THREE.Shape();
folhaForma.moveTo(0,0);
folhaForma.quadraticCurveTo(0.7,0.42,2.2,0.02);
folhaForma.quadraticCurveTo(0.7,-0.42,0,0);
const folhaGeo=new THREE.ShapeGeometry(folhaForma,6);
const folhaM=new THREE.MeshStandardMaterial({color:0x2f9e44,side:THREE.DoubleSide,roughness:0.6});
const palmeiras=[];
function palmeira(x,z,s){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=Math.random()*6.28; cena.add(g);
  const pts=[];
  for(let i=0;i<=8;i++){ const k=i/8; pts.push(new THREE.Vector3(Math.sin(k*1.2)*0.6*s, k*7*s, 0)); }
  const curva=new THREE.CatmullRomCurve3(pts);
  const tronco=new THREE.Mesh(new THREE.TubeGeometry(curva,24,0.28*s,8,false), mat(0x8d6e4a,{roughness:0.9}));
  tronco.castShadow=true; g.add(tronco);
  const coroa=new THREE.Group(); coroa.position.copy(pts[pts.length-1]); g.add(coroa);
  for(let i=0;i<8;i++){
    const w=new THREE.Group(); w.rotation.y=i*Math.PI*2/8; w.scale.setScalar(s); coroa.add(w);
    const f=new THREE.Mesh(folhaGeo, folhaM);
    f.rotation.z=-0.55; f.castShadow=true; w.add(f);
  }
  for(let i=0;i<3;i++){
    const c=new THREE.Mesh(new THREE.SphereGeometry(0.16*s,10,8), mat(0x5d4037));
    c.position.set(Math.cos(i*2.1)*0.3*s,-0.25*s,Math.sin(i*2.1)*0.3*s); coroa.add(c);
  }
  colisores.push({x,z,r:0.8*s});
  palmeiras.push({coroa, off:Math.random()*6});
}
[[48,-30,1.0],[52,-18,1.1],[49,-6,0.95],[53,12,1.05],[47,24,1.0],[55,36,1.1],[50,-42,1.0],[58,30,0.9],[60,-30,1.0]]
  .forEach(([x,z,s])=>palmeira(x,z,s));
PC.animados.push((t)=>{ for(const p of palmeiras) p.coroa.rotation.z=Math.sin(t*0.9+p.off)*0.05; });

/* ---------- ÁRVORES DO INTERIOR ---------- */
function arvore(x,z,s){
  const g=new THREE.Group();
  const tronco=new THREE.Mesh(new THREE.CylinderGeometry(0.25*s,0.35*s,2*s,8), mat(0x8d6e63));
  tronco.position.y=s; tronco.castShadow=true; g.add(tronco);
  const copa=new THREE.Mesh(new THREE.SphereGeometry(1.6*s,16,12), mat(0x2e8b3a,{flatShading:true}));
  copa.position.y=2.9*s; copa.castShadow=true; g.add(copa);
  g.position.set(x,0,z); cena.add(g);
  colisores.push({x,z,r:0.8*s});
}
[[-20,14,1],[-24,-4,1.2],[-14,-30,1.1],[-14,30,1],[12,24,1],[-12,26,1.2],[24,-36,1],[6,-40,1.1],[-40,-20,1.1],[-40,10,1]]
  .forEach(([x,z,s])=>arvore(x,z,s));

/* ---------- FLORES EM INSTÂNCIAS (rápido, muitas flores) ---------- */
(function(){
  const N=260;
  const geo=new THREE.SphereGeometry(0.16,6,5);
  const m=new THREE.MeshStandardMaterial({roughness:0.6});
  const flores=new THREE.InstancedMesh(geo,m,N);
  const mtx=new THREE.Matrix4(), cor=new THREE.Color();
  const pal=[0xff5fa2,0xffd23f,0xffffff,0xb388ff,0xff8a65];
  function livre(x,z){
    if(x>66) return false;
    if(Math.hypot(x,z)<16.5) return false;
    for(const c of colisores) if(Math.hypot(x-c.x,z-c.z)<c.r+1.2) return false;
    return true;
  }
  let n=0, tent=0;
  while(n<N && tent<5000){
    tent++;
    const x=rnd(-70,66), z=rnd(-70,70);
    if(!livre(x,z)) continue;
    mtx.makeTranslation(x,0.25,z);
    flores.setMatrixAt(n,mtx);
    flores.setColorAt(n,cor.setHex(pal[n%pal.length]));
    n++;
  }
  flores.count=n;
  flores.instanceMatrix.needsUpdate=true;
  if(flores.instanceColor) flores.instanceColor.needsUpdate=true;
  cena.add(flores);
})();

/* ---------- MAR, ESPUMA, PÍER E BARCO ---------- */
const marGeo=new THREE.PlaneGeometry(200,400,60,80);
const mar=new THREE.Mesh(marGeo, new THREE.MeshStandardMaterial({color:0x1f9bd7,roughness:0.2,metalness:0.1}));
mar.rotation.x=-Math.PI/2; mar.position.set(170,-0.3,0); mar.receiveShadow=true; cena.add(mar);
PC.animados.push((t)=>{
  const pos=marGeo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i), y=pos.getY(i);
    pos.setZ(i, Math.sin(x*0.09+t*1.1)*0.35 + Math.cos(y*0.07+t*0.8)*0.3);
  }
  pos.needsUpdate=true;
  marGeo.computeVertexNormals();
});
const espuma=new THREE.Mesh(new THREE.PlaneGeometry(4,400), new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.7,roughness:1}));
espuma.rotation.x=-Math.PI/2; espuma.position.set(69.5,0.05,0); cena.add(espuma);

// Píer de madeira
const madeira=mat(0x8d5a2b,{roughness:0.9});
caixa(22,0.3,3, madeira, 69,1.1,4, cena);
for(let x=60;x<=80;x+=4){
  for(const zz of [2.6,5.4]){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,3,8), madeira);
    p.position.set(x,-0.4,zz); p.castShadow=true; cena.add(p);
  }
}

// Barco do Capitão Rodovalho
(function(){
  const g=new THREE.Group(); g.position.set(84,-0.2,-12); g.rotation.y=0.4; cena.add(g);
  const branco=mat(0xffffff,{roughness:0.4});
  caixa(2.6,1.0,6, branco, 0,0,0, g);
  caixa(2.64,0.28,6.04, mat(0xd32f2f,{roughness:0.5}), 0,-0.35,0, g);
  caixa(1.6,1.2,2.2, branco, 0,1.1,-0.6, g);
  caixa(1.64,0.35,2.2, mat(0x1b2a3a,{roughness:0.1,metalness:0.5}), 0,1.25,-0.6, g);
  caixa(1.8,0.1,2.4, mat(0x1e5fd1), 0,1.8,-0.6, g);
  const mastro=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,2.4,8), mat(0xdddddd));
  mastro.position.set(0,2.9,-0.6); g.add(mastro);
  const placa=new THREE.Mesh(new THREE.PlaneGeometry(2.2,0.5), new THREE.MeshStandardMaterial({
    map:texCanvas(512,128,(c,w,h)=>{
      c.fillStyle='#1e5fd1'; c.fillRect(0,0,w,h);
      c.fillStyle='#ffffff'; c.font='bold 46px Arial'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText('CAPITÃO RODOVALHO', w/2, h/2+3);
    })
  }));
  placa.position.set(1.32,0.2,0); placa.rotation.y=Math.PI/2; g.add(placa);
  PC.animados.push((t)=>{
    g.position.y=-0.2+Math.sin(t*1.2)*0.12;
    g.rotation.z=Math.sin(t*0.9)*0.03;
    g.rotation.x=Math.sin(t*1.1)*0.02;
  });
})();

PC.limites = { xMin:-80, xMax:80, zMin:-80, zMax:80, xAgua:67.5, xPierMax:78 };

/* ---------- LOOP DE ANIMAÇÃO DO MUNDO ---------- */
PC.renderizar = function(){ renderer.render(cena, camera); };

})();
