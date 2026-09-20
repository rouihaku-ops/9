(() => {
'use strict';
const D=RAIL_DATA, $=id=>document.getElementById(id), canvas=$('world'), ctx=canvas.getContext('2d');
const W=1200,H=800, SAVE='tokyo-little-rail-v1';
const fresh=()=>({ic:300,coins:800,toys:{},stamps:[],visited:['hori'],types:[],models:[],rides:0,completed:0,child:true,sound:true,free:false});
let profile=fresh();
try{const s=JSON.parse(localStorage.getItem(SAVE));if(s&&s.version===1) profile={...profile,...s.profile};}catch(e){}
let scene='home',station=1,direction=1,player={x:580,y:480},target=null,path=[],keys={},started=false;
let time=0,last=0,near=null,step=0,paid=false,entry=null,onTrain=null,trainLast='',gateUntil=0,transition=null,modal=false;
let camera={x:0,y:0,scale:1},screen={w:1200,h:800},walkPhase=0,moving=false,toastUntil=0,free=profile.free;
let speech={ja:'いってらっしゃい。',kana:'いってらっしゃい。',zh:'路上小心。'},audio=null,foot=0,rolling=0,announced=new Set(),seenTrains=new Set();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), ease=t=>t*t*(3-2*t);
function save(){try{localStorage.setItem(SAVE,JSON.stringify({version:1,profile}));}catch(e){}}
function unlock(key,val){if(!profile[key].includes(val)){profile[key].push(val);save();}}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');toastUntil=time+5;}
function initAudio(){try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();}catch(e){}}
function tone(freq=880,duration=.12,type='sine',volume=.07,delay=0){if(!profile.sound||!audio)return;const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration+.03);}
function chime(){[659,784,1047].forEach((f,i)=>tone(f,.23,'sine',.035,i*.13));}
function say(ja,kana='',zh=''){speech={ja,kana:kana||ja,zh};$('subtitle').textContent=ja;$('translation').textContent=(kana||ja)+'　/　'+zh;$('translation').hidden=true;speak();}
function speak(){if(!profile.sound||!window.speechSynthesis)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(speech.ja);u.lang='ja-JP';u.rate=.86;u.volume=.7;const v=speechSynthesis.getVoices().find(v=>v.lang.startsWith('ja'));if(v)u.voice=v;speechSynthesis.speak(u);}catch(e){}}
function setStep(n){if(n>step){step=n;chime();}updateUI();}
function openModal(html){modal=true;keys={};path=[];target=null;$('modalContent').innerHTML=html;$('modal').hidden=false;$('closeModal').focus();}
function closeModal(){modal=false;$('modal').hidden=true;last=performance.now();}
function dialog(name,ja,kana,zh,extra=''){say(ja,kana,zh);openModal(`<div class="eyebrow">まちの会話 · TOWN STORIES</div><h2>${name}</h2><p style="font-size:20px;color:#315d50">${ja}</p><p>${kana}<br>${zh}</p>${extra}<div class="row"><button class="primary" data-do="close">ありがとう</button></div>`);}
function go(next,x,y){scene=next;player={x,y};path=[];target=null;near=null;keys={};updateUI();}
const outdoorH=[
 {id:'home',x:110,y:135,w:165,h:105,name:'わたしの家',sub:'MY LITTLE HOME',color:'#e8c79f',kind:'house'},
 {id:'school',x:470,y:100,w:230,h:105,name:'秋葉台小学校',sub:'あきばだいしょうがっこう',color:'#eddcb3',kind:'school'},
 {id:'post',x:130,y:365,w:185,h:87,name:'駅前郵便局',sub:'〒 八王子堀之内駅前',color:'#e5dfcf',kind:'post'},
 {id:'market',x:900,y:337,w:205,h:105,name:'三和スーパー',sub:'SANWA · 堀之内店',color:'#e5e5c9',kind:'shop'},
 {id:'station',x:450,y:510,w:330,h:105,name:'京王堀之内駅',sub:'KEIO-HORINOUCHI  KO42',color:'#d6e1d7',kind:'station'},
 {id:'mcd',x:935,y:575,w:165,h:90,name:'マクドナルド',sub:'ちょっと ひとやすみ',color:'#e9cead',kind:'mcd'}
];
const outdoorM=[
 {id:'station',x:455,y:155,w:330,h:110,name:'南大沢駅',sub:'MINAMI-OSAWA  KO43',color:'#e1dac7',kind:'station'},
 {id:'yoka',x:810,y:445,w:300,h:140,name:'イトーヨーカドー',sub:'南大沢店 · ガチャガチャ',color:'#e7ddc7',kind:'mall'},
 {id:'civic',x:95,y:480,w:265,h:135,name:'南大沢事務所',sub:'フレスコ南大沢 · 公共施設棟',color:'#ddd3bd',kind:'civic'}
];
function platformNumber(dir=direction){return dir===1?1:station===0?3:2;}
function pois(){
 if(scene==='home')return[{id:'leave',x:600,y:653,label:'外へ出る'},{id:'mom',x:820,y:375,label:'お母さんと話す'},{id:'album',x:370,y:340,label:'コレクションを見る'}];
 if(scene==='town'){
  const list=(station===1?outdoorH:outdoorM).map(b=>({id:b.id,x:b.x+b.w/2,y:b.y+b.h+25,label:b.id==='station'?'駅に入る':b.id==='home'?'おうちに帰る':b.id==='yoka'?'お店に入る':b.name+'へ'}));
  if(station===1)list.push({id:'park',x:970,y:239,label:'秋葉台公園で遊ぶ'},{id:'park2',x:235,y:666,label:'久兵衛坂公園へ'},{id:'friend',x:390,y:325,label:'友だちと話す'});
  else list.push({id:'fountain',x:590,y:455,label:'噴水でひとやすみ'},{id:'child',x:750,y:385,label:'子どもと話す'});
  return list;
 }
 if(scene==='concourse')return[{id:'gate',x:600,y:paid?321:457,label:paid?'ICタッチ · 出場':'ICタッチ · 入場'}, {id:'charge',x:860,y:480,label:'チャージ +300'},{id:'staff',x:340,y:450,label:'駅員さんに聞く'},{id:'stamp',x:170,y:510,label:'駅スタンプ'},{id:'outside',x:600,y:714,label:'駅の外へ'},{id:'p1',x:310,y:183,label:'1番線 · 橋本方面'},{id:'p2',x:890,y:183,label:platformNumber(-1)+'番線 · 調布・新宿方面'}];
 if(scene==='platform')return[{id:'stairs',x:170,y:630,label:'階段 · 改札へ'},{id:'board',x:920,y:440,label:'停車駅を確認'},{id:'train',x:600,y:450,label:'電車に乗る'}];
 if(scene==='shop')return[{id:'gacha',x:620,y:420,label:'ガチャを回す · 100コイン'},{id:'shopExit',x:600,y:675,label:'駅前へ出る'},{id:'clerk',x:260,y:395,label:'店員さんと話す'}];
 return [];
}
function obstacles(){
 if(scene==='town')return (station===1?outdoorH:outdoorM).map(b=>({x:b.x-8,y:b.y-18,w:b.w+26,h:b.h+27}));
 if(scene==='home')return[{x:240,y:200,w:180,h:100},{x:740,y:230,w:220,h:100},{x:480,y:350,w:140,h:90}];
 if(scene==='concourse')return[{x:0,y:362,w:1200,h:41}];
 if(scene==='shop')return[{x:360,y:190,w:560,h:172},{x:130,y:250,w:160,h:88}];
 return [];
}
function walkable(x,y){let bounds={x:50,y:70,w:1100,h:680};if(scene==='platform')bounds={x:55,y:425,w:1090,h:275};if(scene==='home'||scene==='shop')bounds={x:150,y:210,w:900,h:485};if(scene==='concourse')bounds={x:70,y:100,w:1060,h:630};if(x<bounds.x||x>bounds.x+bounds.w||y<bounds.y||y>bounds.y+bounds.h)return false;return !obstacles().some(o=>x>o.x-10&&x<o.x+o.w+10&&y>o.y-8&&y<o.y+o.h+10);}
function walkTo(x,y){if(!started||modal||scene==='train'||transition)return;const cell=20,cols=60,rows=40;
 let sx=Math.round(player.x/cell),sy=Math.round(player.y/cell),tx=clamp(Math.round(x/cell),3,57),ty=clamp(Math.round(y/cell),4,37);
 if(!walkable(tx*cell,ty*cell)){let best=null;for(let yy=-6;yy<=6;yy++)for(let xx=-6;xx<=6;xx++){let nx=tx+xx,ny=ty+yy;if(walkable(nx*cell,ny*cell)){let dd=Math.hypot(nx*cell-x,ny*cell-y);if(!best||dd<best.d)best={x:nx,y:ny,d:dd};}}if(!best)return;tx=best.x;ty=best.y;}
 const start=sy*cols+sx,end=ty*cols+tx,q=[start],prev=new Map([[start,-1]]);let found=false;
 for(let qi=0;qi<q.length;qi++){let cur=q[qi];if(cur===end){found=true;break;}let cx=cur%cols,cy=Math.floor(cur/cols);for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){let nx=cx+dx,ny=cy+dy,n=ny*cols+nx;if(nx<0||nx>=cols||ny<0||ny>=rows||prev.has(n)||!walkable(nx*cell,ny*cell))continue;prev.set(n,cur);q.push(n);}}
 if(found){path=[];for(let cur=end;cur!==start;cur=prev.get(cur))path.unshift({x:(cur%cols)*cell,y:Math.floor(cur/cols)*cell});target={x:tx*cell,y:ty*cell};}
}
// Each service is a real timed object with station calls, a direction and continuous position.
function makeTrain(k,dir){const service=D.services[((k%5)+5)%5],start=k*49+(dir===-1?23:0);const order=dir===1?[0,1,2]:[2,1,0];let t=start,calls=[];for(let i=0;i<order.length;i++){const st=order[i],stop=service.stops.includes(st);calls.push({station:st,arr:t,dep:t+(stop?14:0),stop});t+=(stop?14:0)+(service.id==='express'||service.id==='liner'?15:19);}return{id:`${k}:${dir}`,k,dir,service,calls,end:calls[2].dep+9};}
function trainState(tr,t=time){const calls=tr.calls;
 if(t<calls[0].arr)return{pos:calls[0].station-tr.dir*(calls[0].arr-t)/19,state:'approach',next:calls[0].station,door:false};
 for(let i=0;i<calls.length;i++){const c=calls[i];if(c.stop&&t>=c.arr&&t<c.dep)return{pos:c.station,station:c.station,next:c.station,state:t<c.arr+1.7?'braking':t>c.dep-2?'closing':'stopped',door:t>=c.arr+1.7&&t<=c.dep-2,remaining:c.dep-t};const next=calls[i+1];if(next&&t>=c.dep&&t<next.arr){const f=(t-c.dep)/(next.arr-c.dep);const passing=!c.stop||!next.stop;const globalF=(t-calls[0].dep)/(calls[2].arr-calls[0].dep);return{pos:passing?calls[0].station+(calls[2].station-calls[0].station)*ease(globalF):c.station+(next.station-c.station)*ease(f),next:next.stop?next.station:calls[i+2]?.station,state:'running',door:false};}}
 return{pos:calls[2].station+tr.dir*(t-calls[2].dep)/15,next:null,state:'leaving',door:false};
}
function trains(){const out=[];let k=Math.floor(time/49);for(let n=k-3;n<=k+3;n++)for(const dir of[1,-1])out.push(makeTrain(n,dir));return out;}
function platformTrains(){return trains().filter(t=>t.dir===direction).map(t=>({tr:t,s:trainState(t),call:t.calls.find(c=>c.station===station)}));}
function boardable(){return platformTrains().find(o=>o.call.stop&&o.s.station===station&&o.s.door);}
function departures(){return platformTrains().filter(o=>o.call.dep>time).sort((a,b)=>a.call.arr-b.call.arr).slice(0,3);}
function interact(id=near?.id){if(!started||modal||transition)return;initAudio();
 if(scene==='train'){alight();return;}
 if(!id)return;
 if(id==='leave'){go('town',193,280);setStep(1);say('いってきます。','いってきます。','我出门啦。');}
 else if(id==='home'){go('home',600,610);if(step===7&&!paid){profile.completed++;profile.coins+=200;save();setStep(8);chime();openModal(`<div class="reward"><div class="eyebrow">ADVENTURE COMPLETE</div><div class="capsule">🏡</div><h2>おかえりなさい！</h2><p>你独自完成了京王堀之内 ↔ 南大沢往返，<br>把电车收藏带回了家。</p><div class="legend">往返乘车 ✓　IC 刷卡 ✓　南大沢扭蛋 ✓<br>探险奖励 +200 コイン · 收藏已保存</div><div class="row"><button class="primary" data-do="again">再去一次</button><button data-do="book">看看收藏</button><button data-do="free">自由探索</button></div></div>`);say('おかえりなさい。楽しかった？','おかえりなさい。たのしかった？','欢迎回家，玩得开心吗？');}else dialog('おうち','おかえり。','おかえり。','欢迎回来。随时都可以再出门。');}
 else if(id==='station'){go('concourse',600,660);if(station===1&&step<3)setStep(2);say('きっぷと、ICカードをご用意ください。','きっぷと、あいしーかーどを ごよういください。','请准备车票或 IC 卡。');}
 else if(id==='outside'){if(paid){toast('先刷 IC 卡出站，再离开车站。');return;}if(station===0){toast('这次先探索两站生活圈。到另一侧站台坐回京王堀之内吧。');return;}const b=(station===1?outdoorH:outdoorM).find(b=>b.id==='station');go('town',b.x+b.w/2,b.y+b.h+35);}
 else if(id==='gate'){gate();}
 else if(id==='charge'){if(profile.coins<300){toast('零钱不足。向駅員领取旅行援助，再来充值。');return;}profile.coins-=300;profile.ic+=300;save();chime();toast(`チャージ完了！IC 残高 ${profile.ic} 円（游戏币）`);}
 else if(id==='p1'||id==='p2'){if(!paid){toast('先经过改札刷卡进站。');return;}direction=id==='p1'?1:-1;go('platform',170,620);if(station===1&&step===2)setStep(3);say('黄色い線の内側でお待ちください。','きいろいせんの うちがわで おまちください。','请在黄线内侧候车。');}
 else if(id==='stairs'){go('concourse',direction===1?310:890,215);}
 else if(id==='train'){
  const o=boardable();if(!o){toast('列车还没开门。在黄线内侧等一等吧。');return;}
  if((station===2&&direction===1)||(station===0&&direction===-1)){toast('这班将驶出本轮可玩区间。请从楼梯走到另一侧站台。');return;}
  if(o.tr.service.id==='liner'){unlock('types','liner');unlock('models','5000系');dialog('京王ライナー','この電車は、全席指定です。','このでんしゃは、ぜんせきしていです。','京王ライナー全席指定，京王堀之内不停。本轮可以观察、收集车辆图鉴，乘坐体验留待后续。');return;}
  onTrain=o.tr;trainLast='';unlock('types',onTrain.service.id);unlock('models',onTrain.service.model);profile.rides++;save();go('train',600,600);if(station===1&&direction===1&&step<5)setStep(4);tone(440,.2);say(`${onTrain.service.name}、${direction===1?'橋本':'新宿'}行きです。`,`${onTrain.service.name}、${direction===1?'はしもと':'しんじゅく'}ゆきです。`,direction===1?'开往桥本方向。':'开往新宿方向。');
  if(station===2&&onTrain.service.id==='express')toast('あれ？特急不停京王堀之内。到京王多摩センター换对面各停回来就好。');
 }
 else if(id==='board')showMap();
 else if(id==='yoka')go('shop',600,640);
 else if(id==='shopExit')go('town',960,625);
 else if(id==='gacha')gacha();
 else if(id==='stamp'){unlock('stamps',D.stations[station].id);chime();toast(`${D.stations[station].name} スタンプ！已收入图鉴。`);}
 else if(id==='album')showBook();
 else if(id==='mom')dialog('お母さん','南大沢で、ガチャガチャをしておいで。','みなみおおさわで、がちゃがちゃを しておいで。','去南大沢扭一次蛋吧。记得坐电车回来！');
 else if(id==='staff')dialog('駅員さん',station===2?'京王堀之内には、特急は止まりません。':'南大沢へは、橋本方面です。',station===2?'けいおうほりのうちには、とっきゅうは とまりません。':'みなみおおさわへは、はしもとほうめんです。',station===2?'去京王堀之内请坐各停、快速或区間急行。':'去南大沢请选择 1 番線。刷卡后从左侧楼梯上月台。',`<div class="row"><button data-do="aid">旅行援助（余额不足时）</button></div>`);
 else if(id==='market')dialog('三和スーパー','いらっしゃいませ。','いらっしゃいませ。','欢迎光临！买个饭团，旅途中也要记得吃饭。',`<div class="row"><button data-do="buy">おにぎり · 50コイン</button></div>`);
 else if(id==='mcd')dialog('マクドナルド','ひとやすみ、しませんか。','ひとやすみ、しませんか。','休息一下吧！窗外可以看见去车站的人们。',`<div class="row"><button data-do="snack">ポテト · 50コイン</button></div>`);
 else if(id==='school')dialog('先生','おはよう。駅では走らないでね。','おはよう。えきでは はしらないでね。','早上好！车站里不要奔跑哦。');
 else if(id==='post')dialog('郵便局','お手紙を、届けます。','おてがみを、とどけます。','帮你寄一张旅行明信片。',`<div class="row"><button data-do="postcard">寄明信片 · 20コイン</button></div>`);
 else if(id==='park'||id==='park2')dialog(id==='park'?'秋葉台公園':'久兵衛坂公園','いい天気ですね。','いいてんきですね。','天气真好呀。听听小鸟叫，再去车站吧。');
 else if(id==='friend')dialog('ともだち','快速も、堀之内に止まるよ！','かいそくも、ほりのうちに とまるよ！','快速也停堀之内哦！这一区间的快速与区間急行都各站停靠。');
 else if(id==='civic')dialog('南大沢事務所','ここは、市役所の窓口です。','ここは、しやくしょの まどぐちです。','这里是八王子市役所的办事窗口，位于フレスコ南大沢公共设施楼。');
 else if(id==='child'||id==='clerk')dialog(id==='clerk'?'店員さん':'ともだち','ガチャガチャは、こちらです。','がちゃがちゃは、こちらです。','扭蛋在这里！100 游戏币可以抽一次，可能会遇到稀有电车。');
 else if(id==='fountain')dialog('駅前のひとやすみ','電車の旅は、楽しいね。','でんしゃのたびは、たのしいね。','电车旅行真有趣。广场和步行距离是游戏化缩略。');
 updateUI();
}
function gate(){if(paid){const fare=entry===station?0:80;if(profile.ic<fare){tone(190,.3,'square',.025);toast(`残高不足。出站需 ${fare} 游戏円。请先在这一侧的精算按钮充值。`);openModal(`<h2>残高が足りません</h2><p>本次游戏车费 ${fare} 円。你的 IC 余额 ${profile.ic} 円。<br>可直接在闸内精算，不会被困住。</p><div class="row"><button class="primary" data-do="chargeInside">充值 300（使用零钱）</button><button data-do="aid">零钱不足 · 旅行援助</button></div>`);return;}profile.ic-=fare;paid=false;entry=null;save();toast(`ピッ · 出場　−${fare} 円　残高 ${profile.ic} 円`);if(station===1&&step>=6)setStep(7);}else{if(profile.ic<80){tone(190,.3,'square',.025);toast('残高不足。先到右边的充值机チャージ。');return;}paid=true;entry=station;unlock('visited',D.stations[station].id);toast('ピッ · 入場しました');}
 tone(1319,.12);tone(1760,.1,'sine',.06,.12);gateUntil=time+1.1;transition={start:time,from:{...player},to:{x:600,y:paid?312:465},duration:1};path=[];say('ピッ。ありがとうございます。','ぴっ。ありがとうございます。','刷卡成功。谢谢。');}
function alight(forced=false){if(!onTrain)return;const s=trainState(onTrain);let at=s.station;if(forced)at=onTrain.calls[2].station;if(at===undefined||(!forced&&!s.door)){toast('行驶中不能下车。等列车停稳、车门打开。');return;}station=at;direction=onTrain.dir;unlock('visited',D.stations[station].id);onTrain=null;go('platform',600,465);if(station===2&&step===4)setStep(5);if(station===1&&step===6)setStep(7);if(station===0){toast('到京王多摩センター了。经楼梯换到 1 番線，乘各停 / 快速 / 区間急行回堀之内。');}else say(`${D.stations[station].name}です。`,`${D.stations[station].kana}です。`,`到达${D.stations[station].name}。下楼到改札刷卡出站。`);}
function gacha(){if(profile.coins<100){toast('需要 100 游戏币。向车站工作人员领取旅行援助。');return;}profile.coins-=100;let roll=Math.random()*100,toy=D.toys[0];for(const t of D.toys){roll-=t.weight;if(roll<0){toy=t;break;}}profile.toys[toy.id]=(profile.toys[toy.id]||0)+1;save();if(step<6)setStep(6);[440,554,659,880].forEach((f,i)=>tone(f,.2,'sine',.05,i*.12));openModal(`<div class="reward"><div class="eyebrow">CAPSULE COLLECTION · ${toy.rarity}</div><div class="capsule">${toy.icon}</div><h2>${toy.name}</h2><p>ころん！新しい旅のたからもの。<br>收藏已保存。带着它坐电车回家吧。</p><div class="legend">回家路线：南大沢 2 番線 → 京王堀之内<br>各駅停車 / 快速 / 区間急行 ✓　特急 ×</div><div class="row"><button class="primary" data-do="close">たいせつにする！</button><button data-do="gacha">もう一回 · 100コイン</button></div></div>`);say('何が出るかな？','なにが でるかな？','会抽到什么呢？');}
function showBook(){openModal(`<div class="eyebrow">MY LITTLE TREASURES</div><h2>旅のずかん <small style="font-size:12px">我的旅行收藏</small></h2><p>乘车 ${profile.rides} 次 · 完成往返 ${profile.completed} 次 · 自动保存在这台浏览器</p><div class="grid">${D.toys.map(t=>`<div class="collect ${profile.toys[t.id]?'':'locked'}"><div class="icon">${profile.toys[t.id]?t.icon:'？'}</div><b>${t.name}</b><small>${t.rarity} · ${profile.toys[t.id]||0} 个</small></div>`).join('')}</div><h3>駅とスタンプ</h3><div class="grid">${D.stations.map(s=>`<div class="collect ${profile.visited.includes(s.id)?'':'locked'}"><div class="icon">${profile.stamps.includes(s.id)?'🌸':'🚉'}</div><b>${s.name}</b><small>${s.code} · ${profile.stamps.includes(s.id)?'印章收集 ✓':profile.visited.includes(s.id)?'已到访':'未到访'}</small></div>`).join('')}</div><h3>電車と種別</h3><div class="grid">${D.services.map(s=>`<div class="collect ${profile.types.includes(s.id)?'':'locked'}"><b>${s.name}</b><small>${profile.types.includes(s.id)?'发现 ✓':'等你发现'}</small></div>`).join('')}</div><p>车辆：${profile.models.join(' · ')||'乘车或观察列车来解锁'}<br>线路：${profile.rides?'京王相模原線 ✓':'还未乘坐'}</p>`);}
function showMap(){openModal(`<div class="eyebrow">KEIO SAGAMIHARA LINE · PLAYABLE AREA</div><h2>今日は、ひと駅の冒険。</h2><div class="route-line">${D.stations.map(s=>`<div class="route-stop"><b>${s.code}</b><span>${s.name}</span></div>`).join('')}</div><div class="legend">← 調布・新宿方面　　橋本方面 →<br><strong>各停 / 快速 / 区間急行</strong>：这里全部停靠。<br><strong>特急 / 京王ライナー</strong>：通过京王堀之内。<br>南大沢返回：2 番線，确认列车停京王堀之内。<br>若坐上特急：到多摩センター下车，经改札内楼梯换方向。</div><p>可步行探索：京王堀之内、南大沢。<br>京王多摩センター仅有返程救援站台，未开放生活圈。</p><h3>いまのまち · 附近地点</h3><div class="row">${pois().map(p=>`<button data-walk="${p.id}">${p.label}</button>`).join('')}</div><p style="font-size:11px">点击地点后，人物会沿路走过去；靠近后按 E 互动。路线图不会瞬间传送。</p>`);}
function showSettings(){openModal(`<div class="eyebrow">A SMALL, KIND WORLD</div><h2>あそびかた・設定</h2><p>方向键 / WASD 移动，E 或空格互动。<br>点击地面自动步行；手机使用左下方向键。<br>点击广播字幕查看读音与中文；↻ 再听一次。<br>打开菜单会暂停时间，错过车不会受罚。</p><div class="row"><button data-do="sound">声音：${profile.sound?'开启':'关闭'}</button><button data-do="child">儿童模式：${profile.child?'开启':'关闭'}</button><button data-do="free">切换${free?'任务':'自由探索'}模式</button></div><div class="legend">本作是独立创作的铁路生活游戏，并非官方产品。<br>站序与核心停车规则据公开资料核实；街区布局、住宅、步行距离、时刻、运价、扭蛋奖品均为游戏化设计。IC 单程统一 80 游戏円，不可作现实出行或消费依据。<br>列车约 49 秒一班，运行时间已压缩。京王ライナー本版仅供观察；未模拟完整东京网络。<br>声音为合成效果；日语由设备语音朗读，日语音色取决于系统。</div><details class="source-list"><summary>资料来源（2026-09-19 核对）</summary><ul>${D.sources.map(s=>`<li><a href="${s[1]}" target="_blank" rel="noopener">${s[0]}</a></li>`).join('')}</ul></details><p style="font-size:11px">收藏、余额及模式自动保存。重新打开时从家开始新的旅程。</p><div class="row"><button data-do="restart">返回家开始新旅程（保留收藏）</button></div>`);}
function updateUI(){
 $('balance').textContent=profile.ic;$('coins').textContent='◉ '+profile.coins;$('count').textContent=Object.values(profile.toys).reduce((a,b)=>a+b,0);document.body.classList.toggle('child',profile.child);
 $('stepNum').textContent=free?'FREE':`${String(Math.min(step+1,8)).padStart(2,'0')} / 08`;
 $('missionTitle').textContent=free?'今日は、どこへ行こう？':step>=8?'小さな冒険、大成功！':D.missions[step][0];
 let hint=free?'随心步行、乘车、看风景。收藏和印章会一直留下。':step>=8?'可以再出门旅行，或打开图鉴看看今天的收获。':D.missions[step][1];
 if(station===0)hint='从改札内楼梯换到 1 番線，坐各停 / 快速 / 区間急行回京王堀之内。';
 $('hint').textContent=profile.child?hint:'近くの場所で E · 路線図で行き先を確認';$('progress').innerHTML=Array.from({length:8},(_,i)=>`<i class="${i<step?'done':i===step?'current':''}"></i>`).join('');
 const names={home:['わたしの家','今日も、ここから。'],town:[D.stations[station].name,station===1?'わたしのまち · 八王子市':'駅前さんぽ · 八王子市'],concourse:[D.stations[station].name+'駅','改札コンコース · IC CARD'],platform:[D.stations[station].name+'駅',direction===1?'1 番線 · 橋本方面':platformNumber(-1)+' 番線 · 調布・新宿方面'],shop:['イトーヨーカドー 南大沢店','ガチャガチャ · 旅のたからもの'],train:[onTrain?onTrain.service.name+' '+(direction===1?'橋本':'新宿')+'行き':'電車','京王相模原線 · 車内']};
 $('place').textContent=names[scene][0];$('placeSub').textContent=names[scene][1];$('stationCode').textContent=scene==='home'?'HOME':scene==='train'?'KEIO':D.stations[station].code;$('board').hidden=scene!=='platform';
}
function update(dt){if(!started||modal)return;time+=dt;moving=false;
 if(time>toastUntil)$('toast').classList.remove('show');
 if(transition){const f=clamp((time-transition.start)/transition.duration,0,1);player.x=transition.from.x+(transition.to.x-transition.from.x)*ease(f);player.y=transition.from.y+(transition.to.y-transition.from.y)*ease(f);if(f>=1)transition=null;}
 else if(scene!=='train'){
 let dx=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),dy=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);
 if(dx||dy){path=[];target=null;}else if(path.length){const p=path[0],d=dist(player,p);if(d<4){path.shift();}else{dx=(p.x-player.x)/d;dy=(p.y-player.y)/d;}}
 const norm=Math.hypot(dx,dy);if(norm){dx/=norm;dy/=norm;const speed=scene==='platform'?135:155,nx=player.x+dx*speed*dt,ny=player.y+dy*speed*dt;if(walkable(nx,player.y))player.x=nx;if(walkable(player.x,ny))player.y=ny;moving=true;walkPhase+=dt*12;foot+=dt;if(foot>.42){foot=0;tone(180+Math.random()*25,.035,'sine',.008);}}
 near=pois().filter(p=>dist(player,p)<(p.id==='train'?100:76)).sort((a,b)=>dist(player,a)-dist(player,b))[0]||null;
 }
 if(scene==='platform'){
  for(const o of platformTrains()){if(Math.abs(o.s.pos-station)<.28&&o.tr.calls[0].arr-7<time&&time<o.tr.end){unlock('types',o.tr.service.id);unlock('models',o.tr.service.model);if(!announced.has(o.tr.id+station)){announced.add(o.tr.id+station);chime();say(o.call.stop?`${o.tr.service.name}、${direction===1?'橋本':'新宿'}行きがまいります。`:'電車が通過します。ご注意ください。',o.call.stop?`${o.tr.service.name}、${direction===1?'はしもと':'しんじゅく'}ゆきが まいります。`:'でんしゃが つうかします。ごちゅういください。',o.call.stop?'列车即将进站，请在黄线内侧等候。':'列车通过，不停本站。请注意安全。');}}}
  $('platformTitle').textContent=`${platformNumber()} 番線 · ${direction===1?'橋本方面':'調布・新宿方面'}`;
  $('departures').innerHTML=departures().map(o=>`<div class="departure"><span class="service" style="background:${o.tr.service.color}">${o.tr.service.name}</span><span>${direction===1?'橋本':'新宿'}<em>${o.call.stop?'停車': '当駅通過'}${station===2&&direction===-1&&!o.tr.service.stops.includes(1)?' · 堀之内 ×':''}</em></span><b>${o.call.arr<=time?(o.call.stop?'発車 '+Math.max(0,Math.ceil(o.call.dep-time))+'s':'通過'):Math.ceil(o.call.arr-time)+'秒後'}</b></div>`).join('');
 }
 if(scene==='train'&&onTrain){const s=trainState(onTrain),sig=s.state+':'+s.station+':'+s.next;if(sig!==trainLast){trainLast=sig;if(s.state==='running'&&s.next!==undefined){say(`次は、${D.stations[s.next].name}です。`,`つぎは、${D.stations[s.next].kana}です。`,`下一站是${D.stations[s.next].name}。`);}else if(s.state==='stopped'){chime();say(`${D.stations[s.station].name}です。ドアが開きます。`,`${D.stations[s.station].kana}です。どあが ひらきます。`,'到站了，车门开启。按 E 下车。');}else if(s.state==='closing'){tone(784,.35);say('ドアが閉まります。','どあが しまります。','车门即将关闭。');}}
  if(s.state==='running'){rolling+=dt;if(rolling>.45){rolling=0;tone(85,.08,'triangle',.022);tone(110,.065,'triangle',.012,.13);}}
  const final=onTrain.calls[2];if(time>=final.dep-.7){toast('已到本轮可玩区间边界，陪你下车。可换方向继续旅行。');alight(true);}
 }
 let actionLabel='近くを歩こう',enabled=!!near&&!transition;
 if(scene==='train'){const s=trainState(onTrain);enabled=s.door;actionLabel=s.door?`${D.stations[s.station].name}で降りる`:s.state==='closing'?'ドアが閉まります':'走行中 · 窓を眺めよう';}
 else if(near){actionLabel=near.label;if(near.id==='train'){const o=boardable();enabled=!!o;actionLabel=o?`${o.tr.service.name}に乗る`:'ここで電車を待つ';}}
 $('action').disabled=!enabled;$('actionLabel').textContent=actionLabel;
 const m=15*60+Math.floor(time/8);$('clock').textContent=`☀ ${Math.floor(m/60)%24}:${String(m%60).padStart(2,'0')}`;
}
// Canvas artwork: original soft, dimensional miniature town; no remote asset dependency.
function rect(x,y,w,h,c,r=0){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function line(x1,y1,x2,y2,c,w=1){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function poly(p,c){ctx.fillStyle=c;ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.fill();}
function text(str,x,y,size=14,color='#315449',align='center',weight=500){ctx.fillStyle=color;ctx.textAlign=align;ctx.font=`${weight} ${size}px "Hiragino Kaku Gothic ProN",system-ui,sans-serif`;ctx.fillText(str,x,y);}
function tree(x,y,s=1){ellipse(x+12*s,y+8*s,28*s,11*s,'#42694722');rect(x-4*s,y-36*s,8*s,39*s,'#9b8260',3);ellipse(x,y-50*s,27*s,32*s,'#779d68');ellipse(x-14*s,y-47*s,19*s,24*s,'#8eb27b');ellipse(x+9*s,y-63*s,19*s,21*s,'#a6c58b');ellipse(x-4*s,y-72*s,12*s,10*s,'#b1cd91');}
function shrub(x,y,w=45){ellipse(x+5,y+4,w/2,9,'#496b3a20');rect(x-w/2,y-15,w,22,'#83a16b',10);ellipse(x-8,y-16,w*.32,13,'#a1bb80');}
function flowers(x,y){for(let i=0;i<7;i++){let xx=x+(i%4)*13,yy=y+Math.floor(i/4)*12;line(xx,yy,xx,yy+8,'#6c9b63',2);ellipse(xx,yy,3,3,i%2?'#f8e6a4':'#efb5b0');}}
function bench(x,y){rect(x-38,y-20,76,10,'#b89363',3);rect(x-38,y-6,76,12,'#c5a16f',3);rect(x-30,y+4,5,12,'#607469');rect(x+26,y+4,5,12,'#607469');}
function lamp(x,y){ellipse(x+8,y+6,12,5,'#30513a18');rect(x-3,y-75,6,78,'#637870',3);rect(x-15,y-78,30,9,'#f4efd0',4);rect(x-13,y-83,26,6,'#6d8676',3);}
function person(x,y,color='#e7b358',phase=0,hero=false){const bob=Math.sin(phase)*1.6;ellipse(x+4,y+3,15,6,'#36513f24');const leg=Math.sin(phase)*4;line(x-5,y-12,x-6+leg,y,'#3e5362',6);line(x+5,y-12,x+6-leg,y,'#3e5362',6);rect(x-9,y-34+bob,18,24,color,7);if(hero){rect(x+6,y-31+bob,8,16,'#bd7159',3);line(x-6,y-30+bob,x-6,y-13+bob,'#fff0ca',2);}line(x-10,y-28+bob,x-13-leg/2,y-16+bob,'#efc6a2',5);line(x+10,y-28+bob,x+13+leg/2,y-16+bob,'#efc6a2',5);ellipse(x,y-43+bob,11,13,'#f2cdab');ellipse(x,y-50+bob,12,8,'#4d5142');if(hero){ellipse(x,y-52+bob,13,5,'#e4b454');rect(x-11,y-59+bob,22,9,'#f3ca6b',5);line(x-10,y-53+bob,x+10,y-53+bob,'#a87d39',2);}ellipse(x+4,y-42+bob,1,1.4,'#484c3c');}
function label(str,x,y,color='#34574b'){const wid=Math.max(65,str.length*12+23);rect(x-wid/2,y-19,wid,27,'#fffdf0ec',6);text(str,x,y,12,color,'center',650);}
function building(b){const{x,y,w,h,color,kind}=b;poly([[x+10,y+h+9],[x+w+28,y+h+9],[x+w+42,y+h-5],[x+w+23,y-5],[x+20,y]],'#4664471b');rect(x,y,w,h,color,3);poly([[x+w,y],[x+w+18,y-18],[x+w+18,y+h-18],[x+w,y+h]],'#a8b7a5');poly([[x,y],[x+18,y-18],[x+w+18,y-18],[x+w,y]],'#f5f0d9');rect(x+3,y+4,w-6,7,'#f9f5df');
 if(kind==='house'){poly([[x-10,y+7],[x+w/2,y-52],[x+w+10,y+7]],'#a17a62');poly([[x+w/2,y-52],[x+w/2+18,y-68],[x+w+28,y-11],[x+w+10,y+7]],'#ba9376');rect(x+20,y+29,40,39,'#739ba0',3);line(x+40,y+29,x+40,y+68,'#fff6d5',3);line(x+20,y+47,x+60,y+47,'#fff6d5',3);rect(x+w-51,y+38,30,55,'#9b8067',3);ellipse(x+w-43,y+67,2,2,'#f7e3a9');rect(x+16,y+76,48,7,'#c0a88b');flowers(x+20,y+73);}
 else{for(let i=0;i<Math.floor(w/48);i++){rect(x+15+i*47,y+24,32,34,'#83a5a6',3);line(x+31+i*47,y+24,x+31+i*47,y+58,'#dee8d8',2);}rect(x+w/2-25,y+h-47,50,47,'#5f8b8a',2);line(x+w/2,y+h-44,x+w/2,y+h,'#c6d8c6',2);}
 if(kind==='station'){rect(x-12,y+56,w+24,14,'#456c61',2);poly([[x-12,y+56],[x+12,y+34],[x+w+36,y+34],[x+w+12,y+56]],'#719384');for(let i=0;i<4;i++)rect(x+20+i*(w-40)/3,y+70,7,35,'#b5c6ae');rect(x+28,y+6,w-56,36,'#fffdf0',3);rect(x+28,y+35,w-56,6,'#d94978');text(b.name,x+w/2,y+29,21,'#315449','center',700);text('KEIO',x+w-25,y+85,10,'#d94978');}
 else if(kind==='mcd'){rect(x+10,y+8,w-20,25,'#b94740',2);text('M',x+w/2,y+30,31,'#f7cf51','center',800);}
 else{rect(x+10,y+5,w-20,25,kind==='post'?'#c35e52':kind==='shop'?'#598457':kind==='mall'?'#668ba1':'#eae9d8',3);text(kind==='shop'?'三和 SANWA':kind==='mall'?'イトーヨーカドー':kind==='post'?'〒 POST':b.name,x+w/2,y+22,13,kind==='post'||kind==='shop'||kind==='mall'?'#fffbe7':'#547065','center',700);}
 if(kind==='school'){ellipse(x+w/2,y-8,14,14,'#fffdf0');line(x+w/2,y-8,x+w/2,y-17,'#748575',2);line(x+w/2,y-8,x+w/2+6,y-4,'#748575',2);}
 label(b.name,x+w/2,y+h+49);text(b.sub,x+w/2,y+h+65,8,'#6e826b');}
function worldGround(){rect(0,0,W,H,'#bdd0a1');for(let i=0;i<100;i++){const x=(i*173+47)%W,y=(i*137+53)%H;line(x,y,x+3,y-4,'#a8c08e',1);line(x+4,y,x+7,y-2,'#a8c08e',1);}rect(0,280,1200,66,'#e9dfc5');rect(0,476,1200,59,'#e9dfc5');rect(0,697,1200,58,'#e9dfc5');rect(357,60,64,710,'#e9dfc5');rect(803,60,58,710,'#e9dfc5');rect(170,200,42,160,'#e9dfc5');rect(585,460,85,280,'#e9dfc5');rect(975,280,43,430,'#e9dfc5');for(let x=0;x<1200;x+=39){line(x,288,x,337,'#dcd1b7');line(x,702,x,747,'#dcd1b7');}line(0,345,1200,345,'#d1c5aa',3);line(0,535,1200,535,'#d1c5aa',3);}
function drawTown(){worldGround();if(station===1){rect(873,87,273,158,'#a5bf8d',25);rect(88,560,239,118,'#abc38e',27);ellipse(968,218,65,24,'#e4d3a9');rect(930,179,6,42,'#9c8060');rect(1003,179,6,42,'#9c8060');line(930,179,1009,179,'#9c8060',7);line(950,180,950,207,'#748573',2);line(984,180,984,207,'#748573',2);rect(943,207,47,6,'#d39c5d');label('秋葉台公園',1001,270);label('久兵衛坂公園',222,692);bench(228,618);tree(110,614,1);tree(296,632,1);tree(905,186,1.2);tree(1100,180,1.1);tree(1052,121,.8);for(let i=0;i<5;i++)shrub(472+i*61,461);outdoorH.forEach(building);person(390,325,'#8cb2ab',Math.sin(time)*.2);person(1010+Math.sin(time*.13)*45,510,'#be8191',time*2);person(770,340+Math.sin(time*.09)*40,'#6e8b95',time*1.5);flowers(87,285);flowers(720,397);for(const p of[[70,160],[76,422],[340,190],[1140,477],[1130,680],[437,686],[742,140]])tree(...p,.9);bench(725,405);lamp(450,335);lamp(820,470);lamp(835,704);}
 else{rect(390,300,415,194,'#e7d8ba',60);rect(575,245,85,460,'#e9dfc5');rect(870,310,80,330,'#e9dfc5');ellipse(590,398,100,45,'#cbc6ac');ellipse(590,390,92,41,'#eff0d8');ellipse(590,388,80,33,'#8dc5c4');ellipse(590,388,65,24,'#b0dcd2');ellipse(590,383,35+Math.sin(time*2)*4,13,'#d0e8d4');rect(585,350,10,39,'#e7e5cd',4);for(let i=0;i<5;i++){const xx=560+i*15;line(590,352,xx,383,'#e9f5e3',2);}outdoorM.forEach(building);person(750,385,'#d9a05f');person(410+Math.sin(time*.12)*70,663,'#748f9a',time*1.6);bench(421,407);bench(756,452);for(const p of[[82,280],[320,360],[865,197],[1090,170],[980,320],[435,570],[91,704],[1110,718]])tree(...p,1.15);lamp(382,481);lamp(791,694);flowers(688,450);text('駅前の歩行者広場',590,490,12,'#9b9479');}
}
function floorTiles(x,y,w,h,color='#e3ddc8'){rect(x,y,w,h,color);for(let yy=y;yy<y+h;yy+=40)line(x,yy,x+w,yy,'#c1c8b528');for(let xx=x;xx<x+w;xx+=60)line(xx,y,xx,y+h,'#c1c8b528');}
function drawHome(){rect(0,0,W,H,'#b8c8a3');ellipse(617,700,490,60,'#315d5013');floorTiles(145,203,910,502,'#e3c99d');for(let yy=215;yy<700;yy+=32)line(150,yy,1050,yy,'#c4a87855');rect(145,150,910,75,'#f1e6cc');rect(145,150,16,555,'#ccbaa0');rect(1039,150,16,555,'#ccbaa0');rect(185,181,190,13,'#c3a77e');rect(479,161,158,64,'#a1c1b0',5);line(559,163,559,224,'#fff5da',5);line(480,191,637,191,'#fff5da',5);rect(240,229,180,75,'#8daca0',15);rect(243,213,174,37,'#abc3b3',12);rect(254,252,67,39,'#c9cdb0',6);rect(333,252,67,39,'#dfc790',6);rect(470,341,164,101,'#bb9667',18);rect(465,331,164,99,'#d3af7f',18);rect(500,351,41,28,'#f5e9cf',3);text('東京',520,370,11);ellipse(590,368,12,9,'#fff2ce');rect(745,237,207,84,'#ad9172',7);rect(752,241,193,28,'#d1b798',4);for(let i=0;i<5;i++)rect(762+i*33,272,22,33,['#afc6b0','#e0bd8f','#cb9f94'][i%3],2);rect(570,614,60,82,'#b09c7e',4);rect(575,620,50,71,'#c6b08d');label('玄関 · おでかけ',600,722);rect(673,490,238,123,'#c6c9a2',18);for(let i=0;i<6;i++)line(690,505+i*17,891,505+i*17,'#dbe0b8',2);person(820,375,'#af8294');tree(980,251,.75);label('お母さん',820,405);label('旅のずかん',370,360);text('HOME SWEET HOME',597,285,12,'#a78f6c','center',650);}
function drawConcourse(){rect(0,0,W,H,'#c0cabb');floorTiles(60,75,1080,670);rect(60,73,1080,67,'#496b60');text(D.stations[station].name+'駅',600,114,29,'#fff9df','center',650);text('KEIO SAGAMIHARA LINE',1055,110,10,'#bcd2bc','right');
 for(const[x,n,dir]of[[230,'1','橋本方面'],[810,String(platformNumber(-1)),'調布・新宿方面']]){rect(x,142,160,66,'#aab9a6',3);for(let y=149;y<202;y+=9)line(x+5,y,x+155,y,'#e0e1cb',4);rect(x-16,214,192,31,'#496b60',4);text(n+' ↑ '+dir,x+80,235,15,'#fffbe0');}
 rect(70,365,435,36,'#8da69b');rect(695,365,435,36,'#8da69b');for(let x=70;x<505;x+=18)line(x,368,x,397,'#b9cbc1',3);for(let x=700;x<1130;x+=18)line(x,368,x,397,'#b9cbc1',3);
 for(const x of[507,578,650]){rect(x,350,43,75,'#7a9c91',7);rect(x+3,344,37,46,'#b8cbc0',5);rect(x+8,350,27,22,'#254f48',4);ellipse(x+21,361,6,6,time<gateUntil?'#72e8ac':'#8ebdc0');if(time>=gateUntil&&x<650)rect(x+43,382,28,12,'#c96672',2);text('IC',x+22,408,11,'#f6ffe8');}text(time<gateUntil?'ピッ ✓':'IC CARD',600,292,22,time<gateUntil?'#438660':'#708673','center',650);
 rect(819,382,95,80,'#648a86',7);rect(830,393,72,32,'#cfdfb9',4);text('チャージ',866,414,12);rect(840,437,40,8,'#304c48');label('チャージ',866,508);rect(273,372,119,39,'#b4c3a9',6);person(340,434,'#527688');label('駅員',340,478);rect(136,427,64,57,'#b89e75',6);rect(132,424,72,9,'#d8c69a');ellipse(168,433,9,6,'#b96465');label('スタンプ',170,539);rect(558,650,84,60,'#b6b7a0',4);text('↓ 出口 EXIT',600,693,14,'#fff8e1');text(paid?'改札内 · PAID AREA':'改札外 · TICKET HALL',600,560,12,'#8c977f');}
function drawTrainBody(x,y,tr,doors=false,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);for(let car=-1;car<3;car++){let xx=car*312;ellipse(xx+155,123,144,11,'#28473e22');rect(xx+2,26,304,86,'#d9dfd6',9);poly([[xx+2,26],[xx+14,8],[xx+296,8],[xx+306,26]],'#f0f0e4');rect(xx+13,17,276,11,'#b5bfb6',4);rect(xx+7,72,295,11,tr.service.id==='liner'?'#895476':'#d94978');rect(xx+7,87,295,5,'#35568a');for(const a of[21,111,209]){rect(xx+a,37,61,32,'#416b76',4);rect(xx+a+4,40,23,22,'#789b9e',2);line(xx+a+4,62,xx+a+55,40,'#bfd5ce35',2);}for(const a of[88,185]){rect(xx+a,32,22,72,'#a8b5b1',2);rect(xx+a+2,38,18,30,'#426e78',2);if(doors){rect(xx+a-5,34,32,68,'#314f50');rect(xx+a,97,24,6,'#ede0a5');}else line(xx+a+11,34,xx+a+11,103,'#768c86');}ellipse(xx+58,112,17,10,'#465b59');ellipse(xx+254,112,17,10,'#465b59');rect(xx+292,42,9,17,'#fff1b2',2);text('KEIO',xx+147,100,11,'#c34573','center',800);text(tr.service.name,xx+149,27,8,'#263f43');}ctx.restore();}
function drawPlatform(){rect(0,0,W,H,'#b5cba8');for(let i=0;i<10;i++){const x=i*140-40;building({x,y:155+(i%3)*16,w:90,h:64,color:['#d8d6be','#d3c8b0','#bec9bb'][i%3],kind:'house',name:'',sub:''});}for(let i=0;i<8;i++)tree(i*175+42,270,.8);rect(0,280,W,138,'#a4aea0');for(let i=0;i<45;i++){const x=i*29;line(x,313,x+18,388,'#7a887b',7);}line(0,324,W,324,'#e1e2ce',5);line(0,387,W,387,'#e1e2ce',5);line(0,328,W,328,'#6b7d73',2);line(0,390,W,390,'#6b7d73',2);
 const items=platformTrains().filter(o=>Math.abs(o.s.pos-station)<1&&time>o.tr.calls[0].arr-10&&time<o.tr.end);for(const o of items){const delta=(o.s.pos-station)*1500;drawTrainBody(405+delta,279,o.tr,o.s.door);}
 floorTiles(0,421,W,285,'#dedccb');rect(0,421,W,8,'#f2eee0');rect(0,437,W,13,'#e4c455');for(let x=0;x<W;x+=12)rect(x,439,5,8,'#efdc86',1);line(0,414,W,414,'#8f9b8b',7);
 for(let x=240;x<1150;x+=290){rect(x,120,11,362,'#8b9c8e');rect(x-10,470,33,11,'#a7b29e',4);}poly([[0,112],[35,83],[1200,83],[1200,127]],'#68887b');rect(0,120,W,14,'#496b60');rect(0,134,W,9,'#a6bcaa');line(0,177,1200,177,'#647f7140',2);
 rect(395,168,410,80,'#fffcdf',4);rect(395,225,410,13,'#d94978');text(D.stations[station].name,600,204,29,'#304f48','center',650);text(D.stations[station].code,428,219,10);text(['← 京王永山　　京王堀之内 →','← 京王多摩センター　　南大沢 →','← 京王堀之内　　多摩境 →'][station],600,265,12,'#4f7264');
 rect(95,557,150,77,'#a6b1a1',4);for(let y=567;y<632;y+=10)line(102,y,238,y,'#d8d9c4',4);label('↓ 改札',170,660);bench(880,570);rect(915,378,7,37,'#729084');rect(865,353,107,36,'#426359',4);text('停車駅を確認',918,376,12,'#fff6d6');person(405,510,'#c19b86');person(748,491,'#83a9ac');person(828,591,'#bea274');for(const x of[495,585,675]){line(x,467,x,496,'#d6ac71',3);text('乗車位置',x,511,8,'#9f9f81');}text('黄色い線の内側でお待ちください',575,608,15,'#929b85');
 if(boardable()){const bob=Math.sin(time*3)*4;poly([[592,475+bob],[608,475+bob],[600,461+bob]],'#d94978');}}
function drawShop(){rect(0,0,W,H,'#bdcbb4');floorTiles(145,150,910,557,'#efe3ca');rect(145,130,910,65,'#597e88');text('イトーヨーカドー　南大沢店',600,173,28,'#fffbe4','center',650);rect(340,208,590,41,'#dcbb78',9);text('カプセルトイ · 小さな旅のたからもの',635,235,18,'#fffbe7');
 for(let i=0;i<5;i++){const x=365+i*110;rect(x+4,269,95,101,'#bea992',9);rect(x,261,95,98,['#c96f80','#6b9ea7','#d1ac5e','#789b76','#a18cb2'][i],8);rect(x+9,270,77,46,'#e5efe0',5);for(let j=0;j<6;j++)ellipse(x+20+j%3*23,285+Math.floor(j/3)*16,8,8,['#e8bb64','#a5c7b3','#de95a2'][j%3]);ellipse(x+29,336,10,10,'#f7ead0');line(x+22,336,x+36,336,'#79958a',4);rect(x+55,324,27,20,'#3e625a',4);}label('ガチャガチャ · 100コイン',620,410);rect(130,250,160,88,'#b79d78',7);rect(125,245,170,16,'#d9c097',5);person(260,395,'#7c9f94');label('出口',600,700);rect(560,628,80,45,'#d4c8ad',5);text('↓',600,658,26,'#688572');tree(1000,560,.9);bench(852,569);text('どれが出るかな？',610,505,20,'#b6a481');}
function drawCar(){const s=trainState(onTrain),speed=s.pos*850;rect(0,0,W,H,'#dbe5cf');rect(0,190,W,208,'#b7d8d1');for(let i=-1;i<11;i++){const x=((i*171-speed)%1800+1800)%1800-220;ellipse(x,312,170,100,'#a7c49e');}for(let i=-1;i<13;i++){const x=((i*127-speed*2)%1800+1800)%1800-190;rect(x,291,73,104,'#d6d5ba',3);poly([[x-5,291],[x+35,262],[x+80,291]],'#8eaa98');rect(x+12,307,21,29,'#799b9a');rect(x+44,307,18,29,'#91aaa0');}rect(0,369,W,29,'#a1b29a');for(let i=0;i<20;i++){const x=((i*115-speed*3)%1800+1800)%1800-100;line(x,357,x,395,'#8a9f91',3);}rect(0,105,W,95,'#e4e4d2');rect(0,397,W,227,'#ebe7d5');floorTiles(0,623,W,177,'#9fa99b');rect(0,390,W,9,'#7c9990');rect(0,190,W,10,'#7c9990');for(const x of[0,355,840,1170])rect(x,182,27,218,'#f1edde');
 const door=s.door;rect(481,205,239,368,'#c5cfbf',6);rect(492,218,217,271,'#809e99',3);if(door){rect(524,214,151,366,'#dcd9c3');rect(524,391,151,14,'#e5c35e');text('↓ おりる',600,489,25,'#4c6a57');}else{rect(502,234,87,150,'#668f91',4);rect(611,234,87,150,'#668f91',4);line(600,218,600,567,'#708e84',3);}rect(475,566,249,14,'#d1c8a8');
 for(const x of[56,800]){rect(x,433,343,110,'#987489',15);rect(x,484,343,76,'#b08a9b',12);for(let i=1;i<5;i++)line(x+i*68,442,x+i*68,548,'#c7a5ad',2);rect(x+12,557,319,13,'#74877e');}for(let x=86;x<1150;x+=137){line(x,117,x,162,'#9cae9e',3);ctx.strokeStyle='#f9f4df';ctx.lineWidth=6;ctx.beginPath();ctx.arc(x,177,13,0,Math.PI*2);ctx.stroke();}rect(411,123,378,60,'#294b43',6);text(s.door?D.stations[s.station].name:`次は ${D.stations[s.next??2].name}`,600,150,20,'#edf1d5');text(s.door?'停車中 · ドアが開いています':onTrain.service.id==='express'?'特急 · 京王堀之内は通過':'KEIO SAGAMIHARA LINE',600,170,11,'#a7c7a8');person(255,540,'#7b9994');person(894,540,'#bc997e');person(1055,540,'#8a96ad');person(591,626,'#e7b358',0,true);
 rect(280,690,640,49,'#fff9e9e8',13);text(`${D.stations[0].name}　━　${D.stations[1].name}　━　${D.stations[2].name}`,600,713,14,'#315b4d');const pos=clamp(s.pos,0,2);ellipse(375+pos*223,729,7,4,'#d94978');}
function draw(){const dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(innerWidth*dpr)||canvas.height!==Math.round(innerHeight*dpr)){screen={w:innerWidth,h:innerHeight};canvas.width=Math.round(screen.w*dpr);canvas.height=Math.round(screen.h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,screen.w,screen.h);rect(0,0,screen.w,screen.h,'#bfd0aa');
 const mobile=screen.w<700;let scale=mobile?.92:Math.min(screen.w/W,(screen.h-70)/H);if(scene==='train')scale=mobile?.63:Math.min(screen.w/W,(screen.h-70)/H);
 let camX=mobile?clamp((scene==='train'?600:player.x)-screen.w/scale/2,-35,W-screen.w/scale+35):-(screen.w/scale-W)/2;
 let camY=mobile?clamp((scene==='train'?430:player.y)-screen.h*.53/scale,-50,H-screen.h/scale+180):-(screen.h/scale-H)/2-20;
 camera={x:camX,y:camY,scale};ctx.save();ctx.scale(scale,scale);ctx.translate(-camX,-camY);
 if(scene==='home')drawHome();else if(scene==='town')drawTown();else if(scene==='concourse')drawConcourse();else if(scene==='platform')drawPlatform();else if(scene==='shop')drawShop();else if(scene==='train'&&onTrain)drawCar();
 if(scene!=='train'){
 if(target&&path.length){ctx.setLineDash([3,9]);ctx.strokeStyle='#fdf8d5a0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(player.x,player.y);for(let i=0;i<path.length;i+=3)ctx.lineTo(path[i].x,path[i].y);ctx.stroke();ctx.setLineDash([]);ellipse(target.x,target.y,10+Math.sin(time*3)*2,5,'#f8f0ca');}
 person(player.x,player.y,'#e7b358',moving?walkPhase:0,true);ellipse(player.x,player.y+10,3,2,'#fdf4cf');
 if(near){const bob=Math.sin(time*3)*2;rect(player.x-12,player.y-85+bob,24,22,'#fffdf1',6);text('E',player.x,player.y-69+bob,13,'#37654f','center',700);}
 }
 ctx.restore();
 if(scene==='town'){const g=ctx.createLinearGradient(0,0,screen.w,screen.h);g.addColorStop(0,'#fff5c319');g.addColorStop(1,'#76927809');ctx.fillStyle=g;ctx.fillRect(0,0,screen.w,screen.h);}
}
function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;update(dt);draw();requestAnimationFrame(frame);}
function start(isFree){started=true;free=isFree;profile.free=free;$('welcome').hidden=true;initAudio();updateUI();say('いってらっしゃい。','いってらっしゃい。','路上小心。走到玄关按 E 出门。');}
$('start').onclick=()=>start(false);$('freeStart').onclick=()=>start(true);$('closeModal').onclick=closeModal;$('mapBtn').onclick=showMap;$('bookBtn').onclick=showBook;$('settingsBtn').onclick=showSettings;$('action').onclick=()=>interact();$('repeat').onclick=()=>{initAudio();speak();};$('subtitle').onclick=()=>{$('translation').hidden=!$('translation').hidden;};
document.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'){closeModal();return;}if(!started||modal)return;keys[e.key]=true;if(!e.repeat&&['e','E',' '].includes(e.key))interact();});
document.addEventListener('keyup',e=>{keys[e.key]=false;});window.addEventListener('blur',()=>{keys={};});document.addEventListener('visibilitychange',()=>{keys={};last=performance.now();});
canvas.addEventListener('pointerdown',e=>{initAudio();walkTo(e.clientX/camera.scale+camera.x,e.clientY/camera.scale+camera.y);});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;});for(const ev of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{keys[b.dataset.key]=false;});});
$('modalContent').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.walk){const p=pois().find(p=>p.id===b.dataset.walk);closeModal();if(p)walkTo(p.x,p.y);return;}const a=b.dataset.do;
 if(a==='close')closeModal();if(a==='book')showBook();if(a==='gacha'){closeModal();gacha();}if(a==='again'){step=0;closeModal();updateUI();}if(a==='free'){free=!free;profile.free=free;save();closeModal();updateUI();}
 if(a==='sound'){profile.sound=!profile.sound;if(!profile.sound&&window.speechSynthesis)speechSynthesis.cancel();save();showSettings();}if(a==='child'){profile.child=!profile.child;save();updateUI();showSettings();}
 if(a==='aid'){if(profile.coins<300){profile.coins+=500;save();toast('駅員：旅行援助 +500 游戏币。安心してね。');}else toast('零钱足够，先去充值机吧。');closeModal();updateUI();}
 if(a==='chargeInside'){if(profile.coins>=300){profile.coins-=300;profile.ic+=300;save();closeModal();toast('チャージ完了。请再刷卡出站。');updateUI();}else toast('请先领取旅行援助。');}
 if(['buy','snack','postcard'].includes(a)){const cost=a==='postcard'?20:50;if(profile.coins>=cost){profile.coins-=cost;save();chime();toast(a==='postcard'?'明信片寄出啦！':'いただきます！谢谢款待。');closeModal();updateUI();}else toast('零钱不足，可以找駅員帮忙。');}
 if(a==='restart'){paid=false;entry=null;onTrain=null;station=1;step=0;transition=null;closeModal();go('home',580,480);toast('新旅程从家开始，收藏和余额都保留。');}
};
updateUI();requestAnimationFrame(frame);
// Read-only diagnostics let automated tests assert actual state without bypassing controls.
window.gameDebug={get state(){return{scene,station,direction,player:{...player},step,paid,entry,time,near:near?.id,onTrain:onTrain?.id,profile:JSON.parse(JSON.stringify(profile)),pathLength:path.length,modal,camera:{...camera}};},get trains(){return departures().map(o=>({id:o.tr.id,name:o.tr.service.name,arrival:o.call.arr,departure:o.call.dep,stop:o.call.stop}));}};
})();
