/* personagens.js - filhotes e veículos em 3D, feitos de formas compostas */
(function(){
'use strict';
const PC = window.PC = window.PC || {};
PC.helis = PC.helis || [];
PC.veiculos = PC.veiculos || [];
PC.animados = PC.animados || [];
const rnd = (a,b) => a + Math.random()*(b-a);

function mat(cor,o){ return new THREE.MeshStandardMaterial(Object.assign({color:cor,roughness:0.55,metalness:0.02},o||{})); }
function caixa(w,h,d,m,x,y,z,pai){
  const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m);
  o.position.set(x,y,z); o.castShadow=true; (pai).add(o);
  return o;
}

/* ---------- CONFIGURAÇÃO DOS FILHOTES ---------- */
const PETS = {
  chase:   {nome:'Chase',   corCSS:'#1e5fd1', corpo:0xc8924f, sela:0x2a2420, focinho:0x2a2420, muzzle:0xe8c9a0, orelhaPendente:false, orelha:0x2a2420, chapeu:'policia',        cor:0x1e5fd1, mochilaCor:0x1e5fd1, escala:1},
  marshall:{nome:'Marshall',corCSS:'#e53935', corpo:0xfafafa, manchas:0x1a1a1a, focinho:0x1a1a1a, muzzle:0xfafafa, orelhaPendente:true,  orelha:0x1a1a1a, chapeu:'capacete',       cor:0xe53935, mochilaCor:0xe53935, mangueira:true, escala:1},
  skye:    {nome:'Skye',    corCSS:'#ff6fb5', corpo:0xe9b26a, focinho:0x3b2a1e, muzzle:0xf7e2c0, orelhaPendente:true,  orelha:0xb9783a, chapeu:'capacete_rosa',  cor:0xff6fb5, mochilaCor:0xff6fb5, rabo:'longo', escala:0.95},
  rocky:   {nome:'Rocky',   corCSS:'#2e9e44', corpo:0x9b7450, focinho:0x2b2b2b, muzzle:0xd9c3a0, orelhaPendente:true,  orelha:0x5b4327, chapeu:'bone',           cor:0x2e9e44, mochilaCor:0x2e9e44, escala:1},
  rubble:  {nome:'Rubble',  corCSS:'#ffb300', corpo:0xf5e07a, focinho:0x3b2a1e, muzzle:0xfff3c4, orelhaPendente:true,  orelha:0xd9b94a, chapeu:'capacete_obra',  cor:0xffb300, mochilaCor:0xffb300, escala:1.12},
  zuma:    {nome:'Zuma',    corCSS:'#ff8a00', corpo:0x7a4a2a, focinho:0x2a1a10, muzzle:0x9b6a44, orelhaPendente:true,  orelha:0x4a2a15, chapeu:'colete',         cor:0xff8a00, mochilaCor:0x1e88e5, escala:0.98}
};
PC.PETS = PETS;

/* ---------- FILHOTE ---------- */
PC.criarPet = function(id){
  const c=PETS[id];
  const s=c.escala;
  const g=new THREE.Group();
  const root=new THREE.Group();
  root.scale.set(s,s,s);
  g.add(root);

  const corM=mat(c.corpo,{roughness:0.7});
  const focM=mat(c.focinho,{roughness:0.4});
  const muzzleM=mat(c.muzzle,{roughness:0.7});
  const orM=mat(c.orelha,{roughness:0.7});
  const branco=mat(0xffffff,{roughness:0.15});
  const preto=mat(0x111111,{roughness:0.25});
  const brilhoM=new THREE.MeshBasicMaterial({color:0xffffff});

  function M(geo,m,x,y,z,pai){
    const o=new THREE.Mesh(geo,m);
    o.position.set(x,y,z); o.castShadow=true;
    (pai||root).add(o);
    return o;
  }

  // Corpo
  const corpo=M(new THREE.SphereGeometry(0.55,24,18),corM,0,0.95,0);
  corpo.scale.set(1,0.8,1.4);
  if(c.manchas){
    const mm=mat(c.manchas,{roughness:0.5});
    for(let i=0;i<16;i++){
      const d=new THREE.Vector3(rnd(-1,1),rnd(-1,0.6),rnd(-1,1)).normalize();
      const sp=M(new THREE.SphereGeometry(rnd(0.09,0.15),10,8),mm,d.x*0.56,0.95+d.y*0.45,d.z*0.8);
      sp.scale.set(1,0.5,1);
    }
  }
  if(c.sela){
    const sd=M(new THREE.SphereGeometry(0.5,20,14),mat(c.sela),0,1.22,-0.05);
    sd.scale.set(0.95,0.45,1.2);
  }

  // Cabeça
  const cab=new THREE.Group();
  cab.position.set(0,1.55,0.75);
  root.add(cab);
  M(new THREE.SphereGeometry(0.42,24,18),corM,0,0,0,cab);
  M(new THREE.SphereGeometry(0.2,16,12),muzzleM,0,-0.12,0.32,cab).scale.set(1,0.85,1.15);
  M(new THREE.SphereGeometry(0.08,12,10),focM,0,-0.02,0.52,cab);

  // Olhos brilhantes (branco + pupila + reflexo)
  for(const sx of [-1,1]){
    M(new THREE.SphereGeometry(0.085,14,12),branco,sx*0.16,0.1,0.36,cab);
    M(new THREE.SphereGeometry(0.05,12,10),preto,sx*0.16,0.1,0.43,cab);
    M(new THREE.SphereGeometry(0.018,8,6),brilhoM,sx*0.16+0.02,0.13,0.47,cab);
  }

  // Orelhas
  for(const sx of [-1,1]){
    if(c.orelhaPendente){
      const o=M(new THREE.SphereGeometry(0.2,16,12),orM,sx*0.36,-0.1,-0.02,cab);
      o.scale.set(0.55,1.3,0.4); o.rotation.z=sx*0.3;
    } else {
      const o=M(new THREE.ConeGeometry(0.14,0.36,12),orM,sx*0.22,0.42,-0.02,cab);
      o.rotation.z=-sx*0.15;
    }
  }

  // Chapéus e capacetes
  const ch=c.chapeu;
  if(ch==='capacete'||ch==='capacete_rosa'){
    const cm=mat(c.cor,{metalness:0.35,roughness:0.25});
    M(new THREE.SphereGeometry(0.47,24,12,0,Math.PI*2,0,Math.PI/2),cm,0,0.08,0,cab);
    M(new THREE.CylinderGeometry(0.49,0.49,0.08,24),cm,0,0.05,0,cab);
    M(new THREE.SphereGeometry(0.11,12,10),mat(0xffc107,{metalness:0.7,roughness:0.2}),0,0.45,0.32,cab);
    if(ch==='capacete_rosa'){
      for(const sx of [-1,1]) M(new THREE.SphereGeometry(0.08,10,8),branco,sx*0.36,0.3,0.25,cab);
    }
  } else if(ch==='policia'){
    M(new THREE.CylinderGeometry(0.36,0.4,0.24,24),mat(c.cor),0,0.5,0,cab);
    M(new THREE.CylinderGeometry(0.42,0.42,0.05,24),mat(0x111111),0,0.38,0,cab);
    M(new THREE.BoxGeometry(0.56,0.04,0.28),mat(0x111111),0,0.4,0.3,cab);
    M(new THREE.SphereGeometry(0.07,10,8),mat(0xffc107,{metalness:0.7,roughness:0.2}),0,0.5,0.37,cab);
  } else if(ch==='bone'){
    M(new THREE.SphereGeometry(0.43,20,12,0,Math.PI*2,0,Math.PI/2),mat(c.cor),0,0.1,0,cab);
    M(new THREE.BoxGeometry(0.5,0.05,0.3),mat(c.cor),0,0.08,0.42,cab).rotation.x=-0.25;
  } else if(ch==='capacete_obra'){
    M(new THREE.SphereGeometry(0.47,24,12,0,Math.PI*2,0,Math.PI/2),mat(c.cor,{roughness:0.3}),0,0.1,0,cab).scale.set(1,0.85,1);
    M(new THREE.CylinderGeometry(0.53,0.53,0.05,24),mat(c.cor),0,0.07,0.02,cab);
  } else if(ch==='colete'){
    // colete laranja cobrindo o peito e um lenço no pescoço
    const colete=M(new THREE.SphereGeometry(0.6,20,14),mat(c.cor,{roughness:0.5}),0,0.95,0.05);
    colete.scale.set(1.0,0.7,1.25);
    M(new THREE.ConeGeometry(0.2,0.25,12),mat(0xe53935),0,1.2,0.6).rotation.x=Math.PI;
  }

  // Mochila funcional (com bolso e emblema)
  M(new THREE.BoxGeometry(0.62,0.6,0.38),mat(c.mochilaCor,{roughness:0.5}),0,1.35,-0.55);
  M(new THREE.BoxGeometry(0.4,0.22,0.06),mat(0x000000,{transparent:true,opacity:0.18}),0,1.12,-0.75);
  const emb=new THREE.Mesh(new THREE.TorusGeometry(0.17,0.04,8,20),branco);
  emb.position.set(0,1.35,-0.745); root.add(emb);

  // Mangueira de água (só o Marshall) saindo da mochila até o focinho
  if(c.mangueira){
    const curva=new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,1.55,-0.6), new THREE.Vector3(0,1.85,-0.1),
      new THREE.Vector3(0,1.8,0.7), new THREE.Vector3(0,1.5,1.2)
    ]);
    M(new THREE.TubeGeometry(curva,24,0.05,6,false), mat(0x607d8b,{roughness:0.4}), 0,0,0);
    M(new THREE.ConeGeometry(0.09,0.25,12), mat(0x37474f), 0,1.42,1.35).rotation.x=Math.PI/2;
  }

  // Patas articuladas (quadril + joelho)
  const patas=[];
  const posPatas=[[-0.3,0.92,0.5,0],[0.3,0.92,0.5,Math.PI],[-0.3,0.92,-0.5,Math.PI],[0.3,0.92,-0.5,0]];
  for(const [x,y,z,f] of posPatas){
    const hip=new THREE.Group(); hip.position.set(x,y,z); root.add(hip);
    const coxa=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.12,0.5,12), corM);
    coxa.position.y=-0.25; coxa.castShadow=true; hip.add(coxa);
    const knee=new THREE.Group(); knee.position.y=-0.5; hip.add(knee);
    const canela=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.09,0.42,12), corM);
    canela.position.y=-0.21; canela.castShadow=true; knee.add(canela);
    const pata=new THREE.Mesh(new THREE.SphereGeometry(0.15,14,10), focM);
    pata.position.set(0,-0.44,0.05); pata.scale.set(1,0.55,1.35); pata.castShadow=true; knee.add(pata);
    patas.push({hip,knee,f});
  }

  // Rabo
  const rabo=new THREE.Group();
  rabo.position.set(0,1.1,-0.95); rabo.rotation.x=-0.6;
  root.add(rabo);
  const comp = c.rabo==='longo' ? 0.95 : 0.7;
  const rab=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.08,comp,8), corM);
  rab.position.y=comp/2; rab.castShadow=true; rabo.add(rab);

  g.userData = {
    id, root, patas, rabo, cab,
    bico: new THREE.Vector3(0, 1.42*s, 1.45*s)   // ponto de saída da água
  };
  return g;
};

// Animação de caminhada, pulo e rabo abanando
PC.animarPet = function(g,t,walk,andando,noAr,dt){
  const u=g.userData;
  const k=Math.min(1,dt*10);
  for(const p of u.patas){
    if(noAr){
      p.hip.rotation.x += (-0.8 - p.hip.rotation.x)*k;
      p.knee.rotation.x += (1.1 - p.knee.rotation.x)*k;
    } else if(andando){
      const s=Math.sin(walk+p.f);
      p.hip.rotation.x = s*0.6;
      p.knee.rotation.x = Math.max(0,-s)*0.9;
    } else {
      p.hip.rotation.x *= 1-k*0.8;
      p.knee.rotation.x *= 1-k*0.8;
    }
  }
  u.root.position.y = (andando && !noAr) ? Math.abs(Math.sin(walk*2))*0.05 : 0;
  u.rabo.rotation.z = Math.sin(t*(andando?14:6))*(andando?0.5:0.25);
};

/* ---------- VEÍCULOS ---------- */
function roda(raio,larg,cor){
  const g=new THREE.Group();
  const pneu=new THREE.Mesh(new THREE.CylinderGeometry(raio,raio,larg,20), mat(0x222222,{roughness:0.9}));
  pneu.rotation.z=Math.PI/2; pneu.castShadow=true; g.add(pneu);
  const aro=new THREE.Mesh(new THREE.CylinderGeometry(raio*0.55,raio*0.55,larg+0.02,14), mat(cor,{metalness:0.5,roughness:0.3}));
  aro.rotation.z=Math.PI/2; g.add(aro);
  return g;
}

// Viatura da Polícia (Chase)
PC.criarViatura = function(){
  const g=new THREE.Group();
  const azul=mat(0x1e5fd1,{metalness:0.3,roughness:0.35});
  const branco=mat(0xf5f5f5,{roughness:0.3});
  const vidro=mat(0x1b2a3a,{roughness:0.1,metalness:0.6});
  caixa(2.2,0.6,4.2,azul,0,0.8,0,g);
  caixa(2.25,0.22,2.4,branco,0,1.12,-0.1,g);
  caixa(1.9,0.55,2.0,vidro,0,1.5,-0.25,g);
  caixa(2.0,0.1,2.1,azul,0,1.8,-0.25,g);
  caixa(1.4,0.16,0.4,mat(0x222222),0,1.95,-0.25,g);
  const lR=new THREE.MeshStandardMaterial({color:0x440000,emissive:0xff1a1a,emissiveIntensity:0.2});
  const lB=new THREE.MeshStandardMaterial({color:0x000044,emissive:0x2a6bff,emissiveIntensity:0.2});
  caixa(0.6,0.14,0.3,lR,-0.35,2.1,-0.25,g);
  caixa(0.6,0.14,0.3,lB,0.35,2.1,-0.25,g);
  for(const sx of [-1,1]){
    caixa(0.3,0.16,0.08,new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:0.8}),sx*0.7,0.9,2.12,g);
    caixa(0.3,0.16,0.08,new THREE.MeshStandardMaterial({color:0x550000,emissive:0xff0000,emissiveIntensity:0.6}),sx*0.7,0.9,-2.12,g);
  }
  const rodas=[];
  for(const [x,z] of [[-1.1,1.4],[1.1,1.4],[-1.1,-1.4],[1.1,-1.4]]){
    const r=roda(0.45,0.35,0xcfd8dc); r.position.set(x,0.45,z); g.add(r); rodas.push(r);
  }
  g.userData={veiculo:true, tipo:'viatura', rodas, luzes:[lR,lB]};
  return g;
};

// Caminhão de bombeiro (Marshall) com canhão d'água
PC.criarCaminhao = function(){
  const g=new THREE.Group();
  const vermelho=mat(0xd32f2f,{metalness:0.25,roughness:0.35});
  const prata=mat(0xcfd8dc,{metalness:0.6,roughness:0.3});
  const vidro=mat(0x1b2a3a,{roughness:0.1,metalness:0.6});
  caixa(2.4,0.9,5,vermelho,0,1.0,-0.4,g);
  caixa(2.4,1.4,1.6,vermelho,0,1.55,1.6,g);
  caixa(2.2,0.7,0.1,vidro,0,1.7,2.41,g);
  const tanque=new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.7,2.4,16), mat(0xbfe9ff,{transparent:true,opacity:0.55,roughness:0.2}));
  tanque.rotation.x=Math.PI/2; tanque.position.set(0,1.75,-0.6); g.add(tanque);
  caixa(1.1,0.12,3.4,prata,0,2.3,-0.9,g);
  const canhao=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.18,0.6,12), prata);
  canhao.rotation.x=Math.PI/2; canhao.position.set(0,2.4,1.9); g.add(canhao);
  const s1=new THREE.MeshStandardMaterial({color:0x330000,emissive:0xff2222,emissiveIntensity:0.2});
  const s2=new THREE.MeshStandardMaterial({color:0x330000,emissive:0xff2222,emissiveIntensity:0.2});
  caixa(0.7,0.16,0.3,s1,-0.5,2.35,1.6,g);
  caixa(0.7,0.16,0.3,s2,0.5,2.35,1.6,g);
  const rodas=[];
  for(const [x,z] of [[-1.15,1.5],[1.15,1.5],[-1.15,-1.6],[1.15,-1.6]]){
    const r=roda(0.5,0.4,0xcfd8dc); r.position.set(x,0.5,z); g.add(r); rodas.push(r);
  }
  g.userData={veiculo:true, tipo:'caminhao', rodas, luzes:[s1,s2], bico:new THREE.Vector3(0,2.45,2.3)};
  return g;
};

// Helicóptero da Skye (decoração, rotores girando)
PC.criarHelicoptero = function(){
  const g=new THREE.Group();
  const rosa=mat(0xff6fb5,{metalness:0.2,roughness:0.35});
  const vidro=new THREE.MeshStandardMaterial({color:0x9fd8ff,metalness:0.5,roughness:0.1,transparent:true,opacity:0.8});
  const escuro=mat(0x263238);
  const corpo=new THREE.Mesh(new THREE.SphereGeometry(1,24,16), rosa);
  corpo.scale.set(1.1,0.95,1.9); corpo.position.set(0,2.2,0); corpo.castShadow=true; g.add(corpo);
  const cab=new THREE.Mesh(new THREE.SphereGeometry(0.85,20,14), vidro);
  cab.scale.set(1,0.9,0.8); cab.position.set(0,2.25,1.45); g.add(cab);
  const cauda=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.3,3.2,12), rosa);
  cauda.rotation.x=Math.PI/2; cauda.position.set(0,2.4,-3.2); cauda.castShadow=true; g.add(cauda);
  caixa(0.1,0.9,0.6,rosa,0,3.0,-4.7,g);
  const rotorCauda=new THREE.Group(); rotorCauda.position.set(0.22,3.0,-4.75); g.add(rotorCauda);
  caixa(0.06,1.2,0.14,escuro,0,0,0,rotorCauda);
  const rotorP=new THREE.Group(); rotorP.position.set(0,3.5,0); g.add(rotorP);
  caixa(7,0.05,0.28,escuro,0,0,0,rotorP);
  caixa(0.28,0.05,7,escuro,0,0,0,rotorP);
  const mastro=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.5,8), escuro);
  mastro.position.set(0,3.2,0); g.add(mastro);
  caixa(0.12,0.12,3.6,escuro,-0.8,0.45,0.1,g);
  caixa(0.12,0.12,3.6,escuro,0.8,0.45,0.1,g);
  for(const sx of [-0.8,0.8]) for(const sz of [-1,1]) caixa(0.08,0.9,0.08,escuro,sx,1.0,sz,g);
  g.userData={veiculo:false, helice:[rotorP,rotorCauda]};
  PC.helis.push(g);
  return g;
};

/* ---------- ANIMAÇÕES DOS VEÍCULOS (luzes e rotores) ---------- */
PC.animados.push((t,dt)=>{
  for(const h of PC.helis){
    h.userData.helice[0].rotation.y+=dt*28;
    h.userData.helice[1].rotation.x+=dt*40;
  }
  for(const v of PC.veiculos){
    const L=v.userData.luzes;
    if(!L||!L.length) continue;
    const a=Math.sin(t*9)>0;
    L[0].emissiveIntensity=a?2.4:0.1;
    L[1].emissiveIntensity=a?0.1:2.4;
  }
});

})();
