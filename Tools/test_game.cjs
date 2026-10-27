/* Controles reais no Chromium: joystick, multitouch, gamepad, câmera e landscape. */
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../app/src/main/assets');
const server=http.createServer((req,res)=>{
 const file=path.join(base,decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(base+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':file.endsWith('.mp3')?'audio/mpeg':file.endsWith('.css')?'text/css':'text/html');res.end(data);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{window.testPad=null;Object.defineProperty(navigator,'getGamepads',{value:()=>window.testPad?[window.testPad]:[]});const old=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(){const source=old.call(this);source.playbackRate.value=30;return source;};});
  await page.goto(`http://127.0.0.1:${server.address().port}/game/index.html`);await page.waitForFunction(()=>window.game);
  const read=()=>page.evaluate(()=>game.inspect());
  await page.waitForTimeout(120);const start=await read();
  // Dois dedos simultâneos: joystick com um, pulo com o outro.
  const touch=await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:10,x:175,y:705}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:10,x:260,y:705}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:10,x:260,y:705},{id:11,x:1300,y:750}]});
  await page.waitForTimeout(700);
  let s=await read();assert.ok(s.player.x>start.player.x+80,'Joystick move o personagem enquanto outro botão é usado');
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.mouse.click(1300,500);assert.equal((await read()).player.vehicle,true);
  await page.mouse.click(1300,750);assert.ok((await read()).player.turbo>0);
  await page.waitForTimeout(150);const position=(await read()).player;
  await page.mouse.click(1150,625);await page.waitForTimeout(60);assert.equal((await read()).modal,'select');
  await page.mouse.click(910,465);await page.waitForTimeout(100);s=await read();assert.equal(s.player.pup,2);assert.equal(s.modal,null);assert.ok(Math.hypot(s.player.x-position.x,s.player.y-position.y)<30,'Troca preserva posição');
  // Gamepad externo usa o mesmo motor de movimento e detecta borda dos botões.
  await page.evaluate(()=>{window.testPad={connected:true,axes:[0,1],buttons:Array.from({length:16},()=>({pressed:false}))};});
  const before=await read();await page.waitForTimeout(650);s=await read();assert.ok(s.player.y>before.player.y+70,'Analógico Bluetooth movimenta');
  await page.evaluate(()=>{window.testPad.axes=[0,0];window.testPad.buttons[2].pressed=true;});await page.waitForTimeout(100);assert.equal((await read()).player.vehicle,true);
  await page.evaluate(()=>{window.testPad=null;});
  await page.mouse.click(720,67);await page.waitForTimeout(100);
  const out=process.env.SCREENSHOT_DIR;
  if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'exploracao.png')});}
  await page.setViewportSize({width:700,height:1000});await page.waitForTimeout(100);assert.equal(await page.locator('#rotate').isVisible(),true);
  await page.setViewportSize({width:1600,height:900});await page.waitForTimeout(100);assert.equal(await page.locator('#rotate').isVisible(),false);
  assert.deepEqual(errors,[]);
  console.log('Joystick, dois dedos, veículos, gamepad Bluetooth, troca em posição e aviso landscape aprovados.');
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
