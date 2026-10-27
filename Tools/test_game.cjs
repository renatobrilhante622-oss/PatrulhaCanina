/* WebGL real via Chromium/SwiftShader em CI, sem falsificar renderer ou câmera. */
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../app/src/main/assets');
const server=http.createServer((req,res)=>{const file=path.join(base,decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(base+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':file.endsWith('.mp3')?'audio/mpeg':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{const old=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(){const source=old.call(this);source.playbackRate.value=30;return source;};});
  await page.goto(`http://127.0.0.1:${server.address().port}/game/index.html`);await page.waitForFunction(()=>window.game&&game.inspect().frames>3,{},{timeout:45000});
  const read=()=>page.evaluate(()=>game.inspect());let s=await read();assert.match(s.renderer,/WebGL/);assert.equal(s.characters,8);assert.equal(s.areas.length,4);assert.ok(s.triangles>10000);assert.equal(await page.locator('#webgl-error').isVisible(),false);
  // Analógico verdadeiro usando o mouse de testes; a mesma entrada é PointerEvent touch no aparelho.
  const joy=await page.locator('#joystick').boundingBox();const sx=joy.x+joy.width/2,sy=joy.y+joy.height/2,start=s.player;
  await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx+joy.width*.35,sy);
  await page.waitForFunction(p=>Math.hypot(game.inspect().player.x-p.x,game.inspect().player.z-p.z)>1,start,{timeout:20000});await page.mouse.up();
  await page.locator('#vehicle').click();assert.equal((await read()).player.vehicle,true);
  await page.locator('#jump').click();assert.ok((await read()).player.turbo>0);
  await page.locator('#friends').click();for(const name of ['Chase','Marshall','Skye','Rocky','Rubble','Zuma','Tracker','Everest'])assert.equal(await page.getByRole('button',{name,exact:true}).count(),1);
  await page.getByRole('button',{name:'Tracker',exact:true}).click();assert.equal((await read()).player.pup,7);
  await page.locator('#areas').click();await page.getByRole('button',{name:'Selva do Tracker',exact:true}).click();s=await read();assert.equal(s.player.x,-125);assert.equal(s.player.z,-84);
  const capture=process.env.SCREENSHOT_DIR;if(capture)fs.mkdirSync(capture,{recursive:true});
  for(const [name,file]of [['Selva do Tracker','selva'],['Grand Prix','pista'],['Estádio da Baía','futebol'],['Farol e cidade','farol']]){
   await page.locator('#areas').click();await page.getByRole('button',{name,exact:true}).click();const frames=(await read()).frames;await page.waitForFunction(f=>game.inspect().frames>f+12,frames,{timeout:30000});if(capture)await page.screenshot({path:path.join(capture,file+'.png')});
  }
  // Arraste na metade direita livre da interface realmente gira a câmera.
  const yaw=(await read()).camera.yaw;await page.mouse.move(1000,230);await page.mouse.down();await page.mouse.move(1100,240,{steps:4});await page.mouse.up();assert.ok(Math.abs((await read()).camera.yaw-yaw)>.1);
  await page.locator('#pup-pad').click();await page.setViewportSize({width:600,height:900});await page.locator('#rotate').waitFor({state:'visible',timeout:15000});assert.equal(await page.locator('#rotate').isVisible(),true);
  assert.deepEqual(errors,[]);console.log('WebGL real: oito filhotes, malhas 3D, quatro áreas, analógico, veículo, turbo, câmera orbital, teleporte e paisagem aprovados.');
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
