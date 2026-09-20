const {chromium}=require('/Users/ri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
async function setup(mobile=false){
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},hasTouch:mobile});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.addInitScript(()=>{window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),50);});
 await page.goto('file:///Users/ri/Desktop/dianche/index.html');await page.locator('#start').click();await page.clock.runFor(100);
 const state=()=>page.evaluate(()=>gameDebug.state),run=ms=>page.clock.runFor(ms);
 async function close(){if((await state()).modal)await page.locator('#closeModal').click();}
 async function walk(id){await close();await page.locator('#mapBtn').click();await page.locator(`[data-walk="${id}"]`).click();for(let i=0;i<60;i++){await run(500);if(!(await state()).pathLength)break;}const st=await state();assert.equal(st.near,id,`can't reach ${id}: ${JSON.stringify(st)}`);}
 async function act(){await page.keyboard.press('e');await run(100);}
 async function poi(id){await walk(id);await act();await run(1100);}
 async function enter(dir){await poi('station');await poi('gate');assert.equal((await state()).paid,true);await poi(dir===1?'p1':'p2');}
 async function board(kind='normal'){await walk('train');for(let i=0;i<(kind!=="normal"?900:450);i++){const label=await page.locator('#actionLabel').innerText();if((await page.locator('#action').isEnabled())&&label.includes('に乗る')&&(kind==='normal'?!/特急|ライナー/.test(label):label.includes(kind))){await act();assert.equal((await state()).scene,'train');return;}await run(500);}throw new Error('No train '+kind);}
 async function stopAt(st,doAlight=true){for(let i=0;i<1600;i++){const s=await state();if(s.train?.station===st&&s.train?.door){if(doAlight){await walk('carDoor');if((await state()).train?.station!==st)throw new Error('missed while walking');await act();assert.equal((await state()).scene,'platform');assert.equal((await state()).station,st);}return;}await run(500);}throw new Error('Never arrived '+st);}
 async function exit(){await poi('stairs');await poi('gate');assert.equal((await state()).paid,false);await poi('outside');assert.equal((await state()).scene,'town');}
 async function finish(){assert.deepEqual(errors,[]);await browser.close();}
 return{page,browser,state,run,close,walk,act,poi,enter,board,stopAt,exit,finish,errors};
}
module.exports={setup,assert};
