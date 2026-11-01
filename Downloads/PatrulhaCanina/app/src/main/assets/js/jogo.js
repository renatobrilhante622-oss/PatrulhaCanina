/* jogo.js - controles, filhotes, veículos, Missão 1, Pup-Pad e fluxo das telas */
(function(){
'use strict';
const PC = window.PC;
const T = window.FALAS || {};
const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
const rnd = (a,b) => a + Math.random()*(b-a);
function lerpAng(a,b,k){ let d=b-a; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return a+d*k; }
const store = {
  get(k,d){ try{ const v=localStorage.getItem(k); return v===null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const cfg = Object.assign({voz:1, musica:0.6, sfx:0.8, sens:1}, store.get('pc_cfg', {}));
let biscoitos = store.get('pc_biscoitos', 0);
$('biscoitos').textContent = biscoitos;

const cena = PC.cena, camera = PC.camera, renderer = PC.renderer, colisores = PC.colisores;
const LX = 0, LZ = -22;

/* ==================== ÁUDIO ==================== */
let actx=null, ganhoMusica=null, ganhoSfx=null, vozEl=null, musicaT=null;
const NOTAS=[262,294,330,392,440,523,392,330];

function iniciarAudio(){
  if(actx){ if(actx.state==='suspended') actx.resume(); return; }
  try{
    actx=new (window.AudioContext||window.webkitAudioContext)();
    ganhoMusica=actx.createGain(); ganhoMusica.gain.value=0.5*cfg.musica; ganhoMusica.connect(actx.destination);
    ganhoSfx=actx.createGain(); ganhoSfx.gain.value=cfg.sfx; ganhoSfx.connect(actx.destination);
    let i=0;
    musicaT=setInterval(()=>{ soar(NOTAS[i++%NOTAS.length],0.42,0.2,'triangle',0,ganhoMusica); },450);
  }catch(e){ actx=null; }
}
function soar(freq,dur,vol,tipo,atraso,destino){
  if(!actx) return;
  const t=actx.currentTime+(atraso||0);
  const o=actx.createOscillator(), g=actx.createGain();
  o.type=tipo||'sine'; o.frequency.value=freq;
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(vol,t+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(destino||ganhoSfx);
  o.start(t); o.stop(t+dur+0.05);
}
// Som de água: ruído filtrado (jato) e respingo
function ruido(dur,vol){
  if(!actx) return;
  const n=Math.floor(actx.sampleRate*dur);
  const buf=actx.createBuffer(1,n,actx.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
  const src=actx.createBufferSource(); src.buffer=buf;
  const f=actx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1800;
  const g=actx.createGain(); g.gain.value=vol;
  src.connect(f); f.connect(g); g.connect(ganhoSfx);
  src.start();
}
// Ducking: a música abaixa enquanto o personagem fala
function ducar(on){
  if(!actx) return;
  ganhoMusica.gain.setTargetAtTime(on ? 0.12*cfg.musica : 0.5*cfg.musica, actx.currentTime, 0.12);
}
function falarSintese(id){
  const texto=T[id];
  if(!texto || !('speechSynthesis' in window)) return;
  const u=new SpeechSynthesisUtterance(texto);
  u.lang='pt-BR'; u.rate=1; u.pitch=1.15;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function falar(id){
  if(!T[id]) return;
  if(vozEl){ vozEl.onended=null; vozEl.onerror=null; vozEl.pause(); }
  const el=new Audio('audio/'+id+'.mp3');
  vozEl=el;
  el.volume=clamp(cfg.voz,0,1);
  let usou=false;
  const fim=()=>{ if(vozEl===el) ducar(false); };
  const fallback=()=>{ if(usou) return; usou=true; fim(); falarSintese(id); };
  el.onplay=()=>ducar(true);
  el.onended=fim;
  el.onerror=fallback;
  const p=el.play();
  if(p && p.catch) p.catch(fallback);
}

/* Legendas na tela */
let dicaT=0;
function mostrarDica(txt){
  if(!txt) return;
  const d=$('dica');
  d.textContent=txt;
  d.classList.remove('oculto');
  clearTimeout(dicaT);
  dicaT=setTimeout(()=>d.classList.add('oculto'),4500);
}
function falarEMostrar(id){ falar(id); mostrarDica(T[id]); }

/* ==================== PARTÍCULAS ==================== */
// Sistema de partículas com cor por partícula, gravidade e aditivo (para chamas)
class Particulas{
  constructor(n,opt){
    opt=opt||{};
    this.n=n; this.i=0;
    this.p=new Float32Array(n*3);
    this.v=new Float32Array(n*3);
    this.vida=new Float32Array(n);
    this.cor=new Float32Array(n*3);
    const g=new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.p,3));
    g.setAttribute('color', new THREE.BufferAttribute(this.cor,3));
    this.mat=new THREE.PointsMaterial({
      size:opt.tam||0.4, vertexColors:true, transparent:true,
      opacity:opt.opac==null?1:opt.opac, depthWrite:false,
      blending: opt.aditivo ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    this.pts=new THREE.Points(g,this.mat);
    this.pts.frustumCulled=false;
    cena.add(this.pts);
    this.base=new THREE.Color(opt.cor==null?0xffffff:opt.cor);
    this.g=opt.g||0;
    for(let k=0;k<n;k++) this.p[k*3+1]=-999;
  }
  emitir(pos,vel,vida,cor){
    const k=this.i; this.i=(this.i+1)%this.n; const j=k*3;
    this.p[j]=pos.x; this.p[j+1]=pos.y; this.p[j+2]=pos.z;
    this.v[j]=vel.x; this.v[j+1]=vel.y; this.v[j+2]=vel.z;
    this.vida[k]=vida;
    const c=cor||this.base;
    this.cor[j]=c.r; this.cor[j+1]=c.g; this.cor[j+2]=c.b;
  }
  // Apaga partículas perto de um ponto (ex.: fumaça some quando o fogo é apagado)
  remover(x,z,r){
    for(let k=0;k<this.n;k++){
      if(this.vida[k]<=0) continue;
      const j=k*3;
      if(Math.hypot(this.p[j]-x,this.p[j+2]-z)<r){ this.vida[k]=0; this.p[j+1]=-999; }
    }
  }
  atualizar(dt){
    for(let k=0;k<this.n;k++){
      if(this.vida[k]<=0) continue;
      this.vida[k]-=dt;
      const j=k*3;
      this.v[j+1]-=this.g*dt;
      this.p[j]+=this.v[j]*dt;
      this.p[j+1]+=this.v[j+1]*dt;
      this.p[j+2]+=this.v[j+2]*dt;
      if(this.vida[k]<=0) this.p[j+1]=-999;
    }
    const geo=this.pts.geometry;
    geo.attributes.position.needsUpdate=true;
    geo.attributes.color.needsUpdate=true;
  }
}
const agua   = new Particulas(500,{cor:0x6fd3ff, tam:0.35, opac:0.9, g:14});
const vapor  = new Particulas(300,{cor:0xffffff, tam:0.8,  opac:0.5, g:-1.2});
const fumaca = new Particulas(600,{cor:0x5d636e, tam:1.2,  opac:0.55, g:-0.5});
const chama  = new Particulas(600,{cor:0xffa030, tam:0.9,  opac:0.9, aditivo:true, g:-2.5});
const confete= new Particulas(300,{tam:0.55, opac:1, g:3});

/* ==================== FOGOS (MISSÃO 1) ==================== */
const CORES_FOGO=[0xe53935,0xff9800,0xffd600,0x43a047,0x00acc1,0x3949ab,0x8e24aa,0xec407a,0x6d4c41,0x00897b];
const fogos=[];

function rotuloFogo(n){
  const cor='#'+CORES_FOGO[(n-1)%CORES_FOGO.length].toString(16).padStart(6,'0');
  return PC.texCanvas(128,128,(c,w,h)=>{
    c.fillStyle=cor; c.beginPath(); c.arc(w/2,h/2,58,0,Math.PI*2); c.fill();
    c.lineWidth=10; c.strokeStyle='#ffffff'; c.stroke();
    c.fillStyle='#ffffff'; c.font='bold 74px Arial';
    c.textAlign='center'; c.textBaseline='middle';
    c.shadowColor='rgba(0,0,0,0.5)'; c.shadowBlur=6;
    c.fillText(String(n), w/2, h/2+4);
  });
}

function criarFogo(n,x,z){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  cena.add(g);
  // Lenha
  const lenha=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1.4,8), new THREE.MeshStandardMaterial({color:0x6d4c41}));
  lenha.rotation.z=Math.PI/2; lenha.position.y=0.35; g.add(lenha);
  // Brilho de base (as chamas de verdade são partículas)
  const mats=[];
  const chamas=[[0xff7a00,0.7,1.5,0],[0xffb300,0.5,1.1,0.4],[0xffee58,0.35,0.8,-0.3]];
  for(const [cor,raio,alt,dx] of chamas){
    const m=new THREE.MeshStandardMaterial({color:cor,emissive:0xff5a00,emissiveIntensity:1.2,transparent:true,opacity:0.6});
    const c=new THREE.Mesh(new THREE.ConeGeometry(raio,alt,10), m);
    c.position.set(dx,alt/2+0.4,dx*0.5);
    g.add(c);
    mats.push(m);
  }
  // Número grande e colorido sempre virado para a câmera
  const rotulo=new THREE.Sprite(new THREE.SpriteMaterial({map:rotuloFogo(n), transparent:true}));
  rotulo.scale.set(1.6,1.6,1);
  rotulo.position.y=4.2;
  g.add(rotulo);
  const f={n,x,z,grupo:g,mats,rotulo,apagado:false,progresso:0,apagandoT:0,fase:Math.random()*6};
  fogos.push(f);
  return f;
}
for(let i=0;i<10;i++){
  const a=(i/10)*Math.PI*2+0.35;
  const r=8+(i%3)*2.2;
  criarFogo(i+1, Math.cos(a)*r, Math.sin(a)*r);
}

function animarFogo(f,dt,t){
  if(f.apagado){
    if(f.apagandoT>0){
      f.apagandoT-=dt;
      const s=Math.max(0.001,f.apagandoT/0.8);
      f.grupo.scale.set(s,s,s);
      if(f.apagandoT<=0) f.grupo.visible=false;
    }
    return;
  }
  f.grupo.scale.y=1+Math.sin(t*10+f.fase)*0.12;
  f.mats.forEach(m=>{ m.emissiveIntensity=1.2*(1-f.progresso*0.85); });
}

function emitirFogos(){
  for(const f of fogos){
    if(f.apagado) continue;
    chama.emitir(
      new THREE.Vector3(f.x+rnd(-0.6,0.6), 0.4+rnd(0,0.5), f.z+rnd(-0.6,0.6)),
      new THREE.Vector3(rnd(-0.3,0.3), rnd(1.8,3.2), rnd(-0.3,0.3)),
      rnd(0.5,0.9)
    );
    if(Math.random()<0.3*(1-f.progresso*0.6)){
      fumaca.emitir(
        new THREE.Vector3(f.x,3.2,f.z),
        new THREE.Vector3(rnd(-0.2,0.2), rnd(1.2,1.8), rnd(-0.2,0.2)),
        rnd(2.5,3.4)
      );
    }
  }
}

/* ==================== FILHOTES E VEÍCULOS ==================== */
const pets={};
let petId='marshall';
function obterPet(id){
  if(!pets[id]){
    const p=PC.criarPet(id);
    p.visible=false;
    cena.add(p);
    pets[id]=p;
  }
  return pets[id];
}
let ativo=obterPet('marshall');
ativo.visible=true;
ativo.position.set(0,0,2);
let petBase=null;          // filhote guardado enquanto o jogador está num veículo

const carro=PC.criarViatura();
carro.position.set(-14,0,6);
cena.add(carro);
const caminhao=PC.criarCaminhao();
caminhao.position.set(14,0,6);
cena.add(caminhao);
PC.veiculos.push(carro,caminhao);
const heli=PC.criarHelicoptero();
heli.position.set(-30,0,8);
cena.add(heli);

/* ==================== MOVIMENTO ==================== */
const joy={x:0,y:0};
let sprayManual=false;
const teclas={};
const gpAnt={};
const pedidos={pular:false, veiculo:false};
let heading=0, vel=0, walk=0, vy=0, noChao=true, dentro=null, padAberto=false;
const VMAX_PET=7.5, VMAX_VEI=13, RAIO_PET=1.0, RAIO_VEI=2.2, ALCANCE=7.5;

function empurrar(p,r){
  for(const c of colisores){
    const dx=p.x-c.x, dz=p.z-c.z;
    const d=Math.hypot(dx,dz);
    const min=c.r+r;
    if(d<min && d>0.0001){ const k=min/d; p.x=c.x+dx*k; p.z=c.z+dz*k; }
  }
}

function mover(dt,ent){
  const veic=!!ativo.userData.veiculo;
  const vmax=veic?VMAX_VEI:VMAX_PET;
  if(ent.mag>0.001){
    // Para cima = frente (+z quando heading = 0)
    heading=lerpAng(heading, Math.atan2(ent.x,ent.y), 1-Math.exp(-dt*(veic?4:9)));
  }
  const alvoV = ent.mag>0.001 ? vmax*Math.min(1,ent.mag) : 0;
  vel += (alvoV-vel)*(1-Math.exp(-dt*(alvoV>vel?5:7)));
  ativo.position.x += Math.sin(heading)*vel*dt;
  ativo.position.z += Math.cos(heading)*vel*dt;
  walk += dt*vel*1.3;
  if(veic) ativo.userData.rodas.forEach(r=>{ r.rotation.x += vel*dt/0.45; });

  // Limites do mapa e mar: não entra na água, exceto pelo píer
  const L=PC.limites;
  ativo.position.x=clamp(ativo.position.x,L.xMin,L.xMax);
  ativo.position.z=clamp(ativo.position.z,L.zMin,L.zMax);
  if(ativo.position.x>L.xAgua && !(ativo.position.z>2 && ativo.position.z<6)) ativo.position.x=L.xAgua;
  if(ativo.position.x>L.xPierMax) ativo.position.x=L.xPierMax;
  empurrar(ativo.position, veic?RAIO_VEI:RAIO_PET);
  ativo.rotation.y=heading;
}

function atualizarPulo(dt){
  if(ativo.userData.veiculo){ pedidos.pular=false; ativo.position.y=0; return; }
  if(pedidos.pular && noChao){ vy=8.5; noChao=false; }
  pedidos.pular=false;
  if(!noChao){
    vy-=22*dt;
    ativo.position.y+=vy*dt;
    if(ativo.position.y<=0){ ativo.position.y=0; vy=0; noChao=true; }
  }
}

function idle(dt,t){
  pedidos.pular=false; pedidos.veiculo=false;
  if(!ativo.userData.veiculo) PC.animarPet(ativo,t,walk,false,!noChao,dt);
}

function tentarVeiculo(){
  if(dentro){ sair(); return; }
  if(!noChao) return;
  const perto=PC.veiculos.find(v=>Math.hypot(v.position.x-ativo.position.x, v.position.z-ativo.position.z)<6);
  if(!perto){ mostrarDica('Chegue perto de um veículo para entrar!'); return; }
  dentro=perto;
  petBase=ativo;
  petBase.visible=false;
  ativo=perto;
  heading=perto.rotation.y;
  vel=0;
  mostrarDica('Vamos lá! Use o joystick para dirigir.');
}
function sair(){
  const v=ativo;
  ativo=petBase;
  ativo.position.copy(v.position);
  ativo.position.x+=Math.sin(heading+Math.PI/2)*2.4;
  ativo.position.z+=Math.cos(heading+Math.PI/2)*2.4;
  empurrar(ativo.position,RAIO_PET);
  ativo.rotation.y=heading;
  ativo.visible=true;
  dentro=null; petBase=null; vel=0;
}

function trocarPet(id){
  if(dentro){ mostrarDica('Saia do veículo antes de trocar de filhote.'); return; }
  if(id===petId) return;
  const novo=obterPet(id);
  novo.position.copy(ativo.position);
  novo.rotation.y=heading;
  novo.visible=true;
  ativo.visible=false;
  ativo=novo; petId=id;
  noChao=true; vy=0; vel=0;
  mostrarDica(`Agora você é o ${PC.PETS[id].nome}!`);
}

/* ==================== CONTROLES ==================== */
const joyZona=$('joyZona'), joyBase=$('joyBase'), joyKnob=$('joyKnob');
const JOY_R=70;
let joyId=null, joyOrigem={x:0,y:0};

function moverJoy(e){
  let dx=e.clientX-joyOrigem.x, dy=e.clientY-joyOrigem.y;
  const d=Math.hypot(dx,dy);
  const k=d>JOY_R ? JOY_R/d : 1;
  dx*=k; dy*=k;
  joyKnob.style.transform=`translate(${dx}px,${dy}px)`;
  joy.x=dx/JOY_R;
  joy.y=-dy/JOY_R;
}
joyZona.addEventListener('pointerdown',e=>{
  if(joyId!==null) return;
  joyId=e.pointerId;
  joyZona.setPointerCapture(e.pointerId);
  joyOrigem={x:e.clientX,y:e.clientY};
  joyBase.style.left=e.clientX+'px';
  joyBase.style.top=e.clientY+'px';
  joyKnob.style.transform='translate(0px,0px)';
  joyBase.classList.remove('oculto');
  iniciarAudio();
  moverJoy(e);
  e.preventDefault();
});
joyZona.addEventListener('pointermove',e=>{ if(e.pointerId===joyId) moverJoy(e); });
function soltarJoy(e){
  if(e.pointerId!==joyId) return;
  joyId=null; joy.x=0; joy.y=0;
  joyBase.classList.add('oculto');
}
joyZona.addEventListener('pointerup',soltarJoy);
joyZona.addEventListener('pointercancel',soltarJoy);

const btnFerramenta=$('btnFerramenta');
btnFerramenta.addEventListener('pointerdown',e=>{ sprayManual=true; btnFerramenta.setPointerCapture(e.pointerId); iniciarAudio(); e.preventDefault(); });
const soltarJato=()=>{ sprayManual=false; };
btnFerramenta.addEventListener('pointerup',soltarJato);
btnFerramenta.addEventListener('pointercancel',soltarJato);

$('btnPular').addEventListener('pointerdown',e=>{ pedidos.pular=true; iniciarAudio(); e.preventDefault(); });
$('btnVeiculo').addEventListener('pointerdown',e=>{ pedidos.veiculo=true; iniciarAudio(); e.preventDefault(); });

addEventListener('keydown',e=>{
  if(!e.repeat){
    if(e.code==='ShiftLeft'||e.code==='KeyK') pedidos.pular=true;
    if(e.code==='KeyE') pedidos.veiculo=true;
  }
  teclas[e.code]=true;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup',e=>{ teclas[e.code]=false; });

function lerEntrada(){
  let x=joy.x, y=joy.y;
  let jato=sprayManual || !!teclas.Space;
  if(teclas.ArrowLeft||teclas.KeyA) x-=1;
  if(teclas.ArrowRight||teclas.KeyD) x+=1;
  if(teclas.ArrowUp||teclas.KeyW) y+=1;
  if(teclas.ArrowDown||teclas.KeyS) y-=1;
  const pads=navigator.getGamepads ? navigator.getGamepads() : [];
  for(const g of pads){
    if(!g) continue;
    const ax=g.axes[0]||0, ay=g.axes[1]||0;
    if(Math.abs(ax)>0.15) x+=ax;
    if(Math.abs(ay)>0.15) y-=ay;
    const b=g.buttons;
    const aP=!!(b[0]&&b[0].pressed), yP=!!(b[3]&&b[3].pressed), xP=!!(b[2]&&b[2].pressed);
    if(aP && !gpAnt.a) pedidos.pular=true;
    if(yP && !gpAnt.y) pedidos.veiculo=true;
    gpAnt.a=aP; gpAnt.y=yP;
    if(xP || (b[7]&&b[7].pressed)) jato=true;
  }
  let m=Math.hypot(x,y);
  if(m>1){ x/=m; y/=m; m=1; }
  if(m<0.12){ x=0; y=0; m=0; }
  return {x:x*cfg.sens, y:y*cfg.sens, mag:m, jato:!!jato};
}

/* ==================== MISSÃO 1 ==================== */
let modo='titulo';   // 'titulo' | 'briefing' | 'jogando' | 'vitoria'
let nextN=1, feitos=0, atingido=null;
let sprayCD=0, semJatoT=0, semAcertoT=0, dicaCD=0, jaUsouJato=false, dicaSprayFalada=false;

function atualizarHUD(){
  $('contador').innerHTML=`🔥 Focos: ${feitos}/10 · Próximo: <b>${Math.min(nextN,10)}</b>`;
}
function resetarMissao(){
  if(dentro) sair();
  nextN=1; feitos=0; atingido=null;
  for(const f of fogos){
    f.apagado=false; f.progresso=0; f.apagandoT=0;
    f.grupo.visible=true; f.grupo.scale.set(1,1,1);
    f.rotulo.material.color.set(0xffffff);
    f.mats.forEach(m=>{ m.emissiveIntensity=1.2; });
  }
  ativo.position.set(0,0,2);
  ativo.position.y=0;
  noChao=true; vy=0; vel=0;
  heading=0; ativo.rotation.y=0;
  semJatoT=0; semAcertoT=0; dicaCD=0; jaUsouJato=false; dicaSprayFalada=false;
  atualizarHUD();
}

function emitirJato(dt){
  sprayCD-=dt;
  if(sprayCD<=0){ sprayCD=0.3; ruido(0.3,0.22); }
  const bico=ativo.userData.bico.clone();
  ativo.localToWorld(bico);
  for(let i=0;i<7;i++){
    agua.emitir(
      bico,
      new THREE.Vector3(Math.sin(heading)*16+rnd(-1.4,1.4), rnd(1,2.6), Math.cos(heading)*16+rnd(-1.4,1.4)),
      0.55
    );
  }
}

function apagar(f){
  f.apagado=true;
  f.apagandoT=0.8;
  f.rotulo.material.color.set(0x7cff7c);
  feitos++;
  nextN=feitos+1;
  atualizarHUD();
  // Fumaça some e vira vapor branco
  fumaca.remover(f.x,f.z,3.5);
  chama.remover(f.x,f.z,2.5);
  for(let i=0;i<50;i++){
    vapor.emitir(
      new THREE.Vector3(f.x+rnd(-0.8,0.8), 1+Math.random()*1.5, f.z+rnd(-0.8,0.8)),
      new THREE.Vector3(rnd(-0.6,0.6), rnd(1.2,2.8), rnd(-0.6,0.6)),
      2.2+Math.random()*0.8
    );
  }
  soar(880,0.25,0.25,'triangle',0,ganhoSfx);
  soar(1320,0.35,0.22,'triangle',0.12,ganhoSfx);
  if(feitos>=10){
    setTimeout(vitoria,1800);
  } else {
    falar('apagado_'+f.n);
    setTimeout(()=>{
      if(modo==='jogando' && nextN<=10) falarEMostrar('dica_'+nextN);
    },3600);
  }
}

function jogar(dt,t){
  if(pedidos.veiculo){ pedidos.veiculo=false; if(!padAberto) tentarVeiculo(); }
  const ent = padAberto ? {x:0,y:0,mag:0,jato:false} : lerEntrada();
  mover(dt,ent);
  atualizarPulo(dt);

  const alvo=fogos[nextN-1];
  for(const f of fogos){
    if(!f.apagado && f!==atingido) f.progresso=Math.max(0,f.progresso-dt*0.6);
  }
  atingido=null;
  $('btnFerramenta').classList.toggle('ativo', ent.jato);

  const podeJato=!!ativo.userData.bico;
  if(ent.jato && podeJato){
    jaUsouJato=true;
    semJatoT=0;
    emitirJato(dt);

    if(alvo && !alvo.apagado){
      const px=ativo.position.x, pz=ativo.position.z;
      const tx=alvo.x-px, tz=alvo.z-pz;
      const dist=Math.hypot(tx,tz);
      // Mira assistida: com o joystick parado, o filhote vira para o foco certo
      if(ent.mag<0.2 && dist<12){
        heading=lerpAng(heading, Math.atan2(tx,tz), 1-Math.exp(-dt*3));
        ativo.rotation.y=heading;
      }
      const cosA=(Math.sin(heading)*tx+Math.cos(heading)*tz)/(dist||1);
      if(dist<ALCANCE && cosA>0.8){
        atingido=alvo;
        semAcertoT=0;
        alvo.progresso=Math.min(1,alvo.progresso+dt/1.4);
        if(Math.random()<0.35){
          vapor.emitir(
            new THREE.Vector3(alvo.x+rnd(-0.6,0.6),1.6,alvo.z+rnd(-0.6,0.6)),
            new THREE.Vector3(rnd(-0.3,0.3),1.2,rnd(-0.3,0.3)),
            1.6
          );
        }
        if(alvo.progresso>=1) apagar(alvo);
      } else {
        semAcertoT+=dt;
        if(semAcertoT>3 && dicaCD<=0){
          dicaCD=8; semAcertoT=0;
          falarEMostrar('dica_'+nextN);
        }
      }
    }
  } else {
    semJatoT+=dt;
    if(!jaUsouJato && !dicaSprayFalada && semJatoT>15){
      dicaSprayFalada=true;
      falarEMostrar('dica_spray');
    }
  }
  dicaCD=Math.max(0,dicaCD-dt);

  // Animação do filhote (vehicle tem a própria)
  if(!ativo.userData.veiculo) PC.animarPet(ativo,t,walk,vel>0.5,!noChao,dt);
}

function vitoria(){
  if(modo!=='jogando') return;
  modo='vitoria';
  mostrarHUD(false);
  mostrar('vitoria');
  biscoitos++;
  store.set('pc_biscoitos',biscoitos);
  $('biscoitos').textContent=biscoitos;
  soar(523,0.3,0.2,'triangle',0);
  soar(659,0.3,0.2,'triangle',0.2);
  soar(784,0.45,0.22,'triangle',0.4);
  falar('vitoria');
  confeteCena();
}

// Chuva de confetes 3D colorida sobre o filhote
function confeteCena(){
  const px=ativo.position.x, pz=ativo.position.z;
  for(let i=0;i<240;i++){
    const pos=new THREE.Vector3(px+rnd(-14,14), rnd(8,16), pz+rnd(-14,14));
    const vel=new THREE.Vector3(rnd(-1,1), rnd(-2,0), rnd(-1,1));
    const cor=new THREE.Color().setHSL(Math.random(),0.9,0.6);
    confete.emitir(pos,vel,rnd(5,8),cor);
  }
}

/* ==================== FLUXO DAS TELAS ==================== */
function mostrar(id){
  ['titulo','briefing','opcoes','vitoria'].forEach(x=>{
    $(x).classList.toggle('oculto', x!==id);
  });
}
function mostrarHUD(on){ $('hud').classList.toggle('oculto', !on); }

function voltarTitulo(){
  if(dentro) sair();
  modo='titulo';
  mostrarHUD(false);
  mostrar('titulo');
  fecharPad();
  if(vozEl) vozEl.pause();
  ducar(false);
  resetarMissao();
}
window.podeVoltar = ()=> modo!=='titulo';
window.voltarAoTitulo = voltarTitulo;

/* ==================== PUP-PAD DO RYDER ==================== */
const padGrade=$('padGrade'), padMenu=$('padMenu');
for(const id of Object.keys(PC.PETS)){
  const p=PC.PETS[id];
  const b=document.createElement('button');
  b.className='pupcard';
  b.innerHTML=`<div class="dot" style="background:${p.corCSS}"></div>${p.nome}`;
  b.onclick=()=>{ trocarPet(id); fecharPad(); };
  padGrade.appendChild(b);
}
function mostrarPadMenu(){
  padMenu.classList.remove('oculto');
  padGrade.classList.add('oculto');
  $('padVoltar').classList.add('oculto');
}
function mostrarPadGrade(){
  padMenu.classList.add('oculto');
  padGrade.classList.remove('oculto');
  $('padVoltar').classList.remove('oculto');
}
function abrirPad(){
  padAberto=true;
  mostrarPadMenu();
  $('pupPad').classList.remove('oculto');
}
function fecharPad(){
  padAberto=false;
  $('pupPad').classList.add('oculto');
}
$('btnPad').onclick=abrirPad;
$('padFechar').onclick=fecharPad;
$('padTrocar').onclick=mostrarPadGrade;
$('padVoltar').onclick=mostrarPadMenu;
$('padFarol').onclick=voltarTitulo;
$('padRepetir').onclick=()=>{
  if(modo==='jogando' && feitos<10) falarEMostrar('dica_'+nextN);
  else if(modo==='briefing') falarEMostrar('briefing');
  fecharPad();
};

/* ==================== BOTÕES DE TELA ==================== */
$('btnMissao1').onclick=()=>{
  iniciarAudio();
  resetarMissao();
  modo='briefing';
  mostrar('briefing');
  mostrarHUD(false);
  falarEMostrar('briefing');
};
$('btnComecar').onclick=()=>{
  iniciarAudio();
  modo='jogando';
  mostrar(null);
  mostrarHUD(true);
  atualizarHUD();
  falarEMostrar('dica_1');
};
$('btnVoltarBrief').onclick=voltarTitulo;
$('btnVoltarVit').onclick=voltarTitulo;
$('btnOpcoes').onclick=()=>{ mostrar('opcoes'); };
$('btnVoltarOpc').onclick=()=>{ mostrar('titulo'); };

// Opções dos pais
for(const [id,chave] of [['volVoz','voz'],['volMusica','musica'],['volSfx','sfx'],['sensi','sens']]){
  const el=$(id);
  el.value=cfg[chave];
  el.addEventListener('input',()=>{
    cfg[chave]=parseFloat(el.value);
    store.set('pc_cfg',cfg);
    if(chave==='musica' && ganhoMusica) ganhoMusica.gain.value=0.5*cfg.musica;
    if(chave==='sfx' && ganhoSfx) ganhoSfx.gain.value=cfg.sfx;
  });
}

/* ==================== CÂMERA ==================== */
function camTitulo(t){
  const a=t*0.16;
  camera.position.set(LX+Math.sin(a)*22, 9+Math.sin(t*0.4)*0.8, LZ+Math.cos(a)*22);
  camera.lookAt(LX, 6, LZ);
}
function seguirCamera(dt){
  const px=ativo.position.x, pz=ativo.position.z;
  const dist=dentro?12:8.5, alt=dentro?6.5:4.4;
  const cx=px-Math.sin(heading)*dist, cz=pz-Math.cos(heading)*dist;
  const k=1-Math.exp(-dt*4);
  camera.position.x+=(cx-camera.position.x)*k;
  camera.position.y+=(alt-camera.position.y)*k;
  camera.position.z+=(cz-camera.position.z)*k;
  camera.lookAt(px,1.6,pz);
}

/* ==================== LOOP PRINCIPAL ==================== */
function atualizar(dt,t){
  for(const f of PC.animados) f(t,dt);
  for(const f of fogos) animarFogo(f,dt,t);
  emitirFogos();

  if(modo==='titulo'){
    camTitulo(t);
    idle(dt,t);
  } else if(modo==='jogando'){
    jogar(dt,t);
    seguirCamera(dt);
  } else {
    idle(dt,t);
    seguirCamera(dt);
  }

  // Sol acompanha o jogador: sombras suaves sempre na área certa
  PC.sol.position.set(ativo.position.x+30, 28, ativo.position.z-20);
  PC.sol.target.position.set(ativo.position.x, 0, ativo.position.z);

  agua.atualizar(dt);
  vapor.atualizar(dt);
  fumaca.atualizar(dt);
  chama.atualizar(dt);
  confete.atualizar(dt);
  renderer.render(cena,camera);
}

addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight,false);
});

let ultimo=performance.now(), tempo=0;
function frame(now){
  const dt=Math.min(0.05,(now-ultimo)/1000);
  ultimo=now;
  tempo+=dt;
  atualizar(dt,tempo);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

})();
