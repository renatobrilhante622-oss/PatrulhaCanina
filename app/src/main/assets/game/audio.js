/* Jogo local: nenhuma biblioteca, imagem, fonte ou serviço remoto. */
'use strict';
(() => {
const canvas=document.getElementById('game');
const caption=document.getElementById('caption');
const W=1600,H=900;
const names=['Ryder','Chase','Marshall','Skye','Rocky','Rubble','Zuma','Tracker','Everest'];
const colors=['#bc3544','#275ca8','#d84b3c','#bd4888','#348454','#d6a31d','#df752d','#698559','#61b5bc'];
const missions=['Farol','Formas e trânsito','Cores e números','Vogais voando','Praia e reciclagem','Blocos e pedrinhas','Memória no mar'];
const shapes=['circle','square','triangle','star'];
let catalog={};
const catalogReady=fetch('catalog.json').then(r=>{if(!r.ok)throw Error('Catálogo');return r.json();}).then(data=>{for(const entry of data.entries)catalog[entry.id]=entry;}).catch(()=>{});

class AudioGuide {
 constructor(){this.context=null;this.cache=new Map();this.tail=Promise.resolve();this.epoch=0;this.last='Ryder_instruction';this.muted=false;this.active=null;this.pendingRepeat=false;this.speaking=false;this.volumes={voice:.9,music:.32,sfx:.6};}
 unlock(){
  if(!this.context){
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
   this.context=new AC();this.master=this.context.createGain();this.master.connect(this.context.destination);
   this.voiceBus=this.context.createGain();this.voiceBus.gain.value=this.volumes.voice;this.voiceBus.connect(this.master);
   this.effectsBus=this.context.createGain();this.effectsBus.gain.value=this.volumes.sfx;this.effectsBus.connect(this.master);
   this.music=this.context.createGain();this.music.gain.value=this.volumes.music;this.music.connect(this.master);
   this.load('sfx_music').then(buffer=>{const music=this.context.createBufferSource();music.buffer=buffer;music.loop=true;music.connect(this.music);music.start();}).catch(()=>{});
  }
  if(this.context.state==='suspended')this.context.resume().catch(()=>{});
 }
 async load(id){
  if(this.cache.has(id))return this.cache.get(id);
  const task=fetch('/audio/'+id+'.mp3').then(r=>{if(!r.ok)throw Error('MP3 neural ausente');return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b));
  this.cache.set(id,task);try{return await task;}catch(e){this.cache.delete(id);throw e;}
 }
 say(id,remember=false){
  if(remember)this.last=id;
  const epoch=this.epoch;
  const operation=async()=>{
   await catalogReady;if(epoch!==this.epoch)return;
   const entry=catalog[id];caption.textContent=entry?entry.text:'Vamos tentar juntos, com calma!';
   caption.style.borderLeftColor=colors[Math.max(0,names.indexOf(entry ? entry.speaker : ''))];
   if(!this.context)return;
   this.speaking=true;this.music.gain.setTargetAtTime(this.volumes.music*.14,this.context.currentTime,.18);
   try{
    let buffer;try{buffer=await this.load(id);}catch(e){return;}
    if(epoch!==this.epoch)return;
    await new Promise(resolve=>{const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.voiceBus);source.onended=resolve;this.active=source;source.start();});
   }finally{if(epoch===this.epoch){this.active=null;this.speaking=false;this.music.gain.setTargetAtTime(this.volumes.music,this.context.currentTime,.3);}}
  };
  this.tail=this.tail.catch(()=>{}).then(operation);return this.tail;
 }
 repeat(){if(this.pendingRepeat)return;this.pendingRepeat=true;this.say(this.last).finally(()=>{this.pendingRepeat=false;});}
 cancel(){this.epoch++;if(this.active){try{this.active.stop();}catch(e){}this.active=null;}this.tail=Promise.resolve();this.speaking=false;this.pendingRepeat=false;if(this.music)this.music.gain.setTargetAtTime(this.volumes.music,this.context.currentTime,.2);}
 mute(){this.muted=!this.muted;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:1,this.context.currentTime,.08);}
 setVolumes(options){for(const key of ['voice','music','sfx'])if(Number.isFinite(options[key]))this.volumes[key]=Math.max(0,Math.min(1,options[key]));if(this.context){this.voiceBus.gain.setTargetAtTime(this.volumes.voice,this.context.currentTime,.08);this.effectsBus.gain.setTargetAtTime(this.volumes.sfx,this.context.currentTime,.08);this.music.gain.setTargetAtTime(this.volumes.music*(this.speaking?.14:1),this.context.currentTime,.15);}}
 effect(type){
  if(!this.context)return;
  const mapped={happy:'bark',gentle:'collect',turbo:'engine',eat:'bark'}[type]||type;
  this.load('sfx_'+mapped).then(buffer=>{const source=this.context.createBufferSource();const gain=this.context.createGain();gain.gain.value=.6;source.buffer=buffer;source.connect(gain);gain.connect(this.effectsBus);source.start();}).catch(()=>{});
 }
 setEngine(active,speed){
  this.engineWanted=active;
  if(!active){if(this.engineSource){this.engineSource.stop();this.engineSource=null;}return;}
  if(!this.context)return;
  if(this.engineSource){this.engineSource.playbackRate.setTargetAtTime(.7+Math.min(1,speed/20),this.context.currentTime,.2);return;}
  if(this.loadingEngine)return;this.loadingEngine=true;
  this.load('sfx_engine').then(buffer=>{if(!this.engineWanted)return;const source=this.context.createBufferSource(),gain=this.context.createGain();gain.gain.value=.22;source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.effectsBus);source.start();this.engineSource=source;}).catch(()=>{}).finally(()=>this.loadingEngine=false);
 }

}

window.AdventureAudio=AudioGuide;
})();
