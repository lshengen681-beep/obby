"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
const overlay=document.getElementById("overlay"),message=document.getElementById("message");
const levelLabel=document.getElementById("levelLabel"),gemLabel=document.getElementById("gemLabel");
const themes=[
 ["#8ed8ff","#e8faff","#347c69","#f04452","草原大楼"],["#ffb36b","#ffe2a6","#9b6338","#ef5144","熔岩大楼"],
 ["#9b9cff","#e6ddff","#5456a8","#fb668c","紫晶大楼"],["#75e5d2","#d8fff5","#247c78","#f2a33a","天空大楼"],
 ["#f5a8c9","#ffe5ef","#a64d82","#e74f65","糖果大楼"],["#8197b8","#dce7f8","#526780","#ff654f","机械大楼"],
 ["#65c7ed","#d8f7ff","#28759a","#ffae42","冰雪大楼"],["#c18af2","#f1ddff","#7043a0","#fa5579","幻影大楼"],
 ["#ffca72","#fff0c2","#a86c30","#ef3d42","烈焰大楼"],["#182844","#536b98","#384e72","#ff477e","终极高塔"]
];
const gear=[
 {type:"帽子",items:[["无帽",0,""],["棒球帽",90,"🧢"],["王冠",180,"👑"],["巫师帽",220,"🧙"],["皇冠头盔",260,"⛑️"],["猫耳发箍",150,"🐱"],["牛仔帽",170,"🤠"],["恶魔角",210,"😈"],["兔耳朵",190,"🐰"],["圣诞帽",130,"🎅"],["耳机",160,"🎧"],["皇冠发光款",280,"💫"],["熊猫帽",190,"🐼"],["海盗帽",230,"🏴‍☠️"],["星星发夹",120,"⭐"],["厨师帽",150,"👨‍🍳"]]},
 {type:"衣服",items:[["基础上衣",0,""],["机能夹克",120,"🧥"],["忍者服",200,"🥷"],["宇航服",260,"🚀"],["超级英雄",280,"🦸"],["恐龙连帽衫",230,"🦖"],["披风",210,"🦸‍♂️"],["彩虹卫衣",180,"🌈"],["潜水服",240,"🤿"],["机甲战衣",300,"🤖"],["太空制服",260,"👨‍🚀"],["火焰外套",220,"🔥"],["毛绒熊外套",240,"🧸"],["闪电战衣",290,"⚡"],["海盗披肩",210,"🏴‍☠️"]]},
 {type:"裤子",items:[["基础长裤",0,""],["运动裤",100,"👖"],["迷彩裤",170,"🪖"],["黄金裤",240,"✨"],["短裤",90,"🩳"],["星空长裤",210,"🌌"],["忍者裤",190,"🥷"],["彩虹短裤",150,"🌈"],["牛仔裤",180,"👖"],["金色护腿",260,"🦿"],["星际裤",230,"🌠"]]},
 {type:"鞋子",items:[["基础鞋",0,""],["跑鞋",110,"👟"],["火焰靴",190,"🔥"],["喷气靴",280,"🚀"],["滑板鞋",170,"🛹"],["弹簧鞋",220,"🌀"],["水晶鞋",250,"💎"],["彩虹滑轮鞋",230,"🛼"],["火箭鞋",300,"🚀"],["熊猫拖鞋",130,"🐼"],["闪电跑鞋",260,"⚡"],["月光靴",280,"🌙"]]}
];
const skins=[{name:"经典黑",color:"#172238"},{name:"霓虹蓝",color:"#23c9ff"},{name:"烈焰红",color:"#ff594f"},{name:"黄金",color:"#ffc83d"},{name:"森林绿",color:"#48d597"},{name:"紫色",color:"#bd83ff"}];
function loadSave(){try{const old=JSON.parse(localStorage.getItem("stickmanObbySave")||"{}");return {gems:Number(old.gems)||0,unlocked:Math.max(1,Math.min(100,Number(old.unlocked)||1)),claimed:Array.isArray(old.claimed)?old.claimed:[],owned:old.owned&& !Array.isArray(old.owned)?old.owned:(old.gearOwned||{}),equipped:old.equipped||old.gearEquipped||{},skin:Number(old.skin)||0,battleWeapons:Array.isArray(old.battleWeapons)?old.battleWeapons:["突击步枪"]};}catch(e){return {gems:0,unlocked:1,claimed:[],owned:{},equipped:{},skin:0};}}
let save=loadSave();if(!Array.isArray(save.battleWeapons))save.battleWeapons=["突击步枪"];for(const g of gear){if(!Array.isArray(save.owned[g.type]))save.owned[g.type]=[0];if(!Number.isInteger(save.equipped[g.type]))save.equipped[g.type]=0;}
function persist(){try{localStorage.setItem("stickmanObbySave",JSON.stringify(save));}catch(e){message.textContent="浏览器无法保存进度，请检查存储设置。";}updateLabels();}
function updateLabels(){gemLabel.textContent="💎 "+save.gems+" 宝石";levelLabel.textContent="关卡 "+(level||1)+" / 100";}
let level=1,world=null,p=null,camera=0,clock=0,mode="menu",won=false,deaths=0,checkpointX=55,checkpointY=382,shopTab="帽子",countdownUntil=0;
let raceBots=[],raceTrail=[],raceStartAt=0,raceMapIndex=0,raceElapsed=0,raceFinished=false,raceDifficulty="中等",raceLocked=false;
let battleDifficulty="中等",battleActors=[],battleBullets=[],battleScore={blue:0,red:0},battleWeapon="突击步枪",battleFireCooldown=0;
const battleGuns=[{name:"突击步枪",cost:0,damage:25},{name:"狙击枪",cost:300,damage:100},{name:"射手步枪",cost:220,damage:48},{name:"冲锋枪",cost:180,damage:14},{name:"现代步枪",cost:420,damage:32}];
function showBattleMenu(){mode="battlemenu";overlay.style.display="flex";overlay.innerHTML='<div class="panel"><h1>团队枪战</h1><p>💎 '+save.gems+'</p><p>难度：'+["简单","中等","困难","超困难"].map(d=>'<button data-d="'+d+'">'+d+'</button>').join("")+'</p><div class="cards">'+battleGuns.map(w=>'<div class="item"><b>'+w.name+'</b><p>'+(save.battleWeapons.includes(w.name)?"已拥有":w.cost+" 💎")+'</p><button data-w="'+w.name+'">'+(save.battleWeapons.includes(w.name)?"装备":"购买")+'</button></div>').join("")+'</div><p>先拿到 60 分的队伍获胜！</p><button id="bs">开始枪战</button><button id="bh">返回</button></div>';overlay.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{battleDifficulty=b.dataset.d;showBattleMenu();});overlay.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{let w=battleGuns.find(x=>x.name===b.dataset.w);if(!save.battleWeapons.includes(w.name)&&save.gems>=w.cost){save.gems-=w.cost;save.battleWeapons.push(w.name);persist();}if(save.battleWeapons.includes(w.name))battleWeapon=w.name;showBattleMenu();});document.getElementById("bs").onclick=startBattle;document.getElementById("bh").onclick=showHome;}
const battleStats={
 "突击步枪":{damage:22,rate:13,speed:9,range:520,color:"#ffe28a"},
 "狙击枪":{damage:65,rate:52,speed:15,range:760,color:"#ff9c69"},
 "射手步枪":{damage:38,rate:27,speed:12,range:650,color:"#a8f0ff"},
 "冲锋枪":{damage:12,rate:5,speed:10,range:380,color:"#ffe28a"},
 "现代步枪":{damage:27,rate:10,speed:11,range:560,color:"#c8ff9c"}
};
const BATTLE_WORLD_W=1800;
const battleArena=[
 {x:145,y:115,w:150,h:78,type:"house"},{x:665,y:112,w:150,h:82,type:"house"},
 {x:420,y:82,w:115,h:58,type:"wall"},{x:350,y:260,w:90,h:38,type:"cover"},
 {x:535,y:255,w:90,h:38,type:"cover"},{x:190,y:345,w:130,h:32,type:"cover"},
 {x:650,y:345,w:130,h:32,type:"cover"},{x:450,y:405,w:60,h:38,type:"crate"},
 {x:55,y:235,w:70,h:42,type:"crate"},{x:835,y:235,w:70,h:42,type:"crate"},
 {x:1040,y:115,w:150,h:78,type:"house"},{x:1450,y:112,w:150,h:82,type:"house"},
 {x:1240,y:260,w:110,h:38,type:"cover"},{x:1550,y:345,w:130,h:32,type:"cover"}
];
const battleLoadouts=["突击步枪","狙击枪","冲锋枪","射手步枪","现代步枪"];
function startBattle(){
 mode="battle";overlay.style.display="none";battleScore={blue:0,red:0};battleBullets=[];battleFireCooldown=0;
 const make=(name,team,x,y,weapon,player=false)=>({name,team,x,y,hp:100,maxHp:100,weapon,player,fire:Math.floor(Math.random()*20),dir:team==="blue"?1:-1,aimDir:team==="blue"?1:-1,jumpZ:0,jumpV:0,jumpHeld:false,respawn:0,strafe:Math.random()<.5?-1:1});
 battleActors=[
  make("你","blue",85,280,battleWeapon,true),
  make("蓝队·突击手","blue",115,390,"突击步枪"),
  make("蓝队·狙击手","blue",220,210,"狙击枪"),
  make("红队·冲锋手","red",1690,280,"冲锋枪"),
  make("红队·精准射手","red",1600,390,"射手步枪"),
  make("红队·重装兵","red",1510,210,"现代步枪")
 ];
 message.textContent="WASD/方向键移动 · 空格或↑跳跃躲子弹 · 自动瞄准射击！";
}
function battleBlocked(x,y,r=12){return battleArena.some(o=>x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h);}
function battleMove(a,dx,dy){
 const nx=Math.max(28,Math.min(BATTLE_WORLD_W-28,a.x+dx)),ny=Math.max(90,Math.min(455,a.y+dy));
 if(!battleBlocked(nx,a.y))a.x=nx;
 if(!battleBlocked(a.x,ny))a.y=ny;
}
function battleShoot(a,target){
 const st=battleStats[a.weapon]||battleStats["突击步枪"],dx=target.x-a.x,dy=(target.y-24-(target.jumpZ||0))-(a.y-24-(a.jumpZ||0)),d=Math.hypot(dx,dy)||1;
 a.aimDir=dx>=0?1:-1;
 battleBullets.push({x:a.x+(a.aimDir>0?13:-13),y:a.y-24-(a.jumpZ||0),vx:dx/d*st.speed,vy:dy/d*st.speed,team:a.team,owner:a,life:Math.ceil(st.range/st.speed),damage:st.damage,color:st.color});
 a.fire=st.rate;
}
function updateBattle(){
 const difficulty={"简单":.72,"中等":.9,"困难":1.08,"超困难":1.22}[battleDifficulty]||.9;
 for(const a of battleActors){
  if(a.respawn>0){a.respawn--;continue;}
  if(a.player){
   const dx=(keys.ArrowRight||keys.d||keys.D?1:0)-(keys.ArrowLeft||keys.a||keys.A?1:0);
   const dy=(keys.ArrowDown||keys.s||keys.S?1:0)-(keys.ArrowUp||keys.w||keys.W?1:0);
   const n=Math.hypot(dx,dy)||1;battleMove(a,dx/n*4.1,dy/n*4.1);
   const jumpKey=!!(keys[" "]||keys.ArrowUp||keys.w||keys.W);
   if(jumpKey&&!a.jumpHeld&&a.jumpZ===0&&a.jumpV===0)a.jumpV=-10.5;
   a.jumpHeld=jumpKey;
  }
  if(a.jumpV!==0||a.jumpZ>0){a.jumpZ+=a.jumpV;a.jumpV+=0.58;if(a.jumpZ<=0){a.jumpZ=0;a.jumpV=0;}}
  const foes=battleActors.filter(x=>x.team!==a.team&&x.hp>0&&!x.respawn);
  if(!foes.length)continue;
  const target=foes.reduce((best,x)=>Math.hypot(x.x-a.x,x.y-a.y)<Math.hypot(best.x-a.x,best.y-a.y)?x:best,foes[0]);
  const dx=target.x-a.x,dy=target.y-a.y,dist=Math.hypot(dx,dy)||1,st=battleStats[a.weapon]||battleStats["突击步枪"];
  if(!a.player){
   let mx=0,my=0;
   if(dist>st.range*.58){mx=dx/dist;my=dy/dist;}
   else if(dist<st.range*.24){mx=-dx/dist;my=-dy/dist;}
   else {mx=(-dy/dist)*a.strafe*.48;my=(dx/dist)*a.strafe*.48;}
   const speed=(a.weapon==="狙击枪"?1.55:2.15)*difficulty;
   battleMove(a,mx*speed,my*speed);
   if(battleBlocked(a.x+mx*18,a.y+my*18))a.strafe*=-1;
   if(Math.random()<.008)a.strafe*=-1;
  }
  if(a.fire>0)a.fire--;
  if(dist<st.range&&a.fire<=0){
   const chance=a.player?1:(.56*difficulty);
   if(Math.random()<chance)battleShoot(a,target);
   else a.fire=8;
  }
 }
 for(const b of battleBullets){
  b.x+=b.vx;b.y+=b.vy;b.life--;
  if(battleBlocked(b.x,b.y,3)){b.life=0;continue;}
  const hit=battleActors.find(a=>a.team!==b.team&&a.hp>0&&!a.respawn&&Math.hypot(a.x-b.x,a.y-24-(a.jumpZ||0)-b.y)<17);
  if(hit){
   hit.hp-=b.damage;b.life=0;
   if(hit.hp<=0){
    battleScore[b.team]++;
    hit.hp=0;hit.respawn=85;hit.x=hit.team==="blue"?85:1690;hit.y=280;
   }
  }
 }
 battleBullets=battleBullets.filter(b=>b.life>0&&b.x>0&&b.x<BATTLE_WORLD_W&&b.y>55&&b.y<H);
 if(battleScore.blue>=60||battleScore.red>=60){
  mode="battleover";overlay.style.display="flex";
  overlay.innerHTML='<div class="panel"><h1>'+(battleScore.blue>=60?"🏆 蓝队胜利！":"🔴 红队胜利！")+'</h1><p>最终比分：'+battleScore.blue+" : "+battleScore.red+'</p><p>先消灭对方 60 人，赢得比赛！</p><button id="ba">再来一局</button><button id="bh">返回首页</button></div>';
  document.getElementById("ba").onclick=startBattle;document.getElementById("bh").onclick=showHome;
 }
}
function drawBattleWeapon(a,x,y){
 const gun=a.weapon,metal="#263341",steel="#8798a8",dark="#111b27";
 ctx.save();ctx.translate(x+(a.aimDir<0?-7:7),y-27);ctx.scale(a.aimDir<0?-1:1,1);
 ctx.fillStyle=metal;ctx.strokeStyle=dark;ctx.lineWidth=1.5;
 if(gun==="狙击枪"){
  ctx.fillRect(0,-3,30,5);ctx.fillRect(26,-2,15,2);ctx.fillRect(8,-8,13,4);
  ctx.fillStyle="#42b8d8";ctx.fillRect(10,-9,10,3);ctx.fillStyle=steel;ctx.fillRect(3,2,7,3);
  ctx.fillStyle=dark;ctx.fillRect(11,2,4,9);ctx.fillRect(-5,-2,7,3);
 }else if(gun==="冲锋枪"){
  ctx.fillRect(0,-3,22,6);ctx.fillRect(19,-2,10,3);ctx.fillRect(4,-7,8,4);
  ctx.fillStyle=steel;ctx.fillRect(8,3,5,8);ctx.fillStyle=dark;ctx.fillRect(1,2,5,5);
 }else if(gun==="射手步枪"){
  ctx.fillRect(0,-3,27,5);ctx.fillRect(24,-2,12,2);ctx.fillRect(8,-8,11,3);
  ctx.fillStyle="#65b8d0";ctx.fillRect(10,-9,8,2);ctx.fillStyle=steel;ctx.fillRect(12,2,5,7);
  ctx.fillStyle=dark;ctx.fillRect(0,1,5,5);
 }else if(gun==="现代步枪"){
  ctx.fillRect(0,-3,25,6);ctx.fillRect(22,-2,10,3);ctx.fillRect(7,-8,12,4);
  ctx.fillStyle="#64b8a0";ctx.fillRect(9,-9,9,2);ctx.fillStyle=steel;ctx.fillRect(12,2,5,8);
  ctx.fillStyle=dark;ctx.fillRect(-5,-2,7,5);
 }else{
  ctx.fillRect(0,-3,24,6);ctx.fillRect(22,-2,10,3);ctx.fillRect(6,-8,11,4);
  ctx.fillStyle=steel;ctx.fillRect(12,2,5,8);ctx.fillStyle=dark;ctx.fillRect(-5,-2,7,5);
 }
 ctx.fillStyle="#d4e2ed";ctx.fillRect(2,-4,5,1);
 ctx.restore();
}
function drawBattleStick(a){
 const x=a.x,y=a.y-(a.jumpZ||0),blue=a.team==="blue",main=blue?"#168cff":"#f04455",dark=blue?"#0753a5":"#9f2034";
 ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
 // legs and boots
 ctx.strokeStyle="#202b3b";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-3,y-12);ctx.lineTo(x-9,y-2);ctx.lineTo(x-13,y);ctx.moveTo(x+3,y-12);ctx.lineTo(x+9,y-2);ctx.lineTo(x+13,y);ctx.stroke();
 // arms
 ctx.strokeStyle="#d7a77e";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-5,y-31);ctx.lineTo(x-14,y-22);ctx.lineTo(x-10,y-17);ctx.moveTo(x+5,y-31);ctx.lineTo(x+13,y-24);ctx.lineTo(x+17,y-27);ctx.stroke();
 // armored vest and body
 ctx.fillStyle=main;ctx.beginPath();ctx.roundRect(x-9,y-39,18,28,5);ctx.fill();
 ctx.fillStyle=dark;ctx.fillRect(x-7,y-34,14,17);ctx.fillStyle="#d9e3ee";ctx.fillRect(x-2,y-32,4,13);
 ctx.strokeStyle="#202b3b";ctx.lineWidth=2;ctx.strokeRect(x-9,y-39,18,28);
 // neck and head
 ctx.fillStyle="#d7a77e";ctx.fillRect(x-3,y-44,6,6);
 ctx.fillStyle="#e5b78d";ctx.beginPath();ctx.arc(x,y-51,8,0,Math.PI*2);ctx.fill();
 // helmet with brim and visor
 ctx.fillStyle=dark;ctx.beginPath();ctx.arc(x,y-53,9,Math.PI,Math.PI*2);ctx.lineTo(x+10,y-51);ctx.lineTo(x-10,y-51);ctx.closePath();ctx.fill();
 ctx.fillStyle="#d7e8f7";ctx.fillRect(x+1,y-53,5,2);
 // weapon model: every class has a visibly different silhouette
 drawBattleWeapon(a,x,y);
 ctx.restore();
 // health bar above each helmet
 const bw=38,bx=x-bw/2,by=y-70;
 ctx.fillStyle="#283244";ctx.fillRect(bx-1,by-1,bw+2,6);
 ctx.fillStyle=a.hp>55?"#35d477":a.hp>25?"#ffc247":"#ff4358";
 ctx.fillRect(bx,by,bw*Math.max(0,a.hp/a.maxHp),4);
 ctx.font="bold 10px sans-serif";ctx.textAlign="center";ctx.fillStyle="#172238";ctx.fillText(a.name+(a.player?"（你）":""),x,by-5);ctx.textAlign="left";
}
function drawBattle(){
 const me=battleActors[0],battleCamera=Math.max(0,Math.min(BATTLE_WORLD_W-W,me.x-W*.42));
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,"#b8d9ed");sky.addColorStop(1,"#d9e5c9");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 ctx.fillStyle="#a9b58c";ctx.fillRect(0,55,W,H-55);
 ctx.fillStyle="#c8b99b";ctx.fillRect(0,205,W,145);
 ctx.fillStyle="#9cae7d";for(let x=-(battleCamera%48);x<W;x+=48)ctx.fillRect(x,55,2,H-55);
 battleArena.forEach(o=>{
  const ox=o.x-battleCamera;if(ox+o.w<0||ox>W)return;
  if(o.type==="house"){
   ctx.fillStyle="#7e8995";ctx.fillRect(ox,o.y,o.w,o.h);
   ctx.fillStyle="#a94f46";ctx.beginPath();ctx.moveTo(ox-8,o.y);ctx.lineTo(ox+o.w/2,o.y-35);ctx.lineTo(ox+o.w+8,o.y);ctx.closePath();ctx.fill();
   ctx.fillStyle="#d6e4eb";ctx.fillRect(ox+18,o.y+18,28,24);ctx.fillRect(ox+o.w-46,o.y+18,28,24);
   ctx.fillStyle="#594b42";ctx.fillRect(ox+o.w/2-13,o.y+40,26,38);
  }else{
   ctx.fillStyle=o.type==="cover"?"#6c806e":"#9b805d";ctx.fillRect(ox,o.y,o.w,o.h);
   ctx.fillStyle="#d4d0b5";ctx.fillRect(ox,o.y,o.w,5);ctx.strokeStyle="#56665a";ctx.strokeRect(ox,o.y,o.w,o.h);
  }
 });
 ctx.fillStyle="#18263ddd";ctx.fillRect(W/2-190,10,380,42);
 ctx.fillStyle="#55aaff";ctx.font="bold 22px sans-serif";ctx.fillText("蓝队  "+battleScore.blue,W/2-168,39);
 ctx.fillStyle="#fff";ctx.font="bold 18px sans-serif";ctx.fillText("先到 60 分获胜",W/2-45,37);
 ctx.fillStyle="#ff6873";ctx.font="bold 22px sans-serif";ctx.fillText(battleScore.red+"  红队",W/2+82,39);
 ctx.font="12px sans-serif";ctx.fillStyle="#26354a";ctx.fillText("WASD 移动 · 空格/↑ 跳跃（可躲子弹） · 自动瞄准射击",18,H-14);
 battleBullets.forEach(b=>{const bx=b.x-battleCamera;if(bx<-5||bx>W+5)return;ctx.fillStyle=b.color;ctx.shadowColor=b.color;ctx.shadowBlur=9;ctx.beginPath();ctx.arc(bx,b.y,3.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;});
 battleActors.forEach(a=>{if(a.x-battleCamera<-50||a.x-battleCamera>W+50)return;const oldX=a.x;a.x-=battleCamera;if(!a.respawn)drawBattleStick(a);else{ctx.fillStyle="#fff";ctx.font="11px sans-serif";ctx.fillText("复活中",a.x-18,a.y-25);}a.x=oldX;});
}
const raceDifficultySpeeds={"简单":[4.8,5.2,5.6],"中等":[6.2,6.7,7.2],"困难":[7.8,8.3,8.8],"超困难":[9.2,9.8,10.4]};
const raceMaps=["霓虹疾速城","云端冲刺塔","熔岩边缘赛道","冰晶闪电道"];
function raceRecords(){try{return JSON.parse(localStorage.getItem("stickmanRaceRecords")||"[]");}catch(e){return [];}}
function saveRaceRecord(time,map){const a=raceRecords();a.push({time,map});a.sort((x,y)=>x.time-y.time);try{localStorage.setItem("stickmanRaceRecords",JSON.stringify(a.slice(0,20)));}catch(e){}}
function showRaceBoard(){const a=raceRecords();mode="raceboard";overlay.style.display="flex";overlay.innerHTML='<div class="panel"><h1>🌍 极速排行榜</h1><p>目前显示本机成绩；全球排名需要接入在线数据库。</p>'+(a.length?a.map((r,i)=>'<p>'+(i+1)+'. '+r.map+'　<strong>'+r.time.toFixed(2)+' 秒</strong></p>').join(""):'<p>还没有比赛记录。</p>')+'<div class="actions"><button id="boardBack">返回首页</button></div></div>';document.getElementById("boardBack").onclick=showHome;}
function startRace(index){
 raceMapIndex=index;level=1;
 const mapLooks=[
  {sky:"#101b48",sky2:"#5c3e9b",ground:"#263b70",lava:"#ff42d6",accent:"#39e7ff",label:"霓虹疾速城"},
  {sky:"#7bc9f4",sky2:"#e8f8ff",ground:"#e8f3ff",lava:"#7cbbd9",accent:"#ffffff",label:"云端冲刺塔"},
  {sky:"#571c19",sky2:"#f59a42",ground:"#60402f",lava:"#ff5b20",accent:"#ffd15c",label:"熔岩边缘赛道"},
  {sky:"#a6eaff",sky2:"#f4fdff",ground:"#8fc6df",lava:"#46bce8",accent:"#ffffff",label:"冰晶闪电道"}
 ];
 const look=mapLooks[index%4],length=3750;
 world={name:look.label,sky:look.sky,sky2:look.sky2,ground:look.ground,lavaColor:look.lava,
  platforms:[],lava:[],spikes:[],pads:[],checks:[],portals:[],bonusPlatforms:[],
  ladders:[{x:1190,y:285,h:145,from:430,to:285},{x:2440,y:140,h:145,from:285,to:140}],
  goal:{x:3570,y:110},length};
 const floors=[{start:0,end:1250,y:430},{start:1250,end:2500,y:285},{start:2500,end:length,y:140}];
 floors.forEach((f,fi)=>{
  // distinct platform rhythm for each course; gaps and raised stepping ledges are kept jumpable.
  const gapPattern=[
   [0,1,0,2,0,3,1,0,2,0,1,0],
   [2,0,1,0,3,0,0,2,0,3,0,1],
   [0,3,1,0,0,2,0,1,3,0,0,2],
   [1,0,3,0,1,0,2,0,0,3,2,0]
  ][index%4];
  const segment=100,platformWidths=[[91,78,88,72],[70,94,76,86],[84,68,96,74],[76,90,70,98]][index%4];
  for(let j=0;j<12;j++){
   const x=f.start+8+j*segment,variation=gapPattern[j];
   world.platforms.push({x,y:f.y-variation*20,w:platformWidths[j%4],h:18});
   // light, varied hazards rather than a wall of obstacles
   if((j+fi+index)%4===1)world.spikes.push({x:x+Math.min(platformWidths[j%4]-28,38),y:f.y-variation*20-15,w:22,h:15});
   if((j*2+fi+index)%7===3)world.lava.push({x:x+70,y:f.y+25,w:18,h:55});
  }
  world.platforms.push({x:f.end-12,y:f.y,w:20,h:100});
 });
 // Each map gets its own recognizable obstacle placement and decorative color treatment.
 world.raceAccent=look.accent;
 world.raceDecor=[
  {x:260,y:345,type:index===0?"neon":"tower"},
  {x:790,y:345,type:index===1?"cloud":"arch"},
  {x:1530,y:200,type:index===2?"volcano":"arch"},
  {x:2850,y:65,type:index===3?"crystal":"tower"}
 ];
 // Add a few route-specific jump obstacles and spring pads.
 const obstacleSets=[
  [520,970,1710,2180,3020],
  [350,1120,1580,2070,2910,3330],
  [430,880,1460,1950,2730,3240],
  [610,1040,1660,2280,2810,3420]
 ];
 obstacleSets[index%4].forEach((x,i)=>{
  const tier=x<1250?0:x<2500?1:2,y=[430,285,140][tier];
  world.spikes.push({x,y:y-16,w:28,h:16});
  if(i%2===1)world.pads.push({x:x+85,y:y-12,w:34,h:12});
 });
 p={x:55,y:382,vx:0,vy:0,w:24,h:48,on:false,jumps:0,sliding:0,slideTimer:0,slideCooldown:0,climbing:false,portalCooldown:0};
 camera=0;checkpointX=55;checkpointY=382;won=false;raceFinished=false;raceLocked=true;
 countdownUntil=Date.now()+3000;raceStartAt=countdownUntil;raceElapsed=0;raceTrail=[];
 const speeds=raceDifficultySpeeds[raceDifficulty]||raceDifficultySpeeds["中等"];
 raceBots=[{name:"AI 小闪",x:55,y:382,speed:speeds[0],color:"#ff5b72",trail:[]},{name:"AI 蓝电",x:55,y:382,speed:speeds[1],color:"#41d9ff",trail:[]},{name:"AI 星火",x:55,y:382,speed:speeds[2],color:"#ffd45b",trail:[]}];
 mode="race";overlay.style.display="none";message.textContent="赛道已加长！注意躲避障碍，冲向终点！";updateLabels();
}
function showRaceMenu(){mode="racemenu";overlay.style.display="flex";overlay.innerHTML='<div class="panel"><h1>⚡ 极速竞赛</h1><p>你和 3 名 AI 同时起跑。双倍速度、二段跳、不能滑铲，先碰到旗子的人获胜！</p><p><strong>选择 AI 难度：</strong></p><div class="actions">'+["简单","中等","困难","超困难"].map(d=>'<button class="'+(raceDifficulty===d?"gold":"alt")+'" data-difficulty="'+d+'">'+d+'</button>').join("")+'</div><p>当前难度：'+raceDifficulty+'</p><div class="cards">'+raceMaps.map((m,i)=>'<div class="item"><div class="preview">'+["🌆","☁️","🌋","❄️"][i]+'</div><b>'+m+'</b><button data-map="'+i+'">开始比赛</button></div>').join("")+'</div><div class="actions"><button class="alt" id="raceBack">返回首页</button><button class="alt" id="raceBoard">排行榜</button></div></div>';overlay.querySelectorAll("[data-map]").forEach(b=>b.onclick=()=>startRace(Number(b.dataset.map)));overlay.querySelectorAll("[data-difficulty]").forEach(b=>b.onclick=()=>{raceDifficulty=b.dataset.difficulty;showRaceMenu();});document.getElementById("raceBack").onclick=showHome;document.getElementById("raceBoard").onclick=showRaceBoard;}
function finishRace(playerWon,winner){if(raceFinished)return;raceFinished=true;raceElapsed=(Date.now()-raceStartAt)/1000;if(playerWon)saveRaceRecord(raceElapsed,world.name);mode="raceover";overlay.style.display="flex";overlay.innerHTML='<div class="panel"><h1>'+(playerWon?"🏆 你赢了！":"⚡ 比赛结束")+'</h1><p>'+(playerWon?"你第一个碰到终点旗子！":winner+" 抢先碰到旗子！")+'</p><p style="font-size:28px;color:#ffdc70">你的时间：'+raceElapsed.toFixed(2)+' 秒</p><div class="actions"><button id="raceAgain">再比一次</button><button class="alt" id="raceRanks">排行榜</button><button class="alt" id="raceHome">首页</button></div></div>';document.getElementById("raceAgain").onclick=()=>startRace(raceMapIndex);document.getElementById("raceRanks").onclick=showRaceBoard;document.getElementById("raceHome").onclick=showHome;}
const keys=Object.create(null);
function makeLevel(n){
 const idx=n-1,t=themes[idx%10],platforms=[],lava=[],pads=[],checks=[],ladders=[],spikes=[],portals=[],bonusPlatforms=[];
 const floors=[{y:430,start:0,end:850},{y:285,start:850,end:1680},{y:140,start:1680,end:2510}];
 floors.forEach((f,fi)=>{
  platforms.push({x:f.start,y:f.y,w:150,h:100});
  const count=5+(idx%3),span=f.end-f.start-300,step=span/count;
  for(let i=0;i<count;i++){
   const gap=24+((idx*7+i*13+fi*11)%25),x=f.start+150+i*step+gap,w=Math.max(75,step-gap-18),py=f.y+(((idx+i*3+fi)%3)-1)*7;
   platforms.push({x,y:py,w,h:18});
   if((i+idx+fi)%3===1)lava.push({x:x-gap,y:f.y+28,w:Math.max(18,gap-4),h:72});
   if((i+idx+fi)%4===0)pads.push({x:x+w*.45,y:py-12,w:34,h:12});
   if(i===Math.floor(count/2))checks.push({x:x+w*.5,y:py-50,hit:false});
   if(i===1+(idx%Math.max(2,count-2)))spikes.push({x:x+w*.48,y:py-16,w:34,h:16});
  }
  platforms.push({x:f.end-150,y:f.y,w:150,h:100});
  const bx=f.start+Math.floor((f.end-f.start)*.53);bonusPlatforms.push({x:bx,y:f.y-165,w:124,h:14,glow:true,doubleJump:true});
 });
 ladders.push({x:810,y:285,h:145,from:430,to:285},{x:1640,y:140,h:145,from:285,to:140});
 // 四个传送门：前两个在一楼互通，后两个在二楼互通，不会跳过爬上三楼的最终路线。
 portals.push(
  {x:200,y:372,w:34,h:58,toX:700}, {x:700,y:372,w:34,h:58,toX:200},
  {x:900,y:227,w:34,h:58,toX:1530}, {x:1530,y:227,w:34,h:58,toX:900}
 );
 const goal={x:2440,y:110};
 return {name:t[4]+" "+n,sky:t[0],sky2:t[1],ground:t[2],lavaColor:t[3],platforms,lava,pads,checks,ladders,spikes,portals,bonusPlatforms,goal,length:2700};
}
function setLevel(n){level=Math.max(1,Math.min(100,n));world=makeLevel(level);p={x:55,y:382,vx:0,vy:0,w:24,h:48,on:false,jumps:0,sliding:0,slideTimer:0,slideCooldown:0,climbing:false,portalCooldown:0};camera=0;checkpointX=55;checkpointY=382;deaths=0;won=false;mode="game";countdownUntil=0;overlay.style.display="none";message.textContent="开始闯关！";updateLabels();}
function showHome(){mode="menu";overlay.style.display="flex";overlay.innerHTML='<div class="panel"><h1>STICKMAN OBBY</h1><p>🏁 100 个关卡 · 🏢 三层大楼 · 🪜 梯子 · 🌀 传送门</p><p>已解锁第 '+save.unlocked+' 关　　💎 '+save.gems+' 宝石</p><div class="actions"><button class="gold" id="battleBtn">🔫 团队枪战（蓝队 vs 红队）</button><button class="gold" id="raceBtn">⚡ 极速竞赛</button><button id="playBtn">🏁 经典模式（第 '+save.unlocked+' 关）</button><button class="alt" id="shopBtn">💎 装备商店</button><button class="alt" id="leaderBtn">🌍 排行榜</button></div><p>经典模式：← → 移动，空格 / ↑ 二段跳和爬梯，C 滑铲。</p></div>';document.getElementById("playBtn").onclick=()=>setLevel(save.unlocked);document.getElementById("shopBtn").onclick=showShop;document.getElementById("raceBtn").onclick=showRaceMenu;document.getElementById("battleBtn").onclick=showBattleMenu;document.getElementById("leaderBtn").onclick=showRaceBoard;}
function showShop(){mode="shop";overlay.style.display="flex";const cat=gear.find(g=>g.type===shopTab)||gear[0];const tabs=gear.map(g=>'<button class="'+(g.type===shopTab?"":"alt")+'" data-tab="'+g.type+'">'+g.type+'</button>').join("");const cards=cat.items.map((it,i)=>{const own=save.owned[shopTab].includes(i),eq=save.equipped[shopTab]===i;return '<div class="item '+(eq?"selected":"")+'"><div class="preview">'+(it[2]||"🙂")+'</div><b>'+it[0]+'</b><small>'+(own?(eq?"正在穿戴":"已拥有"):it[1]+" 💎")+'</small><button data-item="'+i+'">'+(own?(eq?"穿戴中":"穿戴"):"购买")+'</button></div>';}).join("");overlay.innerHTML='<div class="panel"><h1>💎 装备商店</h1><p>余额：'+save.gems+' 宝石。装备购买后永久拥有。</p><div class="tabs">'+tabs+'</div><div class="cards">'+cards+'</div><div class="actions"><button class="alt" id="backBtn">返回首页</button></div></div>';overlay.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{shopTab=b.dataset.tab;showShop();});overlay.querySelectorAll("[data-item]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.item),it=cat.items[i];if(!save.owned[shopTab].includes(i)){if(save.gems<it[1]){message.textContent="宝石不足！通关可以获得宝石。";return;}save.gems-=it[1];save.owned[shopTab].push(i);}save.equipped[shopTab]=i;persist();showShop();});document.getElementById("backBtn").onclick=showHome;}
function completeLevel(){if(won)return;won=true;mode="won";if(!save.claimed.includes(level)){save.gems+=10;save.claimed.push(level);}save.unlocked=Math.max(save.unlocked,Math.min(100,level+1));persist();overlay.style.display="flex";overlay.innerHTML='<div class="panel"><h1>🏆 关卡完成！</h1><p>'+world.name+' 挑战成功！</p><p style="font-size:26px;color:#ffdc70">+10 💎 宝石</p><p>当前余额：'+save.gems+'</p><div class="actions"><button id="nextBtn">'+(level===100?"返回首页":"下一关 →")+'</button><button class="alt" id="againBtn">重玩本关</button><button class="alt" id="home2">首页</button></div></div>';document.getElementById("nextBtn").onclick=()=>level===100?showHome():setLevel(level+1);document.getElementById("againBtn").onclick=()=>setLevel(level);document.getElementById("home2").onclick=showHome;message.textContent="通关奖励已领取！";}
function respawn(){deaths++;p.x=checkpointX;p.y=checkpointY;p.vx=0;p.vy=0;p.jumps=0;p.sliding=0;p.slideTimer=0;p.climbing=false;camera=Math.max(0,Math.min(world.length-W,p.x-300));message.textContent="回到检查点。失误："+deaths;}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x-camera,y,w,h);}
function drawStick(){const x=p.x-camera+12,y=p.y,skin=skins[save.skin]||skins[0],slide=p.sliding>0,phase=clock*.22,leg=p.on?Math.sin(phase)*.75:0,arm=p.on?Math.cos(phase)*.55:-.3;if(mode==="race"){for(let i=0;i<7;i++){ctx.globalAlpha=(7-i)/18;ctx.fillStyle="#9b72ff";ctx.beginPath();ctx.arc(x-(i+1)*5,y+23,3+(7-i)*.35,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}ctx.strokeStyle=skin.color;ctx.lineWidth=3;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();ctx.arc(x,y+8,8,0,Math.PI*2);ctx.moveTo(x,y+17);ctx.lineTo(x,y+33);ctx.stroke();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x-3,y+7,1.7,0,Math.PI*2);ctx.arc(x+3,y+7,1.7,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#172238";ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(x,y+11,2.6,0.15,Math.PI-.15);ctx.stroke();ctx.strokeStyle=skin.color;ctx.lineWidth=2.6;ctx.beginPath();if(slide){ctx.moveTo(x,y+26);ctx.lineTo(x+13,y+40);ctx.lineTo(x+24,y+43);ctx.moveTo(x,y+26);ctx.lineTo(x-12,y+40);ctx.lineTo(x-22,y+43);}else{ctx.moveTo(x,y+21);ctx.lineTo(x-9+arm*5,y+27);ctx.lineTo(x-13+arm*8,y+34);ctx.moveTo(x,y+21);ctx.lineTo(x+9-arm*5,y+27);ctx.lineTo(x+13-arm*8,y+34);ctx.moveTo(x,y+33);ctx.lineTo(x-8+leg*9,y+47);ctx.moveTo(x,y+33);ctx.lineTo(x+8-leg*9,y+47);}ctx.stroke();const hat=gear[0].items[save.equipped["帽子"]],shirt=gear[1].items[save.equipped["衣服"]],pants=gear[2].items[save.equipped["裤子"]],shoes=gear[3].items[save.equipped["鞋子"]];ctx.font="17px sans-serif";if(hat[2])ctx.fillText(hat[2],x-9,y+1);if(shirt[2])ctx.fillText(shirt[2],x-9,y+30);if(pants[2])ctx.fillText(pants[2],x-8,y+45);if(shoes[2])ctx.fillText(shoes[2],x-10,y+54);}
function draw(){if(!world){ctx.fillStyle="#15263d";ctx.fillRect(0,0,W,H);return;}const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,world.sky);g.addColorStop(1,world.sky2);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.globalAlpha=.22;for(let i=0;i<12;i++){const xx=((i*170-camera*.2)%(W+180)+W+180)%(W+180)-70;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(xx,75+(i%4)*42,25,0,7);ctx.fill();}ctx.globalAlpha=1;world.platforms.forEach(q=>{rect(q.x,q.y,q.w,q.h,world.ground);rect(q.x,q.y,q.w,5,"#ffffff77");});
 if(mode==="race"&&world.raceDecor){world.raceDecor.forEach(o=>{const x=o.x-camera;if(x<-80||x>W+80)return;ctx.save();ctx.fillStyle=world.raceAccent||"#fff";ctx.globalAlpha=.72;if(o.type==="cloud"){ctx.beginPath();ctx.arc(x,100,34,0,Math.PI*2);ctx.arc(x+30,95,26,0,Math.PI*2);ctx.fill();}else if(o.type==="crystal"){ctx.beginPath();ctx.moveTo(x,130);ctx.lineTo(x+30,40);ctx.lineTo(x+65,130);ctx.closePath();ctx.fill();}else if(o.type==="volcano"){ctx.beginPath();ctx.moveTo(x-20,180);ctx.lineTo(x+30,75);ctx.lineTo(x+90,180);ctx.closePath();ctx.fill();}else{ctx.fillRect(x,145,20,130);ctx.fillRect(x+38,110,18,165);ctx.fillRect(x+70,165,20,110);}ctx.restore();});}

 [["一楼 · 1F",90,430],["二楼 · 2F",940,285],["三楼 · 3F",1770,140]].forEach(a=>{ctx.fillStyle="#ffffffcc";ctx.font="bold 15px sans-serif";ctx.fillText(a[0],a[1]-camera,a[2]-18);});world.lava.forEach(q=>{rect(q.x,q.y,q.w,q.h,world.lavaColor);rect(q.x,q.y,q.w,6,"#ffd166");});world.pads.forEach(q=>{rect(q.x,q.y,q.w,q.h,"#ffcf58");rect(q.x+4,q.y+2,q.w-8,4,"#fff2a8");});world.bonusPlatforms.forEach(q=>{rect(q.x,q.y,q.w,q.h,"#b8a5ff");rect(q.x,q.y,q.w,4,"#fff");ctx.fillStyle="#fff";ctx.font="bold 12px sans-serif";ctx.fillText("二段跳平台",q.x-camera+8,q.y-7);});world.spikes.forEach(q=>{ctx.fillStyle="#f4f7ff";ctx.beginPath();ctx.moveTo(q.x-camera,q.y+q.h);ctx.lineTo(q.x-camera+q.w/2,q.y);ctx.lineTo(q.x-camera+q.w,q.y+q.h);ctx.closePath();ctx.fill();ctx.strokeStyle="#d94b61";ctx.stroke();});world.portals.forEach((q,i)=>{ctx.save();ctx.shadowColor=i%2?"#42e7ff":"#d77bff";ctx.shadowBlur=16;ctx.strokeStyle=i%2?"#42e7ff":"#d77bff";ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(q.x-camera+q.w/2,q.y+q.h/2,q.w/2,q.h/2,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#fff";ctx.font="bold 12px sans-serif";ctx.fillText("P"+(i+1),q.x-camera+8,q.y-7);ctx.restore();});world.ladders.forEach(l=>{rect(l.x,l.y,6,l.h,"#9b7046");rect(l.x+24,l.y,6,l.h,"#9b7046");for(let ry=l.y+8;ry<l.y+l.h;ry+=18)rect(l.x+5,ry,26,5,"#d9b17a");});world.checks.forEach(q=>{rect(q.x,q.y,5,52,"#26344b");rect(q.x+5,q.y,27,16,q.hit?"#39d5a4":"#ffcf58");});rect(world.goal.x,world.goal.y,5,75,"#26344b");rect(world.goal.x+5,world.goal.y,40,24,"#ffcf58");ctx.fillStyle="#172238";ctx.font="bold 14px sans-serif";ctx.fillText("FINISH",world.goal.x-camera-4,world.goal.y-10);if(mode==="race"){raceBots.forEach(b=>{b.trail.forEach(t=>{ctx.globalAlpha=t.life/16*.4;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(t.x-camera+12,t.y+22,4,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x-camera+12,b.y+8,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=b.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x-camera+12,b.y+17);ctx.lineTo(b.x-camera+12,b.y+33);ctx.moveTo(b.x-camera+12,b.y+33);ctx.lineTo(b.x-camera+5,b.y+47);ctx.moveTo(b.x-camera+12,b.y+33);ctx.lineTo(b.x-camera+19,b.y+47);ctx.stroke();ctx.font="bold 11px sans-serif";ctx.fillStyle="#172238";ctx.fillText(b.name,b.x-camera-8,b.y-8);});raceTrail.forEach(t=>{ctx.globalAlpha=t.life/18*.45;ctx.fillStyle="#9b72ff";ctx.beginPath();ctx.arc(t.x-camera+12,t.y,5,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;ctx.fillStyle="#172238";ctx.font="bold 17px sans-serif";ctx.fillText("⚡ "+raceElapsed.toFixed(2)+"s",W-125,34);}drawStick();if(mode==="race"&&countdownUntil>Date.now()){const left=Math.ceil((countdownUntil-Date.now())/1000);ctx.save();ctx.fillStyle="#14243ddd";ctx.fillRect(W/2-95,H/2-85,190,170);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="bold 24px sans-serif";ctx.fillText("准备开始",W/2,H/2-35);ctx.font="bold 76px sans-serif";ctx.fillStyle="#ffdc70";ctx.fillText(String(left),W/2,H/2+55);ctx.restore();}if(mode==="race"){ctx.fillStyle="#fff";ctx.font="bold 12px sans-serif";ctx.fillText("极速竞赛 · 双倍速度 · 禁止滑铲",W/2-115,25);}ctx.fillStyle="#172238aa";ctx.fillRect(18,18,190,38);ctx.fillStyle="#fff";ctx.font="bold 16px sans-serif";ctx.fillText("LEVEL "+level+" · "+world.name,30,43);}
function update(){
 clock++;
 if(mode==="battle"){updateBattle();drawBattle();requestAnimationFrame(update);return;}
 if(mode==="race"&&raceLocked){if(Date.now()<countdownUntil){p.vx=0;p.vy=0;["ArrowLeft","ArrowRight","ArrowUp"," ","a","A","d","D","w","W","c","C"].forEach(k=>keys[k]=false);keys._jumpLock=false;keys._slideLock=false;draw();requestAnimationFrame(update);return;}raceLocked=false;p.vx=0;p.vy=0;keys._jumpLock=false;keys._slideLock=false;}
 if((mode==="game"||mode==="race")&&!won){
  const dir=(keys.ArrowRight||keys.d||keys.D?1:0)-(keys.ArrowLeft||keys.a||keys.A?1:0);
  if(p.slideCooldown>0)p.slideCooldown--;
  if(p.portalCooldown>0)p.portalCooldown--;
  if(p.slideTimer>0)p.slideTimer--;
  const slideKey=mode!=="race"&&!!(keys.c||keys.C);
  if(slideKey&&!keys._slideLock&&p.slideCooldown===0&&!p.climbing){p.slideTimer=24;p.slideCooldown=60;keys._slideLock=true;}
  if(!slideKey)keys._slideLock=false;
  p.sliding=p.slideTimer>0?1:0;
  const ladder=world.ladders.find(l=>p.x+p.w>l.x-10&&p.x<l.x+38&&p.y<=l.from+5&&p.y+p.h>=l.to-5);
  const climbKey=!!(keys.ArrowUp||keys.w||keys.W);
  if(ladder&&climbKey){p.climbing=true;p.vy=0;p.y=Math.max(ladder.to-p.h,Math.min(ladder.from-p.h,p.y-3.2));p.x=ladder.x+5;p.on=false;}
  else if(p.climbing&&(!climbKey||(ladder&&p.y<=ladder.to-p.h+1&&dir!==0)))p.climbing=false;
  if(!p.climbing){
   p.vx=dir*(mode==="race"?8.5:(p.sliding?6.2:4.25));p.x=Math.max(0,p.x+p.vx);
   const oldY=p.y;p.vy=Math.min(14,p.vy+.62);p.y+=p.vy;p.on=false;
   for(const q of world.platforms){if(p.x+p.w>q.x&&p.x<q.x+q.w&&oldY+p.h<=q.y+7&&p.y+p.h>=q.y&&p.vy>=0){p.y=q.y-p.h;p.vy=0;p.on=true;p.jumps=0;}}
   const jp=!!(keys[" "]||keys.ArrowUp||keys.w||keys.W);
   if(jp&&!keys._jumpLock&&p.jumps<2){p.vy=p.jumps===0?-12.8:-11.5;p.jumps++;p.on=false;keys._jumpLock=true;}
   if(!jp)keys._jumpLock=false;
  }
  for(const q of world.spikes){if(p.x+p.w>q.x+4&&p.x<q.x+q.w-4&&p.y+p.h>q.y+4&&p.y+p.h<q.y+q.h+34){respawn();break;}}
  if(p.portalCooldown===0){const gate=world.portals.find(q=>p.x+p.w>q.x&&p.x<q.x+q.w&&p.y+p.h>q.y&&p.y<q.y+q.h);if(gate){p.x=gate.toX+42;p.y=gate.y+gate.h-p.h;p.vy=0;p.portalCooldown=45;message.textContent="传送门启动！";}}
  for(const q of world.pads){if(p.x+p.w>q.x&&p.x<q.x+q.w&&p.y+p.h>=q.y&&p.y+p.h<q.y+22&&p.vy>=0){p.y=q.y-p.h;p.vy=-19.5;p.on=false;p.jumps=1;}}
  for(const q of world.lava){if(p.x+p.w>q.x&&p.x<q.x+q.w&&p.y+p.h>q.y+3){respawn();break;}}
  if(p.y>H+90)respawn();
  world.checks.forEach(q=>{if(!q.hit&&p.x+p.w>q.x-8&&p.x<q.x+34&&p.y+p.h>q.y){q.hit=true;checkpointX=q.x+12;checkpointY=q.y+52-p.h-2;message.textContent="检查点已保存！";}});
  // 只有角色到达三楼旗子所在位置并碰到旗帜，才算本关完成。
  if(mode==="race"){raceElapsed=(Date.now()-raceStartAt)/1000;raceBots.forEach(b=>{if(b.x<world.goal.x+30){b.trail.push({x:b.x,y:b.y,life:16});if(b.trail.length>16)b.trail.shift();b.trail.forEach(t=>t.life--);b.trail=b.trail.filter(t=>t.life>0);b.x+=b.speed;b.y=b.x<1250?382:b.x<2500?237:92;}});raceTrail.push({x:p.x,y:p.y+22,life:18});if(raceTrail.length>22)raceTrail.shift();raceTrail.forEach(t=>t.life--);raceTrail=raceTrail.filter(t=>t.life>0);const winner=raceBots.find(b=>b.x>=world.goal.x);if(winner)finishRace(false,winner.name);else if(p.x+p.w>world.goal.x&&p.x<world.goal.x+46&&p.y<world.goal.y+75&&p.y+p.h>world.goal.y)finishRace(true,"你");}else if(p.x+p.w>world.goal.x&&p.x<world.goal.x+46&&p.y<world.goal.y+75&&p.y+p.h>world.goal.y)completeLevel();
  camera=Math.max(0,Math.min(world.length-W,p.x-300));
  message.textContent=mode==="race"?"比赛进行中！双倍速度 · 二段跳 · 禁止滑铲":(p.slideCooldown>0?"滑铲冷却："+(p.slideCooldown/60).toFixed(1)+" 秒":(p.climbing?"正在爬梯子":"滑铲就绪 · C 键滑铲"));
 }
 draw();requestAnimationFrame(update);
}
// 枪战自动锁定范围开火，不需要鼠标点击。
document.addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();keys[e.key]=true;});document.addEventListener("keyup",e=>keys[e.key]=false);
document.getElementById("playBtn").onclick=()=>setLevel(save.unlocked);document.getElementById("shopBtn").onclick=showShop;document.getElementById("homeBtn").onclick=showHome;document.getElementById("restartBtn").onclick=()=>{if(world)setLevel(level);};
function hold(id,key){const el=document.getElementById(id);el.addEventListener("pointerdown",e=>{e.preventDefault();keys[key]=true;});["pointerup","pointerleave","pointercancel"].forEach(t=>el.addEventListener(t,()=>keys[key]=false));}
hold("left","ArrowLeft");hold("right","ArrowRight");hold("jump","ArrowUp");hold("slide","c");
persist();showHome();update();
