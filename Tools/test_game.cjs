/* Teste funcional de ponta a ponta: cliques e arrastes reais, sem pular estados do jogo. */
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../app/src/main/assets/game');
const server=http.createServer((req,res)=>{
 const file=path.join(base,decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(base+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':file.endsWith('.wav')?'audio/wav':file.endsWith('.css')?'text/css':'text/html');res.end(data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  // Decodifica WAVs reais, mas acelera a reprodução para a suíte não durar muitos minutos.
  await page.addInitScript(()=>{
   const original=AudioContext.prototype.createBufferSource;
   AudioContext.prototype.createBufferSource=function(){const s=original.call(this);s.playbackRate.value=40;return s;};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.waitForFunction(()=>window.game);
  const read=()=>page.evaluate(()=>game.inspect());
  const click=async(x,y)=>{await page.mouse.click(x,y);await page.waitForTimeout(35);};
  const ready=async()=>{await page.waitForFunction(()=>!game.inspect().busy,{},{timeout:20000});await page.waitForTimeout(40);};
  const drag=async(item,target)=>{await page.mouse.move(item.x,item.y);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:8});await page.mouse.up();await ready();};
  const out=process.env.SCREENSHOT_DIR;
  if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'hub.png')});}
  for(const pup of [2,1,4,3,5,6]){
   await click(140+pup*220,790);assert.equal((await read()).phase,'call');
   await click(800,770);await ready();let s=await read();assert.equal(s.phase,'mission');
   if(out)await page.screenshot({path:path.join(out,`missao-${pup}.png`)});
   // Repetir instrução continua acessível durante qualquer missão.
   await click(1450,70);
   if(pup===2){
    await click(s.items[4].x,s.items[4].y);assert.equal((await read()).progress,0,'Chama errada não avança');
    for(let i=0;i<5;i++){s=await read();await click(s.items[i].x,s.items[i].y);await ready();}
   }
   if(pup===1){
    await drag(s.items[0],s.targets[1]);assert.equal((await read()).progress,0,'Sombra incorreta não avança');
    for(let i=0;i<4;i++){s=await read();await drag(s.items[i],s.targets.find(t=>t.type===s.items[i].type));}
   }
   if(pup===4){
    for(let i=0;i<6;i++){s=await read();await drag(s.items[i],s.targets.find(t=>t.type===s.items[i].type));}
    s=await read();assert.equal(s.stage,1,'Conserto faz parte da missão');await drag(s.items[0],s.targets[0]);
   }
   if(pup===3){for(let i=0;i<5;i++){s=await read();await click(s.items[i].x,s.items[i].y);await ready();}}
   if(pup===5){
    await drag(s.items[3],s.targets[0]);assert.equal((await read()).progress,0,'Bloco menor não avança antes do maior');
    for(let i=0;i<4;i++){s=await read();await drag(s.items[i],s.targets[0]);}
    s=await read();assert.equal(s.stage,1,'Contagem faz parte da missão');
    for(let i=0;i<5;i++){s=await read();await click(s.items[i].x,s.items[i].y);await ready();}
   }
   if(pup===6){
    s=await read();const a=s.items[0],b=s.items.find(c=>c.id!==a.id);
    await click(a.x,a.y);await click(b.x,b.y);await ready();assert.equal((await read()).progress,0);
    for(let id=0;id<3;id++){s=await read();for(const item of s.items.filter(c=>c.id===id))await click(item.x,item.y);await ready();}
   }
   s=await read();assert.equal(s.phase,'reward',`Missão ${pup} terminou sem Game Over`);
   await click(800,690);assert.equal((await read()).reward,true,'Biscoito recebido');
   await click(1220,745);assert.equal((await read()).phase,'hub');
   console.log(`Missão ${pup}: instrução, jogo, recompensa e retorno ao Farol aprovados.`);
  }
  // Prova de offline: todo pedido a origens externas é bloqueado durante uma missão.
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
  await click(580,790);await click(800,770);await ready();assert.equal((await read()).pup,2);
  assert.deepEqual(errors,[],'Nenhum erro JS durante as seis missões');
  console.log('Seis missões completas, erros gentis e modo offline aprovados no Chromium.');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
