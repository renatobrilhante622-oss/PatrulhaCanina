const fs=require('node:fs'),path=require('node:path');
const {MISSIONS}=require('../app/src/main/assets/game/campaign.js');
const out=path.resolve(__dirname,'../app/src/main/assets/game/campaign-catalog.json');
fs.writeFileSync(out,JSON.stringify(MISSIONS,null,2)+'\n');console.log('12 missões exportadas; '+MISSIONS.reduce((n,m)=>n+m.steps.length,0)+' objetivos educativos.');
