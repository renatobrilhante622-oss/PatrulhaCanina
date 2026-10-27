/* Save versionado e tolerante a armazenamento indisponível/JSON corrompido. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ConsoleSave=factory();})(globalThis,()=>{
const KEY='patrulha.console.v5';
const defaults=()=>({version:5,missions:Array(12).fill(0),cookies:0,bones:0,starTotal:0,stickers:[],active:null,options:{voice:.9,music:.32,sfx:.6,joystick:1,quality:'balanced',fps:60}});
class Store{
 constructor(storage){this.storage=storage;this.persistent=true;this.data=defaults();try{const raw=storage.getItem(KEY);if(raw)this.restore(JSON.parse(raw));}catch(e){this.persistent=false;}}
 restore(raw){if(!raw||typeof raw!=='object')return;const d=this.data;const integer=(n,max=999999)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
 if(Array.isArray(raw.missions))d.missions=d.missions.map((_,i)=>integer(raw.missions[i],3));d.cookies=integer(raw.cookies);d.bones=integer(raw.bones);d.starTotal=integer(raw.starTotal);
 if(Array.isArray(raw.stickers))d.stickers=[...new Set(raw.stickers.filter(n=>Number.isInteger(n)&&n>=1&&n<=12))];
 if(raw.active&&Number.isInteger(raw.active.id)&&raw.active.id>=1&&raw.active.id<=12)d.active={id:raw.active.id,index:integer(raw.active.index,100),carry:typeof raw.active.carry==='string'?raw.active.carry:null};
 if(raw.options){for(const k of ['voice','music','sfx'])if(Number.isFinite(raw.options[k]))d.options[k]=Math.max(0,Math.min(1,raw.options[k]));if(Number.isFinite(raw.options.joystick))d.options.joystick=Math.max(.8,Math.min(1.5,raw.options.joystick));if(['low','balanced','high'].includes(raw.options.quality))d.options.quality=raw.options.quality;if([30,60].includes(raw.options.fps))d.options.fps=raw.options.fps;}}
 write(){try{this.storage.setItem(KEY,JSON.stringify(this.data));this.persistent=true;}catch(e){this.persistent=false;}return this.persistent;}
 options(patch){Object.assign(this.data.options,patch);this.write();}
 complete(id){const first=this.data.missions[id-1]===0;this.data.missions[id-1]=3;this.data.cookies+=first?3:1;if(!this.data.stickers.includes(id))this.data.stickers.push(id);this.data.active=null;this.write();}
 feed(){if(this.data.cookies<1)return false;this.data.cookies--;this.write();return true;}
}
return {Store,KEY,defaults};
});
