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
 {type:"帽子",items:[["无帽",0,""],["棒球帽",90,"🧢"],["王冠",180,"👑"],["巫师帽",220,"🧙"],["皇冠头盔",260,"⛑️"],["猫耳发箍",150,"🐱"],["牛仔帽",170,"🤠"],["恶魔角",210,"😈"],["兔耳朵",190,"🐰"],["圣诞帽",130,"🎅"],["耳机",160,"🎧"]]},
 {type:"衣服",items:[["基础上衣",0,""],["机能夹克",120,"🧥"],["忍者服",200,"🥷"],["宇航服",260,"🚀"],["超级英雄",280,"🦸"],["恐龙连帽衫",230,"🦖"],["披风",210,"🦸‍♂️"],["彩虹卫衣",180,"🌈"],["潜水服",240,"🤿"],["机甲战衣",300,"🤖"]]},
 {type:"裤子",items:[["基础长裤",0,""],["运动裤",100,"👖"],["迷彩裤",170,"🪖"],["黄金裤",240,"✨"],["短裤",90,"🩳"],["星空长裤",210,"🌌"],["忍者裤",190,"🥷"]]},
 {type:"鞋子",items:[["基础鞋",0,""],["跑鞋",110,"👟"],["火焰靴",190,"🔥"],["喷气靴",280,"🚀"],["滑板鞋",170,"🛹"],["弹簧鞋",220,"🌀"],["水晶鞋",250,"💎"]]},
 {type:"武器",items:[["泡泡发射器",0,"🔫"],["彩虹激光枪",180,"🔫"],["星星发射器",240,"🌟"],["黄金水枪",200,"💦"],["冰冻发射器",280,"❄️"]]}
];
const skins=[{name:"经典黑",color:"#172238"},{name:"霓虹蓝",color:"#23c9ff"},{name:"烈焰红",color:"#ff594f"},{name:"黄金",color:"#ffc83d"},{name:"森林绿",color:"#48d597"},{name:"紫色",color:"#bd83ff"}];
function loadSave(){try{const old=JSON.parse(localStorage.getItem("stickmanObbySave")||"{}");return {gems:Number(old.gems)||0,unlocked:Math.max(1,Math.min(100,Number(old.unlocked)||1)),claimed:Array.isArray(old.claimed)?old.claimed:[],owned:old.owned&& !Array.isArray(old.owned)?old.owned:(old.gearOwned||{}),equipped:old.equipped||old.gearEquipped||{},skin:Number(old.skin)||0};}catch(e){return {gems:0,unlocked:1,claimed:[],owned:{},equipped:{},skin:0};}}
let save=loadSave();for(const g of gear){if(!Array.isArray(save.owned[g.type]))save.owned[g.type]=[0];if(!Number.isInteger(save.equipped[g.type]))save.equipped[g.type]=0;}
function persist(){try{localStorage.setItem("stickmanObbySave",JSON.stringify(save));}catch(e){message.textContent="浏览器无法保存进度，请检查存储设置。";}updateLabels();}
function updateLabels(){gemLabel.textContent="💎 "+save.gems+" 宝石";levelLabel.textContent="关卡 "+(level||1)+" / 100";}
let level=1,world=null,p=null,camera=0,clock=0,mode="menu",won=false,deaths=0,checkpointX=55,checkpointY=382,shopTab="帽子";
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
  const bx=f.start+Math.floor((f.end-f.start)*.53);bonusPlatforms.push({x:bx,y:f.y-155,w:112,h:14,glow:true});
 });
 ladders.push({x:810,y:285,h:145,from:430,to:285},{x:1640,y:140,h:145,from:285,to:140});
 const goal={x:2440,y:110};
 return {name:t[4]+" "+n,sky:t[0],sky2:t[1],ground:t[2],lavaColor:t[3],platforms,lava,pads,checks,ladders,spikes,portals,bonusPlatforms,goal,length:2700};
}
function setLevel(n){level=Math.max(1,Math.min(100,n));world=makeLevel(level);p={x:55,y:382,vx:0,vy:0,w:24,h:48,on:false,jumps:0,sliding:0,slideTimer:0,slideCooldown:0,climbing:false,portalCooldown:0};camera=0;checkpointX=55;checkpointY=382;deaths=0;won=false;mode="game";overlay.style.display="none";message.textContent=world.name+"：小心前方障碍！";updateLabels();}
function showHome(){mode="menu";overlay.style.display="flex";overlay.innerHTML='<div class="panel"><h1>STICKMAN OBBY</h1><p>🏁 100 个关卡 · 🏢 三层大楼 · 🪜 梯子 · 🌀 传送门 · ▲ 地刺</p><p>已解锁第 '+save.unlocked+' 关　　💎 '+save.gems+' 宝石</p><div class="actions"><button id="playBtn">继续冒险（第 '+save.unlocked+' 关）</button><button class="gold" id="shopBtn">💎 装备商店</button></div><p>← → / A D 移动，空格 / ↑ 二段跳和爬梯，C 滑铲（冷却 1 秒）。</p></div>';document.getElementById("playBtn").onclick=()=>setLevel(save.unlocked);document.getElementById("shopBtn").onclick=showShop;}
function showShop(){mode="shop";overlay.style.display="flex";const cat=gear.find(g=>g.type===shopTab)||gear[0];const tabs=gear.map(g=>'<button class="'+(g.type===shopTab?"":"alt")+'" data-tab="'+g.type+'">'+g.type+'</button>').join("");const cards=cat.items.map((it,i)=>{const own=save.owned[shopTab].includes(i),eq=save.equipped[shopTab]===i;return '<div class="item '+(eq?"selected":"")+'"><div class="preview">'+(it[2]||"🙂")+'</div><b>'+it[0]+'</b><small>'+(own?(eq?"正在穿戴":"已拥有"):it[1]+" 💎")+'</small><button data-item="'+i+'">'+(own?(eq?"穿戴中":"穿戴"):"购买")+'</button></div>';}).join("");overlay.innerHTML='<div class="panel"><h1>💎 装备商店</h1><p>余额：'+save.gems+' 宝石。装备购买后永久拥有。</p><div class="tabs">'+tabs+'</div><div class="cards">'+cards+'</div><div class="actions"><button class="alt" id="backBtn">返回首页</button></div></div>';overlay.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{shopTab=b.dataset.tab;showShop();});overlay.querySelectorAll("[data-item]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.item),it=cat.items[i];if(!save.owned[shopTab].includes(i)){if(save.gems<it[1]){message.textContent="宝石不足！通关可以获得宝石。";return;}save.gems-=it[1];save.owned[shopTab].push(i);}save.equipped[shopTab]=i;persist();showShop();});document.getElementById("backBtn").onclick=showHome;}
function completeLevel(){if(won)return;won=true;mode="won";if(!save.claimed.includes(level)){save.gems+=10;save.claimed.push(level);}save.unlocked=Math.max(save.unlocked,Math.min(100,level+1));persist();overlay.style.display="flex";overlay.innerHTML='<div class="panel"><h1>🏆 关卡完成！</h1><p>'+world.name+' 挑战成功！</p><p style="font-size:26px;color:#ffdc70">+10 💎 宝石</p><p>当前余额：'+save.gems+'</p><div class="actions"><button id="nextBtn">'+(level===100?"返回首页":"下一关 →")+'</button><button class="alt" id="againBtn">重玩本关</button><button class="alt" id="home2">首页</button></div></div>';document.getElementById("nextBtn").onclick=()=>level===100?showHome():setLevel(level+1);document.getElementById("againBtn").onclick=()=>setLevel(level);document.getElementById("home2").onclick=showHome;message.textContent="通关奖励已领取！";}
function respawn(){deaths++;p.x=checkpointX;p.y=checkpointY;p.vx=0;p.vy=0;p.jumps=0;p.sliding=0;p.slideTimer=0;p.climbing=false;camera=Math.max(0,Math.min(world.length-W,p.x-300));message.textContent="回到检查点。失误："+deaths;}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x-camera,y,w,h);}
function drawStick(){const x=p.x-camera+12,y=p.y,skin=skins[save.skin]||skins[0],slide=p.sliding>0,phase=clock*.22,leg=p.on?Math.sin(phase)*.75:0,arm=p.on?Math.cos(phase)*.55:-.3;ctx.strokeStyle=skin.color;ctx.lineWidth=3;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();ctx.arc(x,y+8,8,0,Math.PI*2);ctx.moveTo(x,y+17);ctx.lineTo(x,y+33);ctx.stroke();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x-3,y+7,1.7,0,Math.PI*2);ctx.arc(x+3,y+7,1.7,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#172238";ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(x,y+11,2.6,0.15,Math.PI-.15);ctx.stroke();ctx.strokeStyle=skin.color;ctx.lineWidth=2.6;ctx.beginPath();if(slide){ctx.moveTo(x,y+26);ctx.lineTo(x+13,y+40);ctx.lineTo(x+24,y+43);ctx.moveTo(x,y+26);ctx.lineTo(x-12,y+40);ctx.lineTo(x-22,y+43);}else{ctx.moveTo(x,y+21);ctx.lineTo(x-9+arm*5,y+27);ctx.lineTo(x-13+arm*8,y+34);ctx.moveTo(x,y+21);ctx.lineTo(x+9-arm*5,y+27);ctx.lineTo(x+13-arm*8,y+34);ctx.moveTo(x,y+33);ctx.lineTo(x-8+leg*9,y+47);ctx.moveTo(x,y+33);ctx.lineTo(x+8-leg*9,y+47);}ctx.stroke();const hat=gear[0].items[save.equipped["帽子"]],shirt=gear[1].items[save.equipped["衣服"]],pants=gear[2].items[save.equipped["裤子"]],shoes=gear[3].items[save.equipped["鞋子"]];ctx.font="17px sans-serif";if(hat[2])ctx.fillText(hat[2],x-9,y+1);if(shirt[2])ctx.fillText(shirt[2],x-9,y+30);if(pants[2])ctx.fillText(pants[2],x-8,y+45);if(shoes[2])ctx.fillText(shoes[2],x-10,y+54);}
function draw(){if(!world){ctx.fillStyle="#15263d";ctx.fillRect(0,0,W,H);return;}const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,world.sky);g.addColorStop(1,world.sky2);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.globalAlpha=.22;for(let i=0;i<12;i++){const xx=((i*170-camera*.2)%(W+180)+W+180)%(W+180)-70;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(xx,75+(i%4)*42,25,0,7);ctx.fill();}ctx.globalAlpha=1;world.platforms.forEach(q=>{rect(q.x,q.y,q.w,q.h,world.ground);rect(q.x,q.y,q.w,5,"#ffffff77");});world.lava.forEach(q=>{rect(q.x,q.y,q.w,q.h,world.lavaColor);rect(q.x,q.y,q.w,6,"#ffd166");});world.pads.forEach(q=>{rect(q.x,q.y,q.w,q.h,"#ffcf58");rect(q.x+4,q.y+2,q.w-8,4,"#fff2a8");});world.bonusPlatforms.forEach(q=>{rect(q.x,q.y,q.w,q.h,"#b8a5ff");rect(q.x,q.y,q.w,4,"#fff");});world.spikes.forEach(q=>{ctx.fillStyle="#f4f7ff";ctx.beginPath();ctx.moveTo(q.x-camera,q.y+q.h);ctx.lineTo(q.x-camera+q.w/2,q.y);ctx.lineTo(q.x-camera+q.w,q.y+q.h);ctx.closePath();ctx.fill();ctx.strokeStyle="#d94b61";ctx.stroke();});world.portals.forEach((q,i)=>{ctx.save();ctx.shadowColor=i%2?"#42e7ff":"#d77bff";ctx.shadowBlur=16;ctx.strokeStyle=i%2?"#42e7ff":"#d77bff";ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(q.x-camera+q.w/2,q.y+q.h/2,q.w/2,q.h/2,0,0,Math.PI*2);ctx.stroke();ctx.restore();});world.ladders.forEach(l=>{rect(l.x,l.y,6,l.h,"#9b7046");rect(l.x+24,l.y,6,l.h,"#9b7046");for(let ry=l.y+8;ry<l.y+l.h;ry+=18)rect(l.x+5,ry,26,5,"#d9b17a");});world.checks.forEach(q=>{rect(q.x,q.y,5,52,"#26344b");rect(q.x+5,q.y,27,16,q.hit?"#39d5a4":"#ffcf58");});rect(world.goal.x,world.goal.y,5,75,"#26344b");rect(world.goal.x+5,world.goal.y,40,24,"#ffcf58");ctx.fillStyle="#172238";ctx.font="bold 14px sans-serif";ctx.fillText("FINISH",world.goal.x-camera-4,world.goal.y-10);drawStick();ctx.fillStyle="#172238aa";ctx.fillRect(18,18,190,38);ctx.fillStyle="#fff";ctx.font="bold 16px sans-serif";ctx.fillText("LEVEL "+level+" · "+world.name,30,43);}
function update(){
 clock++;
 if(mode==="game"&&!won){
  const dir=(keys.ArrowRight||keys.d||keys.D?1:0)-(keys.ArrowLeft||keys.a||keys.A?1:0);
  if(p.slideCooldown>0)p.slideCooldown--;
  if(p.portalCooldown>0)p.portalCooldown--;
  if(p.slideTimer>0)p.slideTimer--;
  const slideKey=!!(keys.c||keys.C);
  if(slideKey&&!keys._slideLock&&p.slideCooldown===0&&!p.climbing){p.slideTimer=24;p.slideCooldown=60;keys._slideLock=true;}
  if(!slideKey)keys._slideLock=false;
  p.sliding=p.slideTimer>0?1:0;
  const ladder=world.ladders.find(l=>p.x+p.w>l.x-10&&p.x<l.x+38&&p.y<=l.from+5&&p.y+p.h>=l.to-5);
  const climbKey=!!(keys.ArrowUp||keys.w||keys.W);
  if(ladder&&climbKey){p.climbing=true;p.vy=0;p.y=Math.max(ladder.to-p.h,Math.min(ladder.from-p.h,p.y-3.2));p.x=ladder.x+5;p.on=false;}
  else if(p.climbing&&(!climbKey||(ladder&&p.y<=ladder.to-p.h+1&&dir!==0)))p.climbing=false;
  if(!p.climbing){
   p.vx=dir*(p.sliding?6.2:4.25);p.x=Math.max(0,p.x+p.vx);
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
  if(p.x+p.w>world.goal.x&&p.y+p.h>world.goal.y-12)completeLevel();
  camera=Math.max(0,Math.min(world.length-W,p.x-300));
  message.textContent=p.slideCooldown>0?"滑铲冷却："+(p.slideCooldown/60).toFixed(1)+" 秒":(p.climbing?"正在爬梯子":"滑铲就绪 · C 键滑铲");
 }
 draw();requestAnimationFrame(update);
}
document.addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();keys[e.key]=true;});document.addEventListener("keyup",e=>keys[e.key]=false);
document.getElementById("playBtn").onclick=()=>setLevel(save.unlocked);document.getElementById("shopBtn").onclick=showShop;document.getElementById("homeBtn").onclick=showHome;document.getElementById("restartBtn").onclick=()=>{if(world)setLevel(level);};
function hold(id,key){const el=document.getElementById(id);el.addEventListener("pointerdown",e=>{e.preventDefault();keys[key]=true;});["pointerup","pointerleave","pointercancel"].forEach(t=>el.addEventListener(t,()=>keys[key]=false));}
hold("left","ArrowLeft");hold("right","ArrowRight");hold("jump","ArrowUp");hold("slide","c");
persist();showHome();update();
