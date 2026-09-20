const {setup,assert}=require('./helpers.cjs');
(async()=>{const g=await setup();const{page,state,run,poi,enter,board,stopAt,exit,close}=g;
 async function localQuest(){const st=(await state()).station;await poi('quest');await page.locator('[data-do="acceptErrand"]').click();await poi('discovery');await poi('landmark');assert((await state()).profile.errands.length>0);await close();await page.screenshot({path:`artifacts/v2-station-${st}.png`});console.log('LOCAL TASK PASS',st);}
 async function stampAndExit(){await poi('stairs');await poi('gate');if((await state()).paid){await page.locator('[data-do="chargeInside"]').click();await poi('gate');}await poi('stamp');await poi('outside');}
 async function paidBoard(dir){await poi('station');if((await state()).profile.ic<80)await poi('charge');await poi('gate');await poi(dir===1?'p1':'p2');await board();}
 await poi('leave');await enter(1);await board();await stopAt(10);await stampAndExit();await localQuest();await paidBoard(1);await stopAt(11);await run(20000);assert.equal((await state()).scene,'platform');await stampAndExit();await localQuest();
 await paidBoard(-1);for(let st=6;st>=0;st--){await stopAt(st);await stampAndExit();await localQuest();if(st>0)await paidBoard(-1);}
 assert.equal((await state()).profile.errands.length,9);assert.equal((await state()).profile.stamps.length,9);console.log('ALL NINE NEW SMALL REGIONS, QUESTS AND STAMPS PASS');await g.finish();})().catch(e=>{console.error(e);process.exit(1)});
