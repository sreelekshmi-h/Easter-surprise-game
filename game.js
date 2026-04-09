// ============================================================
//  game.js  —  Egg Falling Game (Cinematic Slow-Cracking Final)
//  Ground: smooth hills + scattered depth flower meadow
//  + Bunny encouragement popup system
// ============================================================

// ------ Constants -------------------------------------------
const EGG_COLORS  = ['#ff6eb4','#ffd94a','#5dde7a','#b06aff','#4fc3f7','#ff9f43','#ff4757','#26de81','#fd79a8','#fdcb6e'];
const EGG_ACCENTS = ['#fff','#ff9f43','#ffd94a','#fff','#ff6eb4','#fff','#ffd94a','#fff','#ffd94a','#e17055'];
const PATTERNS    = ['stripes','zigzag','dots','diamonds'];
const SPAWN_RATE  = 600;
const EGG_MIN_SPD = 3.2;
const EGG_MAX_SPD = 6.4;
const ZOOM_SPEED  = 0.12;

let canvas, ctx;
let eggs       = [];
let splats     = [];
let clouds     = [];
let flowers    = [];
let spawnTimer = null;
let gameActive = false;
let GROUND_Y   = 0;
let focusedEgg = null;
let missedCount = 0;

// ------ Bunny System ----------------------------------------
// First message shown immediately on game start
const BUNNY_FIRST_MESSAGE = "Good luck!🍀";

// Subsequent messages shown at random intervals
const BUNNY_MESSAGES = [
  "Come on! You can do it! 🐣",
  "Try again, you've got this! ",
  "You're so close, I know it! 🌸",
  "Don't give up! 🐰",
  "Keep tapping! One will crack! ✨",
  "You can do it, I believe in you! 🥚",
];

let bunnyEl      = null;
let bunnyTimer   = null;
let bunnyVisible = false;
let bunnyDone    = false;

function createBunnyEl() {
  const wrap = document.createElement('div');
  wrap.id = 'bunny-wrap';
  wrap.style.cssText = `
    position: fixed; bottom: -220px; left: 50%;
    transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center;
    pointer-events: none; z-index: 999;
    transition: bottom 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;
  const bubble = document.createElement('div');
  bubble.className = 'bunny-bubble';
  bubble.style.cssText = `
    background: #fff; border: 3px solid #ff6eb4; border-radius: 18px;
    padding: 10px 18px; font-family: 'Fredoka One','Nunito',sans-serif;
    font-size: clamp(13px,3.5vw,17px); color: #c2185b;
    text-align: center; white-space: nowrap; margin-bottom: 6px;
    box-shadow: 0 4px 18px rgba(255,110,180,0.25); position: relative;
  `;
  const tail = document.createElement('div');
  tail.style.cssText = `
    width:0; height:0;
    border-left:10px solid transparent; border-right:10px solid transparent;
    border-top:12px solid #ff6eb4;
    position:absolute; bottom:-15px; left:50%; transform:translateX(-50%);
  `;
  bubble.appendChild(tail);
  const img = document.createElement('img');
  img.src = 'assets/Baby_Rabbit.gif';
  img.style.cssText = `width:clamp(70px,18vw,110px);height:auto;display:block;margin-top:8px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.18));`;
  wrap.appendChild(bubble);
  wrap.appendChild(img);
  document.body.appendChild(wrap);
  bunnyEl = wrap;
}

function showBunnyWithMessage(message) {
  if (bunnyDone || bunnyVisible || !bunnyEl) return;
  const bubble = bunnyEl.querySelector('.bunny-bubble');
  const tail   = bubble.querySelector('div');
  bubble.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.remove(); });
  bubble.insertBefore(document.createTextNode(message), tail);
  const bw=160, minX=bw/2+10, maxX=window.innerWidth-bw/2-10;
  bunnyEl.style.left = `${minX+Math.random()*(maxX-minX)}px`;
  bunnyEl.style.transform = 'translateX(-50%)';
  bunnyVisible = true;
  requestAnimationFrame(() => { bunnyEl.style.bottom = '0px'; });
  setTimeout(() => hideBunny(), 5000);
}

function showBunny() {
  // picks a random message from the regular pool
  showBunnyWithMessage(BUNNY_MESSAGES[Math.floor(Math.random() * BUNNY_MESSAGES.length)]);
}

function hideBunny() {
  if (!bunnyEl) return;
  bunnyEl.style.bottom = '-220px';
  setTimeout(() => { bunnyVisible = false; }, 900);
}

function stopBunny() {
  bunnyDone = true; clearInterval(bunnyTimer);
  if (bunnyEl) {
    bunnyEl.style.transition = 'bottom 0.3s ease';
    bunnyEl.style.bottom = '-220px';
    setTimeout(() => { if (bunnyEl) { bunnyEl.remove(); bunnyEl = null; } }, 400);
  }
}

function startBunnyScheduler() {
  createBunnyEl();

  // appear almost immediately (1.5s) with the good luck message
  setTimeout(() => {
    if (!bunnyDone) {
      showBunnyWithMessage(BUNNY_FIRST_MESSAGE);

      // then continue at random intervals with normal encouraging messages
      bunnyTimer = setInterval(() => {
        if (bunnyDone) { clearInterval(bunnyTimer); return; }
        showBunny();
      }, 10000 + Math.random() * 5000);
    }
  }, 1500);
}

// ------ Audio -----------------------------------------------
const SOUNDS = {};
function preloadSounds() {
  ['crack','splat','pop'].forEach(name => {
    const a = new Audio(`assets/${name}.mp3`); a.load(); SOUNDS[name] = a;
  });
}
function playSound(name) {
  try { const s=SOUNDS[name]; if(!s) return; s.currentTime=0; s.volume=0.7; s.play().catch(()=>{}); } catch(e) {}
}

// ------ Clouds ----------------------------------------------
function buildClouds() {
  clouds = [];
  for (let i=0; i<5; i++) clouds.push({x:Math.random()*canvas.width,y:28+Math.random()*70,r:26+Math.random()*26,speed:0.15+Math.random()*0.15,alpha:0.8+Math.random()*0.15});
}
function drawClouds() {
  clouds.forEach(c => {
    c.x += c.speed; if (c.x-c.r*2>canvas.width) c.x=-c.r*2;
    ctx.save(); ctx.globalAlpha=c.alpha; ctx.fillStyle='#fff';
    ctx.beginPath();
    ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.arc(c.x+c.r*0.9,c.y+6,c.r*0.72,0,Math.PI*2);
    ctx.arc(c.x-c.r*0.85,c.y+8,c.r*0.65,0,Math.PI*2); ctx.arc(c.x+c.r*0.3,c.y-c.r*0.55,c.r*0.6,0,Math.PI*2);
    ctx.fill(); ctx.restore();
  });
}

// ------ Sun -------------------------------------------------
function drawSun() {
  const sx=canvas.width-65,sy=52,sr=28; ctx.save();
  const g=ctx.createRadialGradient(sx,sy,sr*0.4,sx,sy,sr*2.4);
  g.addColorStop(0,'rgba(255,235,80,0.4)'); g.addColorStop(1,'rgba(255,235,80,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,sy,sr*2.4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FFD93D'; ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FFC300'; ctx.beginPath(); ctx.arc(sx,sy,sr*0.7,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

// ------ Flower Meadow ---------------------------------------
function shadeColor(col,amt){
  const n=parseInt(col.replace('#',''),16);
  return `rgb(${Math.min(255,Math.max(0,(n>>16)+amt))},${Math.min(255,Math.max(0,((n>>8)&0xff)+amt))},${Math.min(255,Math.max(0,(n&0xff)+amt))})`;
}

const FLOWER_COLS=[
  {petal:'#ff6eb4',centre:'#ffd93d'},{petal:'#b06aff',centre:'#ffd93d'},
  {petal:'#ffffff',centre:'#ffd93d'},{petal:'#ffd94a',centre:'#ff9f43'},
  {petal:'#4fc3f7',centre:'#ffffff'},{petal:'#ff9f43',centre:'#ffd93d'},
  {petal:'#fd79a8',centre:'#ffffff'},{petal:'#26de81',centre:'#ffd93d'},
  {petal:'#ff4757',centre:'#ffd93d'},{petal:'#f8bbd0',centre:'#ffd93d'},
];
const FLOWER_TYPES=['daisy','tulip','sunflower','simple'];

function buildFlowers() {
  flowers = [];
  const W = canvas.width;
  const layers = [
    { count:20, yMin:GROUND_Y+2,  yMax:GROUND_Y+20, sizeMin:2.5, sizeMax:4.5,  stemMin:8,  stemMax:15, alpha:0.55, leanMax:0.12 },
    { count:22, yMin:GROUND_Y+16, yMax:GROUND_Y+38, sizeMin:3.5, sizeMax:6.5,  stemMin:12, stemMax:22, alpha:0.72, leanMax:0.16 },
    { count:18, yMin:GROUND_Y+34, yMax:GROUND_Y+60, sizeMin:5,   sizeMax:9,    stemMin:16, stemMax:28, alpha:0.88, leanMax:0.18 },
    { count:12, yMin:GROUND_Y+55, yMax:GROUND_Y+82, sizeMin:7,   sizeMax:12,   stemMin:20, stemMax:34, alpha:1.0,  leanMax:0.22 },
  ];
  layers.forEach(l => {
    const positions=[], minGap=W/(l.count*1.5);
    let attempts=0;
    while (positions.length<l.count && attempts<400) {
      attempts++;
      const x=10+Math.random()*(W-20);
      if (positions.every(p=>Math.abs(p-x)>minGap)) positions.push(x);
    }
    positions.forEach(x => {
      const c=FLOWER_COLS[Math.floor(Math.random()*FLOWER_COLS.length)];
      const t=FLOWER_TYPES[Math.floor(Math.random()*FLOWER_TYPES.length)];
      flowers.push({
        x, y:l.yMin+Math.random()*(l.yMax-l.yMin),
        stemH:l.stemMin+Math.random()*(l.stemMax-l.stemMin),
        size:l.sizeMin+Math.random()*(l.sizeMax-l.sizeMin),
        petal:c.petal, centre:c.centre, type:t,
        lean:(Math.random()-0.5)*l.leanMax, alpha:l.alpha,
      });
    });
  });
  flowers.sort((a,b)=>a.y-b.y);
}

function drawDaisy(f){
  const cx=f.x,cy=f.y-f.stemH,r=f.size,n=7;
  for(let i=0;i<n;i++){
    const a=(i/n)*Math.PI*2; ctx.fillStyle=f.petal; ctx.beginPath();
    ctx.ellipse(cx+Math.cos(a)*r*1.1,cy+Math.sin(a)*r*1.1,r*0.52,r*0.82,a,0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle=f.centre; ctx.beginPath(); ctx.arc(cx,cy,r*0.52,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.arc(cx,cy,r*0.26,0,Math.PI*2); ctx.fill();
}

function drawTulip(f){
  const cx=f.x,cy=f.y-f.stemH,pw=f.size;
  ctx.fillStyle=shadeColor(f.petal,-30);
  ctx.beginPath(); ctx.moveTo(cx,cy+pw*0.4);
  ctx.bezierCurveTo(cx-pw*1.2,cy+pw*0.1,cx-pw*1.0,cy-pw*1.7,cx-pw*0.15,cy-pw*2.0);
  ctx.bezierCurveTo(cx-pw*0.4,cy-pw*1.3,cx-pw*0.35,cy-pw*0.4,cx,cy+pw*0.4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx,cy+pw*0.4);
  ctx.bezierCurveTo(cx+pw*1.2,cy+pw*0.1,cx+pw*1.0,cy-pw*1.7,cx+pw*0.15,cy-pw*2.0);
  ctx.bezierCurveTo(cx+pw*0.4,cy-pw*1.3,cx+pw*0.35,cy-pw*0.4,cx,cy+pw*0.4); ctx.fill();
  ctx.fillStyle=f.petal;
  ctx.beginPath(); ctx.moveTo(cx,cy+pw*0.45);
  ctx.bezierCurveTo(cx-pw*0.85,cy+pw*0.1,cx-pw*0.7,cy-pw*1.55,cx,cy-pw*1.95);
  ctx.bezierCurveTo(cx+pw*0.7,cy-pw*1.55,cx+pw*0.85,cy+pw*0.1,cx,cy+pw*0.45); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.moveTo(cx,cy+pw*0.1);
  ctx.bezierCurveTo(cx-pw*0.28,cy-pw*0.2,cx-pw*0.22,cy-pw*1.0,cx,cy-pw*1.45);
  ctx.bezierCurveTo(cx+pw*0.22,cy-pw*1.0,cx+pw*0.28,cy-pw*0.2,cx,cy+pw*0.1); ctx.fill();
}

function drawSunflower(f){
  const cx=f.x,cy=f.y-f.stemH,r=f.size,n=12;
  ctx.fillStyle='#ffd93d';
  for(let i=0;i<n;i++){
    const a=(i/n)*Math.PI*2; ctx.save(); ctx.translate(cx,cy); ctx.rotate(a);
    ctx.beginPath(); ctx.ellipse(0,-r*1.3,r*0.36,r*0.9,0,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
  ctx.fillStyle='#5d3a00'; ctx.beginPath(); ctx.arc(cx,cy,r*0.6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#7a4f00'; ctx.beginPath(); ctx.arc(cx,cy,r*0.38,0,Math.PI*2); ctx.fill();
}

function drawSimple(f){
  const cx=f.x,cy=f.y-f.stemH,r=f.size,n=5;
  for(let i=0;i<n;i++){
    const a=(i/n)*Math.PI*2; ctx.fillStyle=f.petal; ctx.beginPath();
    ctx.arc(cx+Math.cos(a)*r*0.9,cy+Math.sin(a)*r*0.9,r*0.62,0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle=f.centre; ctx.beginPath(); ctx.arc(cx,cy,r*0.46,0,Math.PI*2); ctx.fill();
}

function drawFlower(f){
  ctx.save(); ctx.globalAlpha=f.alpha;
  ctx.translate(f.x,f.y); ctx.rotate(f.lean); ctx.translate(-f.x,-f.y);
  ctx.strokeStyle='#388e3c'; ctx.lineWidth=Math.max(0.8,f.size*0.18); ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(f.x,f.y); ctx.lineTo(f.x,f.y-f.stemH); ctx.stroke();
  if (f.size>4.5){
    ctx.fillStyle='#4caf50'; ctx.beginPath();
    ctx.moveTo(f.x,f.y-f.stemH*0.38);
    ctx.quadraticCurveTo(f.x+f.size*1.6,f.y-f.stemH*0.52,f.x+f.size*1.2,f.y-f.stemH*0.68);
    ctx.quadraticCurveTo(f.x+f.size*0.35,f.y-f.stemH*0.54,f.x,f.y-f.stemH*0.38); ctx.fill();
  }
  if      (f.type==='daisy')     drawDaisy(f);
  else if (f.type==='tulip')     drawTulip(f);
  else if (f.type==='sunflower') drawSunflower(f);
  else                           drawSimple(f);
  ctx.restore();
}

// ------ Draw scene ------------------------------------------
function drawScene() {
  const W=canvas.width, H=canvas.height;
  const sky=ctx.createLinearGradient(0,0,0,GROUND_Y);
  sky.addColorStop(0,'#87CEEB'); sky.addColorStop(1,'#C9EFFF');
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
  drawSun(); drawClouds();

  // back hill
  ctx.fillStyle='#c5e8a0'; ctx.beginPath(); ctx.moveTo(-10,H); ctx.lineTo(-10,GROUND_Y+10);
  ctx.bezierCurveTo(W*0.1,GROUND_Y-55,W*0.28,GROUND_Y-70,W*0.5,GROUND_Y-50);
  ctx.bezierCurveTo(W*0.72,GROUND_Y-30,W*0.88,GROUND_Y-60,W+10,GROUND_Y-20);
  ctx.lineTo(W+10,H); ctx.closePath(); ctx.fill();

  // mid hill
  ctx.fillStyle='#a8d880'; ctx.beginPath(); ctx.moveTo(-10,H); ctx.lineTo(-10,GROUND_Y+5);
  ctx.bezierCurveTo(W*0.12,GROUND_Y-35,W*0.3,GROUND_Y-48,W*0.48,GROUND_Y-30);
  ctx.bezierCurveTo(W*0.65,GROUND_Y-12,W*0.8,GROUND_Y-42,W+10,GROUND_Y-8);
  ctx.lineTo(W+10,H); ctx.closePath(); ctx.fill();

  // front ground — smooth flat plane
  ctx.fillStyle='#88c860'; ctx.beginPath(); ctx.moveTo(-10,H); ctx.lineTo(-10,GROUND_Y);
  ctx.bezierCurveTo(W*0.2,GROUND_Y-10,W*0.45,GROUND_Y-4,W*0.65,GROUND_Y-8);
  ctx.bezierCurveTo(W*0.82,GROUND_Y-12,W*0.93,GROUND_Y-4,W+10,GROUND_Y);
  ctx.lineTo(W+10,H); ctx.closePath(); ctx.fill();

  ctx.fillStyle='#76b850'; ctx.fillRect(-10,GROUND_Y+2,W+20,H-GROUND_Y);

  flowers.forEach(drawFlower);
}

// ------ Egg Logic -------------------------------------------
function createEgg(startY,slow){
  const ci=Math.floor(Math.random()*EGG_COLORS.length), sc=0.85+Math.random()*0.5;
  return {
    x:45+Math.random()*(canvas.width-90),
    y:startY!==undefined?startY:-(36*sc+Math.random()*80),
    vy:slow?0.8+Math.random()*1.5:EGG_MIN_SPD+Math.random()*(EGG_MAX_SPD-EGG_MIN_SPD),
    vx:(Math.random()-0.5)*0.5, color:EGG_COLORS[ci], accent:EGG_ACCENTS[ci],
    pattern:PATTERNS[Math.floor(Math.random()*4)], scale:sc,
    rotation:0, rotSpeed:(Math.random()-0.5)*0.04,
    alive:true, popping:false, cracked:false, crackProgress:0,
    popR:0, popAlpha:1, acc:0.045,
  };
}

function drawEgg(e){
  const rx=26*e.scale, ry=36*e.scale;
  ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.rotation);
  ctx.shadowColor=e.color; ctx.shadowBlur=10;
  ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=3; ctx.stroke();
  ctx.shadowBlur=0;
  ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2); ctx.fillStyle=e.color; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2); ctx.clip(); ctx.globalAlpha=0.52;
  if(e.pattern==='stripes'){
    ctx.strokeStyle=e.accent; ctx.lineWidth=3.5;
    for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(-rx*1.5,i*ry*0.38);ctx.lineTo(rx*1.5,i*ry*0.38);ctx.stroke();}
  }else if(e.pattern==='zigzag'){
    ctx.strokeStyle=e.accent; ctx.lineWidth=2.5;
    for(let row=-2;row<=2;row++){
      const yb=row*ry*0.42; ctx.beginPath(); let first=true;
      for(let xi=-rx*1.2;xi<=rx*1.2;xi+=rx*0.35){
        const yy=yb+(Math.round((xi+rx*1.2)/(rx*0.35))%2===0?-7*e.scale:7*e.scale);
        first?ctx.moveTo(xi,yy):ctx.lineTo(xi,yy); first=false;
      } ctx.stroke();
    }
  }else if(e.pattern==='dots'){
    ctx.fillStyle=e.accent; const sp=rx*0.52;
    for(let row=-2;row<=2;row++) for(let col=-2;col<=2;col++){
      ctx.beginPath(); ctx.arc(col*sp+(row%2===0?0:sp*0.5),row*sp*0.85,3.5*e.scale,0,Math.PI*2); ctx.fill();
    }
  }else{
    ctx.strokeStyle=e.accent; ctx.lineWidth=2; const sp2=rx*0.6;
    for(let row=-2;row<=2;row++) for(let col=-2;col<=2;col++){
      const ox=col*sp2+(row%2===0?0:sp2*0.5),oy=row*sp2*0.75;
      ctx.beginPath(); ctx.moveTo(ox,oy-7*e.scale); ctx.lineTo(ox+6*e.scale,oy);
      ctx.lineTo(ox,oy+7*e.scale); ctx.lineTo(ox-6*e.scale,oy); ctx.closePath(); ctx.stroke();
    }
  }
  ctx.restore(); ctx.globalAlpha=1;
  ctx.beginPath(); ctx.ellipse(-rx*0.27,-ry*0.3,rx*0.22,ry*0.15,-0.4,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.fill();
  if(e.cracked && e.crackProgress>0){
    ctx.save(); ctx.strokeStyle=`rgba(35,15,0,${0.4+e.crackProgress*0.6})`;
    ctx.lineJoin='round'; ctx.lineCap='round';
    for(let i=0;i<4;i++){
      ctx.beginPath(); ctx.lineWidth=(4-i)*e.scale*e.crackProgress; ctx.moveTo(0,0);
      let cx2=0,cy2=0; const angle=(i*Math.PI*2/4)+0.8, segLen=(rx*1.1/8)*e.crackProgress;
      for(let j=0;j<8;j++){cx2+=Math.cos(angle)*segLen+(Math.random()-0.5)*7;cy2+=Math.sin(angle)*segLen+(Math.random()-0.5)*7;ctx.lineTo(cx2,cy2);}
      ctx.stroke();
    }
    ctx.globalAlpha=e.crackProgress; ctx.fillStyle='white';
    ctx.beginPath(); ctx.arc(0,0,3*e.crackProgress,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}

function drawPop(e){
  ctx.save(); ctx.translate(e.x,e.y); e.popAlpha=Math.max(0,1-e.popR/100); ctx.globalAlpha=e.popAlpha;
  for(let ring=0;ring<3;ring++){
    const r=e.popR*(0.5+ring*0.28); ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
    ctx.strokeStyle=EGG_COLORS[(EGG_COLORS.indexOf(e.color)+ring)%EGG_COLORS.length];
    ctx.lineWidth=5-ring; ctx.stroke();
  }
  ctx.restore();
}

// ------ Effects ---------------------------------------------
function createSplat(x,color){
  const blobPts=[],arms=10+Math.floor(Math.random()*5);
  for(let i=0;i<arms;i++) blobPts.push({a:(i/arms)*Math.PI*2,r:10+Math.random()*14});
  const whitePts=[],wArms=12+Math.floor(Math.random()*5);
  for(let i=0;i<wArms;i++) whitePts.push({a:(i/wArms)*Math.PI*2,r:20+Math.random()*22});
  return {x,y:GROUND_Y,color,blobPts,whitePts,alpha:1,born:performance.now()};
}

function drawSplat(s){
  ctx.save(); ctx.globalAlpha=s.alpha; ctx.translate(s.x,s.y); ctx.scale(1,0.38);
  ctx.beginPath();
  s.whitePts.forEach((p,i)=>{const px=Math.cos(p.a)*p.r,py=Math.sin(p.a)*p.r;i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);});
  ctx.fillStyle='rgba(255,255,255,0.82)'; ctx.fill();
  ctx.beginPath();
  s.blobPts.forEach((p,i)=>{const px=Math.cos(p.a)*p.r,py=Math.sin(p.a)*p.r;i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);});
  ctx.fillStyle=s.color; ctx.fill(); ctx.restore();
}

function spawnConfetti(tapX,tapY){
  const container=document.getElementById('burst-container'); if(!container) return;
  const msg=document.createElement('div'); msg.className='surprise-text';
  msg.textContent='🎁 You found the surprise gift!'; container.appendChild(msg);
  setTimeout(()=>msg.remove(),3500);
  for(let i=0;i<90;i++){
    const bit=document.createElement('div'); bit.className='confetti-dot';
    const a=Math.random()*360,dist=120+Math.random()*420,w=5+Math.random()*7;
    const h=Math.random()>0.5?w*0.5:w*(1.5+Math.random()*2);
    const color=EGG_COLORS[Math.floor(Math.random()*EGG_COLORS.length)],delay=Math.random()*150;
    bit.style.cssText=`left:${tapX}px;top:${tapY}px;width:${w}px;height:${h}px;background:${color};position:absolute;border-radius:1px;--dx:${Math.cos(a*Math.PI/180)*dist}px;--dy:${Math.sin(a*Math.PI/180)*dist+380}px;--rot:${Math.random()*900}deg;animation:confettiBit 1.9s cubic-bezier(0.15,0.5,0.4,1) ${delay}ms forwards;`;
    container.appendChild(bit); setTimeout(()=>bit.remove(),2200);
  }
  for(let i=0;i<18;i++){
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    const color=EGG_COLORS[Math.floor(Math.random()*EGG_COLORS.length)],size=36+Math.random()*40;
    const a=Math.random()*360,dist=160+Math.random()*480,delay=Math.random()*200;
    const dx=Math.cos(a*Math.PI/180)*dist,dy=Math.sin(a*Math.PI/180)*dist+300;
    const rot=Math.random()*1080-540,curlType=Math.floor(Math.random()*3);
    svg.setAttribute('viewBox','0 0 40 40'); svg.setAttribute('width',size); svg.setAttribute('height',size);
    svg.style.cssText=`position:absolute;left:${tapX}px;top:${tapY}px;pointer-events:none;z-index:55;overflow:visible;--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;animation:curlyFly 2s cubic-bezier(0.1,0.6,0.35,1) ${delay}ms forwards;`;
    const path=document.createElementNS(ns,'path');
    path.setAttribute('fill','none'); path.setAttribute('stroke',color);
    path.setAttribute('stroke-width','3'); path.setAttribute('stroke-linecap','round');
    path.setAttribute('d',curlType===0?'M20,35 C5,30 5,20 20,20 C35,20 35,10 20,5':curlType===1?'M20,38 C8,35 4,25 12,18 C20,11 32,14 30,22 C28,30 18,32 15,26 C12,20 18,16 22,20':'M5,30 C5,15 15,5 25,10 C35,15 38,28 28,33 C18,38 10,32 12,24');
    svg.appendChild(path); container.appendChild(svg); setTimeout(()=>svg.remove(),2500);
  }
}

// ------ Interaction -----------------------------------------
function handleTap(clientX,clientY){
  if(!gameActive||focusedEgg) return;
  const rect=canvas.getBoundingClientRect(),tx=clientX-rect.left,ty=clientY-rect.top;
  for(let i=eggs.length-1;i>=0;i--){
    const e=eggs[i],rx=26*e.scale,ry=36*e.scale,dx=tx-e.x,dy=ty-e.y;
    if((dx*dx)/(rx*rx)+(dy*dy)/(ry*ry)<=1){
      focusedEgg=e; gameActive=false; clearInterval(spawnTimer); stopBunny();
      setTimeout(()=>{showScreen(3);startLoading();},5000); return;
    }
  }
}

// ------ Game Loop -------------------------------------------
function gameLoop(){
  drawScene();
  const now=performance.now();
  splats=splats.filter(s=>{
    const age=now-s.born; s.alpha=Math.max(0,1-(age-1600)/1400);
    drawSplat(s); return s.alpha>0;
  });
  eggs=eggs.filter(e=>{
    if(focusedEgg){
      if(e===focusedEgg){
        const tx=canvas.width/2,ty=canvas.height/2;
        e.x+=(tx-e.x)*ZOOM_SPEED; e.y+=(ty-e.y)*ZOOM_SPEED;
        e.scale+=(2.8-e.scale)*ZOOM_SPEED; e.rotation*=0.8;
        const dist=Math.hypot(tx-e.x,ty-e.y);
        if(dist<4&&!e.cracked){
          e.cracked=true; e.crackProgress=0; playSound('crack');
          const ci=setInterval(()=>{
            e.crackProgress+=30/2000;
            const shake=12*e.crackProgress;
            e.x+=(Math.random()-0.5)*shake; e.y+=(Math.random()-0.5)*shake;
            if(e.crackProgress>=1){e.crackProgress=1;clearInterval(ci);}
          },30);
          setTimeout(()=>{if(!e.popping){e.popping=true;playSound('pop');spawnConfetti(e.x,e.y);}},2000);
        }
        if(e.popping){e.popR+=14;drawPop(e);return e.popAlpha>0;}
        drawEgg(e); return true;
      }else{
        ctx.globalAlpha=Math.max(0,(ctx.globalAlpha||1)-0.15);
        drawEgg(e); ctx.globalAlpha=1.0; return false;
      }
    }
    e.vy=Math.min(e.vy+e.acc,7.5); e.y+=e.vy; e.x+=e.vx; e.rotation+=e.rotSpeed;
   
    if (e.y + 36*e.scale >= GROUND_Y) {
  playSound('splat');
  splats.push(createSplat(e.x, e.color));
  missedCount++;
  const numEl = document.getElementById('missed-num');
  if (numEl) numEl.textContent = missedCount;
  return false;
}
    drawEgg(e); return e.alive;
  });
  if(gameActive||focusedEgg||splats.length>0) requestAnimationFrame(gameLoop);
}

function dramaticEntrance(){
  // ✅ reduced from 22 to 8 initial eggs so screen isn't flooded at the start
  for(let i=0;i<8;i++) setTimeout(()=>eggs.push(createEgg(null,true)),i*80);
  setTimeout(()=>{
    eggs.forEach(e=>{e.vy=EGG_MIN_SPD+Math.random()*(EGG_MAX_SPD-EGG_MIN_SPD);});
    spawnTimer=setInterval(()=>{if(gameActive)eggs.push(createEgg());},SPAWN_RATE);
  },2200);
}

function initGame(){
  canvas=document.getElementById('egg-canvas');
  ctx=canvas.getContext('2d');
  eggs=[]; splats=[]; focusedEgg=null; gameActive=true;
  bunnyDone=false; bunnyVisible=false;
  if(bunnyEl){bunnyEl.remove();bunnyEl=null;} clearInterval(bunnyTimer);
  preloadSounds();
  function resize(){
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    GROUND_Y=canvas.height-85; buildFlowers(); buildClouds();
  }
  resize(); window.addEventListener('resize',resize);
  canvas.addEventListener('click',e=>handleTap(e.clientX,e.clientY));
  canvas.addEventListener('touchstart',e=>{e.preventDefault();handleTap(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
  // create missed eggs counter
const missedBox = document.createElement('div');
missedBox.className = 'missed-eggs-container';
missedBox.id = 'missed-box';
missedBox.innerHTML = '🥚 Missed: <span class="missed-count" id="missed-num">0</span>';
document.getElementById('screen-2').appendChild(missedBox);
missedCount = 0;
  dramaticEntrance(); startBunnyScheduler(); gameLoop();
}
