/* Campanha adicionada por composição: a exploração/física da v4 permanece intacta. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AdventureCampaign=factory();})(globalThis,()=>{
const missions=[];
function mission(id,title,pup,area,lesson,icon,brief,steps){missions.push({id,title,pup,area,lesson,icon,brief,steps});}
const step=(kind,x,z,text,extra={})=>({kind,x,z,text,...extra});
mission(1,'Incêndio na Prefeitura',2,'cidade','Números 1 a 10','🚒','Marshall, precisamos de água na Prefeitura! Vamos apagar dez chamas na ordem dos números. Sem pressa.',Array.from({length:10},(_,i)=>step('fire',-22+i%5*11,-35-Math.floor(i/5)*13,`Use o jato de água na chama número ${i+1}.`,{number:i+1})));
const traffic=[];['circle','square','triangle','star'].forEach((shape,i)=>{const name=['círculo','quadrado','triângulo','estrela'][i];traffic.push(step('takeShape',-55+i*9,7,`Pegue o cone em forma de ${name}.`,{shape}),step('placeShape',-55+i*9,23,`Leve a forma de ${name} até a sombra igual e use a mochila.`,{shape}));});
['red','yellow','green'].forEach((color,i)=>traffic.push(step('traffic',-22+i*9,52,['Vermelho: pare com calma e use a mochila no semáforo vermelho.','Amarelo: atenção! Observe e use a mochila no amarelo.','Verde: siga! Use a mochila no verde.'][i],{color})));
mission(2,'Trânsito Seguro',1,'cidade','Cores e formas','🚓','Chase, vamos organizar quatro formas e aprender as três cores do semáforo!',traffic);
mission(3,'Vogais no Céu e Galinheta',3,'cidade','Vogais e cuidado','🚁','Skye, vamos voar pelos anéis A, E, I, O, U. Depois vamos ajudar a Galinheta no telhado.',[...[...'AEIOU'].map((letter,i)=>step('hoop',28+i*8,-63,`Passe voando pelo anel com a vogal ${letter}.`,{letter,mode:'fly',y:10})),step('chicken',20,-17,'Chegue voando perto da Galinheta no telhado e use a mochila.',{y:10,vehicle:true})]);
const recycle=[];['papel','plastico','metal','vidro'].forEach((material,i)=>{const color=['azul','vermelha','amarela','verde'][i];recycle.push(step('takeWaste',-150+i*8,62,`Pegue ${['o papel','o plástico','o metal','o vidro'][i]} na praia.`,{material}),step('recycleBin',-150+i*8,82,`Leve o material para a lixeira ${color}.`,{material,color}));});recycle.push(step('repair',-145,108,'Use a garra para colocar a tábua e consertar a ponte do píer.'));
mission(4,'Praia Limpa e Ponte',4,'praia','Reciclagem e cores','♻️','Rocky, vamos reciclar quatro materiais e depois consertar a ponte. Reutilizar é cuidar!',recycle);
const construction=Array.from({length:4},(_,i)=>step('rock',-100+i*8,123,`Retire a pedra número ${i+1}. Comece pela maior e vamos contar juntos.`,{number:i+1,size:1.5-i*.23}));
['grande','médio','pequeno'].forEach((size,i)=>construction.push(step('takeBlock',-106+i*10,144,`Pegue o bloco ${size}.`,{size:1.5-i*.4,token:size}),step('stack',-78,150,`Coloque o bloco ${size} na pilha.`,{size:1.5-i*.4,token:size,level:i})));
mission(5,'Obra na Fazenda da Yumi',5,'fazenda','Tamanhos e quantidades','🚜','Rubble, vamos contar quatro pedras e empilhar blocos: grande embaixo, médio e pequeno em cima.',construction);
mission(6,'Tartarugas no Píer',6,'praia','Soma e vida marinha','🐢','Zuma, vamos navegar até as tartaruguinhas. Primeiro uma, depois duas: uma mais duas são três!',[step('turtles',-166,51,'Use o hovercraft para ajudar uma tartaruguinha. Uma!',{quantity:1,vehicle:true}),step('turtles',-170,76,'Agora ajude duas tartaruguinhas. Uma mais duas são três!',{quantity:2,vehicle:true}),step('turtles',-164,99,'Mais três tartaruguinhas! Três mais três são seis animais ajudados.',{quantity:3,vehicle:true})]);
mission(7,'Mistério dos Sons e Cores',7,'selva','Animais, sons e cores','🐒',[ 'Tracker, siga cinco pegadas, encontre os animais pelos sons e abra o portão com as três cores.' ].join(''),[...Array.from({length:5},(_,i)=>step('paw',-144+i*8,-72-i*6,`Siga a pegada brilhante número ${i+1}.`,{mode:'walk',number:i+1})),...['monkey','toucan','frog'].map((animal,i)=>step('jungleAnimal',-150+i*24,-123,['Ouça: u-u, a-a! Procure o macaquinho e use a mochila.','Ouça o chamado da ave. Procure o tucano do bico amarelo.','Coax, coax! Encontre o sapinho verde.'][i],{animal})),...['red','green','blue'].map((color,i)=>step('colorGate',-115+i*6,-145,`Use o painel ${['vermelho','verde','azul'][i]} para abrir o portão das cores.`,{color}))]);
mission(8,'Pista de Neve do Jake',8,'neve','Sequências e números','❄️','Everest, vamos limpar a pista de um a cinco e ajudar dois pinguins a voltar para casa.',[...Array.from({length:5},(_,i)=>step('snow',-95+i*9,-153,`Limpe a placa número ${i+1} com o limpa-neve.`,{number:i+1,vehicle:true})),step('penguin',-80,-169,'Ajude o primeiro pinguim com a mochila.'),step('penguin',-66,-169,'Agora ajude o segundo pinguim. Dois amigos ajudados!')]);
mission(9,'Banho no Pet Shop da Katie',2,'petshop','Higiene e rotina','🛁','Katie precisa de ajuda para um banho tranquilo. Primeiro espuma, depois enxaguar, secar e escovar.',[['foam','Vamos cobrir a lama com espuma macia. Use a mochila perto da banheira.'],['rinse','Agora vamos enxaguar. Use o chuveirinho para tirar toda a espuma.'],['dry','Hora de secar com um ventinho suave. Use o secador.'],['brush','Por último, escove com carinho. A rotina ficou completa!']].map(([kind,text])=>step(kind,-48,72,text,{anyPup:true})));
const harvest=[];[['apple','vermelha',2],['banana','amarela',3],['grape','roxa',2]].forEach(([fruit,color,total],i)=>{for(let n=1;n<=total;n++)harvest.push(step('fruit',-112+i*12,96,`Colha ${['uma maçã vermelha','uma banana amarela','uma uva roxa'][i]}.`,{fruit,color,quantity:n}),step('basket',-88+i*10,108,`Leve para a cesta ${color}. Vamos contar: ${n} de ${total}.`,{fruit,color,quantity:n,total}));});
mission(10,'Colheita no Pomar da Yumi',4,'fazenda','Cores e quantidades','🍎','Yumi vai colher duas maçãs vermelhas, três bananas amarelas e duas uvas roxas. Vamos levar para as cestas certas!',harvest);
mission(11,'Copa Canina',6,'futebol','Gols, cores e números','⚽','Vamos marcar três gols com calma. A cor e o número aparecem na trave. O goleiro está aqui para brincar com você.',['red','blue','yellow'].map((color,i)=>step('goal',35,i%2===0?92:158,`Faça o gol número ${i+1} na trave ${['vermelha','azul','amarela'][i]}.`,{number:i+1,color,end:i%2===0?'north':'south',mode:'goal',anyPup:true})));
mission(12,'Grande Corrida da Baía',1,'pista','Cores e formas','🏆','Escolha seu veículo! Vamos passar por oito portões educativos, sem cronômetro, e receber o troféu dourado.',[...Array.from({length:8},(_,i)=>step('raceGate',120+Math.sin(i*Math.PI/4)*36,-85+Math.cos(i*Math.PI/4)*27,`Dirija pelo portão ${['azul','vermelho','amarelo','verde'][i%4]} com ${['círculo','quadrado','triângulo','estrela'][i%4]}.`,{mode:'drive',shape:['circle','square','triangle','star'][i%4],color:['blue','red','yellow','green'][i%4],anyPup:true})),step('trophy',120,-85,'Parabéns! Chegue ao pódio e use a mochila para receber o troféu.',{anyPup:true})]);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
class Campaign{
 constructor(world,save){this.world=world;this.save=save;this.active=false;this.phase='idle';this.index=0;this.mission=null;this.carry=null;this.elapsed=0;this.hintAfter=0;}
 start(id,resume=false){const def=missions.find(m=>m.id===id);if(!def)return;this.stop();this.active=true;this.mission=def;this.index=0;this.carry=null;
 const checkpoint=this.save.data.active;if(resume&&checkpoint&&checkpoint.id===id){this.index=Math.min(def.steps.length-1,checkpoint.index);this.carry=checkpoint.carry;}
 this.phase='call';this.world.player.pup=def.pup;this.world.emit('voice',{id:'Menu_call'});this.world.objects=this.world.objects.filter(o=>!o.mission);
 def.steps.forEach((s,i)=>this.world.objects.push({...s,id:'campaign-'+id+'-'+i,type:'campaign',mission:id,stepIndex:i,done:i<this.index}));
 this.world.emit('campaignObjects');this.checkpoint();this.world.emit('campaignUI');}
 stop(){this.active=false;this.phase='idle';this.world.objects=this.world.objects.filter(o=>!o.mission);this.world.emit('campaignObjects');}
 advanceRitual(){if(!this.active)return;if(this.phase==='call'){this.phase='briefing';this.world.emit('voice',{id:'Mission'+this.mission.id+'_brief'});}
 else if(this.phase==='briefing'){this.phase='departure';this.elapsed=0;Object.assign(this.world.player,{x:0,z:15,y:0,vy:0,vx:0,vz:0,vehicle:true,angle:0});this.world.emit('sfx',{id:'siren'});}
 this.world.emit('campaignUI');}
 target(){return this.active&&this.phase==='play'?this.world.objects.find(o=>o.mission===this.mission.id&&o.stepIndex===this.index):null;}
 instructionID(){return this.mission?'Mission'+this.mission.id+'_step'+this.index:'Menu_story';}
 checkpoint(){if(this.phase!=='reward'){this.save.data.active={id:this.mission.id,index:this.index,carry:this.carry};this.save.write();}}
 hint(){if(this.world.time<this.hintAfter)return;this.hintAfter=this.world.time+2;this.world.emit('voice',{id:this.target()&&!this.validPup(this.target())?'Mission'+this.mission.id+'_choose':this.instructionID()});}
 validPup(s){return !!s.anyPup||this.world.player.pup===this.mission.pup;}
 interact(){if(!this.active||this.phase!=='play')return this.active;const target=this.target();if(!target)return true;
 if(target.mode==='goal')return false;
 const near=this.world.objects.filter(o=>o.mission&&!o.done&&distance(o,this.world.player)<5.5).sort((a,b)=>distance(a,this.world.player)-distance(b,this.world.player));
 if(near[0]!==target||!this.validPup(target)){this.hint();return true;}
 if(target.vehicle&&!this.world.player.vehicle||target.kind==='chicken'&&this.world.player.y<6){this.hint();return true;}
 if(target.mode){this.hint();return true;}
 const taking={takeShape:'shape',takeWaste:'material',takeBlock:'token',fruit:'fruit'}[target.kind];
 if(taking){if(this.carry){this.hint();return true;}this.carry=target[taking];}
 const placing={placeShape:'shape',recycleBin:'material',stack:'token',basket:'fruit'}[target.kind];
 if(placing){if(this.carry!==target[placing]){this.hint();return true;}this.carry=null;}
 this.world.emit('tool',{pup:this.world.player.pup});if(['fire','foam','rinse'].includes(target.kind))this.world.emit('water',{x:target.x,z:target.z});
 this.world.emit('campaignVisual',{visual:target.kind,x:target.x,z:target.z});this.completeStep();return true;}
 completeStep(){const target=this.target();if(!target)return;target.done=true;this.world.stars++;this.world.emit('spark',{x:target.x,y:2,z:target.z});this.index++;
 if(this.index>=this.mission.steps.length){this.phase='reward';this.save.complete(this.mission.id);this.world.emit('campaignReward',{id:this.mission.id});this.world.emit('voice',{id:'Menu_reward'});}
 else{this.checkpoint();this.world.emit('voice',{id:this.instructionID()});}
 this.world.emit('campaignUI');}
 onWorldEvent(kind,data){if(!this.active||this.phase!=='play')return;if(kind==='goal'&&this.target()?.mode==='goal'){
 if(data.end===this.target().end)this.completeStep();else this.hint();}}
 update(dt){if(!this.active)return;if(this.phase==='departure'){this.elapsed+=dt;this.world.player.z+=dt*3;this.world.player.vz=3;
 if(this.elapsed>=2.5){this.phase='play';if(this.mission.id===11)this.world.emit('voice',{id:'Ryder_football'});this.world.emit('voice',{id:this.instructionID()});this.world.emit('campaignUI');}return;}
 const target=this.target();if(!target)return;const p=this.world.player;
 if(distance(target,p)<2.8&&this.validPup(target)&&((target.mode==='walk')||(target.mode==='drive'&&p.vehicle)||(target.mode==='fly'&&p.vehicle&&p.y>7)))this.completeStep();}
 route(){let target=this.target();if(!target)return [];const start=this.world.player;if(target.mode==='goal'&&distance(start,this.world.ball)>4.5)target=this.world.ball;if(start.vehicle&&start.pup===3)return [{x:target.x,z:target.z}];const points=[];let a={x:start.x,z:start.z};const used=new Set();
 for(let i=0;i<6;i++){const dx=target.x-a.x,dz=target.z-a.z,length=dx*dx+dz*dz;if(length<1)break;const obstacle=this.world.obstacles.find(o=>{if(used.has(o))return false;const t=((o.x-a.x)*dx+(o.z-a.z)*dz)/length;if(t<.02||t>.95)return false;return Math.hypot(a.x+dx*t-o.x,a.z+dz*t-o.z)<o.r+2;});if(!obstacle)break;used.add(obstacle);const l=Math.sqrt(length),r=obstacle.r+4;const candidates=[1,-1].map(side=>({x:obstacle.x-dz/l*r*side,z:obstacle.z+dx/l*r*side}));candidates.sort((p,q)=>(distance(a,p)+distance(p,target))-(distance(a,q)+distance(q,target)));a=candidates[0];points.push(a);}
 points.push({x:target.x,z:target.z});return points;}
 inspect(){return {active:this.active,phase:this.phase,id:this.mission?.id||null,index:this.index,carry:this.carry,target:this.target()?{...this.target()}:null};}
}
return {Campaign,MISSIONS:missions};
});
