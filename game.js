// ============================================================
//  game.js  —  Egg Falling Game  (Screen 2)
//  Features: pretty decorated eggs, rotating fall with easing,
//  sky + sun + clouds + lush layered grass, splat with albumen
//  + curved shell pieces, dramatic entrance animation
// ============================================================

// ------ Constants -------------------------------------------
const EGG_COLORS  = ['#ff6eb4','#ffd94a','#5dde7a','#b06aff','#4fc3f7','#ff9f43','#ff4757','#26de81','#fd79a8','#fdcb6e'];
const EGG_ACCENTS = ['#fff','#ff9f43','#ffd94a','#fff','#ff6eb4','#fff','#ffd94a','#fff','#ffd94a','#e17055'];
const PATTERNS    = ['stripes','zigzag','dots','diamonds'];
const SPAWN_RATE  = 600;
const EGG_MIN_SPD = 3.2;
const EGG_MAX_SPD = 6.4;

let canvas, ctx;
let eggs       = [];
let splats     = [];
let clouds     = [];
let grassTufts = [];
let spawnTimer = null;
let gameActive = false;
let GROUND_Y   = 0;

// ------ Audio -----------------------------------------------
function playSound(src) {
  try {
    const a = new Audio(src);
    a.volume = 0.7;
    a.play().catch(() => {});
  } catch(e) {}
}

// ------ Clouds ----------------------------------------------
function buildClouds() {
  clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x    : Math.random() * canvas.width,
      y    : 28 + Math.random() * 70,
      r    : 26 + Math.random() * 26,
      speed: 0.15 + Math.random() * 0.15,
      alpha: 0.8 + Math.random() * 0.15,
    });
  }
}

function drawClouds() {
  clouds.forEach(c => {
    c.x += c.speed;
    if (c.x - c.r * 2 > canvas.width) c.x = -c.r * 2;
    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(c.x,           c.y,        c.r,        0, Math.PI*2);
    ctx.arc(c.x+c.r*0.9,  c.y+6,      c.r*0.72,   0, Math.PI*2);
    ctx.arc(c.x-c.r*0.85, c.y+8,      c.r*0.65,   0, Math.PI*2);
    ctx.arc(c.x+c.r*0.3,  c.y-c.r*0.55, c.r*0.6,  0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
}

// ------ Sun -------------------------------------------------
function drawSun() {
  const sx = canvas.width - 65, sy = 52, sr = 28;
  ctx.save();
  const g = ctx.createRadialGradient(sx, sy, sr*0.4, sx, sy, sr*2.4);
  g.addColorStop(0, 'rgba(255,235,80,0.4)');
  g.addColorStop(1, 'rgba(255,235,80,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(sx, sy, sr*2.4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#FFD93D';
  ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#FFC300';
  ctx.beginPath(); ctx.arc(sx, sy, sr*0.7, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ------ Lush layered grass ----------------------------------
function buildGrass() {
  grassTufts = [];
  const rows = [
    { yOffset:-6, count:6, hMin:18, hMax:30, leanMax:0.22, thick:1.2, dark:'#2E7D32', light:'#4CAF50', spacing:9  },
    { yOffset:-2, count:7, hMin:14, hMax:24, leanMax:0.18, thick:1.5, dark:'#388E3C', light:'#66BB6A', spacing:8  },
    { yOffset: 2, count:8, hMin:10, hMax:18, leanMax:0.12, thick:1.8, dark:'#43A047', light:'#81C784', spacing:7  },
  ];

  rows.forEach(row => {
    for (let x = 0; x < canvas.width; x += row.spacing) {
      const baseY  = GROUND_Y + row.yOffset + Math.sin(x * 0.05) * 3;
      const blades = [];
      for (let b = 0; b < row.count; b++) {
        const bx   = x + (b - row.count/2) * 3.5 + Math.random() * 3;
        const bh   = row.hMin + Math.random() * (row.hMax - row.hMin);
        const lean = (Math.random() - 0.5) * row.leanMax;
        blades.push({ bx, bh, lean, thick: row.thick + Math.random() * 0.6 });
      }
      grassTufts.push({ baseY, blades, dark: row.dark, light: row.light });
    }
  });
}

function drawGrass() {
  grassTufts.forEach(t => {
    t.blades.forEach(b => {
      ctx.strokeStyle = t.dark;
      ctx.lineWidth   = b.thick;
      ctx.beginPath();
      ctx.moveTo(b.bx, t.baseY);
      ctx.quadraticCurveTo(
        b.bx + b.lean*b.bh*0.6,   t.baseY - b.bh*0.55,
        b.bx + b.lean*b.bh*1.1,   t.baseY - b.bh
      );
      ctx.stroke();
      // highlight streak
      ctx.strokeStyle = t.light;
      ctx.lineWidth   = b.thick * 0.35;
      ctx.beginPath();
      ctx.moveTo(b.bx + 0.7, t.baseY);
      ctx.quadraticCurveTo(
        b.bx + b.lean*b.bh*0.6 + 0.7, t.baseY - b.bh*0.55,
        b.bx + b.lean*b.bh*1.1 + 0.7, t.baseY - b.bh
      );
      ctx.stroke();
    });
  });
}

// ------ Draw full scene -------------------------------------
function drawScene() {
  const W = canvas.width, H = canvas.height;

  // sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, '#87CEEB');
  sky.addColorStop(1, '#C9EFFF');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  drawSun();
  drawClouds();

  // far hill — gentle rolling
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y+5);
  ctx.bezierCurveTo(W*0.12,GROUND_Y-22, W*0.28,GROUND_Y-28, W*0.42,GROUND_Y-18);
  ctx.bezierCurveTo(W*0.56,GROUND_Y-8,  W*0.70,GROUND_Y-30, W*0.85,GROUND_Y-24);
  ctx.bezierCurveTo(W*0.93,GROUND_Y-18, W,     GROUND_Y-10, W,     GROUND_Y+5);
  ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
  ctx.fillStyle = '#4CAF50'; ctx.fill();

  // mid hill
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y+8);
  ctx.bezierCurveTo(W*0.08,GROUND_Y-8,  W*0.22,GROUND_Y-14, W*0.38,GROUND_Y-6);
  ctx.bezierCurveTo(W*0.52,GROUND_Y+2,  W*0.65,GROUND_Y-16, W*0.80,GROUND_Y-10);
  ctx.bezierCurveTo(W*0.90,GROUND_Y-5,  W,     GROUND_Y+2,  W,     GROUND_Y+8);
  ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
  ctx.fillStyle = '#388E3C'; ctx.fill();

  // flat front ground
  ctx.fillStyle = '#2E7D32';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  // ground edge highlight
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y);
  ctx.strokeStyle = 'rgba(102,187,106,0.5)'; ctx.lineWidth = 3; ctx.stroke();

  drawGrass();
}

// ------ Egg object ------------------------------------------
function createEgg(startY, slow) {
  const ci = Math.floor(Math.random() * EGG_COLORS.length);
  const sc = 0.85 + Math.random() * 0.5;
  return {
    x       : 45 + Math.random() * (canvas.width - 90),
    y       : startY !== undefined ? startY : -(36*sc + Math.random()*80),
    vy      : slow ? 0.8 + Math.random()*1.5 : EGG_MIN_SPD + Math.random()*(EGG_MAX_SPD-EGG_MIN_SPD),
    vx      : (Math.random() - 0.5) * 0.5,
    color   : EGG_COLORS[ci],
    accent  : EGG_ACCENTS[ci],
    pattern : PATTERNS[Math.floor(Math.random() * 4)],
    scale   : sc,
    wobble  : Math.random() * Math.PI * 2,
    rotation: 0,
    rotSpeed: (Math.random() - 0.5) * 0.04,
    alive   : true,
    popping : false,
    popR    : 0,
    popAlpha: 1,
    acc     : 0.045,
  };
}

// ------ Draw pretty egg -------------------------------------
function drawEgg(e) {
  const rx = 26 * e.scale, ry = 36 * e.scale;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.rotation);

  // glow
  ctx.shadowColor = e.color; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.shadowBlur = 0;

  // shadow
  ctx.beginPath(); ctx.ellipse(3,6,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fill();

  // body
  ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle = e.color; ctx.fill();

  // pattern clipped inside egg
  ctx.save();
  ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2); ctx.clip();
  ctx.globalAlpha = 0.52;

  if (e.pattern === 'stripes') {
    ctx.strokeStyle = e.accent; ctx.lineWidth = 3.5;
    for (let i=-3; i<=3; i++) {
      ctx.beginPath();
      ctx.moveTo(-rx*1.5, i*ry*0.38);
      ctx.lineTo( rx*1.5, i*ry*0.38);
      ctx.stroke();
    }
  } else if (e.pattern === 'zigzag') {
    ctx.strokeStyle = e.accent; ctx.lineWidth = 2.5;
    for (let row=-2; row<=2; row++) {
      const yb = row*ry*0.42; ctx.beginPath(); let first=true;
      for (let xi=-rx*1.2; xi<=rx*1.2; xi+=rx*0.35) {
        const yy = yb + (Math.round((xi+rx*1.2)/(rx*0.35))%2===0 ? -7*e.scale : 7*e.scale);
        first ? ctx.moveTo(xi,yy) : ctx.lineTo(xi,yy); first=false;
      }
      ctx.stroke();
    }
  } else if (e.pattern === 'dots') {
    ctx.fillStyle = e.accent; const sp = rx*0.52;
    for (let row=-2; row<=2; row++) for (let col=-2; col<=2; col++) {
      ctx.beginPath();
      ctx.arc(col*sp+(row%2===0?0:sp*0.5), row*sp*0.85, 3.5*e.scale, 0, Math.PI*2);
      ctx.fill();
    }
  } else {
    // diamonds
    ctx.strokeStyle = e.accent; ctx.lineWidth = 2;
    const sp2 = rx*0.6;
    for (let row=-2; row<=2; row++) for (let col=-2; col<=2; col++) {
      const ox=col*sp2+(row%2===0?0:sp2*0.5), oy=row*sp2*0.75;
      ctx.beginPath();
      ctx.moveTo(ox, oy-7*e.scale); ctx.lineTo(ox+6*e.scale, oy);
      ctx.lineTo(ox, oy+7*e.scale); ctx.lineTo(ox-6*e.scale, oy);
      ctx.closePath(); ctx.stroke();
    }
  }
  ctx.restore();

  ctx.globalAlpha = 1;
  // large shine
  ctx.beginPath(); ctx.ellipse(-rx*0.27,-ry*0.3,rx*0.22,ry*0.15,-0.4,0,Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
  // small shine
  ctx.beginPath(); ctx.ellipse(-rx*0.08,-ry*0.48,rx*0.09,ry*0.065,-0.4,0,Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();

  ctx.restore();
}

// ------ Mid-air pop burst -----------------------------------
function drawPop(e) {
  ctx.save(); ctx.translate(e.x, e.y);
  e.popAlpha = Math.max(0, 1 - e.popR/100);
  ctx.globalAlpha = e.popAlpha;
  for (let ring=0; ring<3; ring++) {
    const r = e.popR * (0.5 + ring*0.28);
    ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
    ctx.strokeStyle = EGG_COLORS[(EGG_COLORS.indexOf(e.color)+ring) % EGG_COLORS.length];
    ctx.lineWidth = 5-ring; ctx.stroke();
  }
  for (let i=0; i<12; i++) {
    const a = (i/12)*Math.PI*2, pr = e.popR*0.9;
    ctx.beginPath(); ctx.arc(Math.cos(a)*pr, Math.sin(a)*pr, 6, 0, Math.PI*2);
    ctx.fillStyle = EGG_COLORS[i % EGG_COLORS.length]; ctx.fill();
  }
  ctx.restore();
}

// ------ Splat (albumen + yolk + curved shell pieces) --------
function createSplat(x, color) {
  // yolk
  const blobPts = [];
  const arms    = 10 + Math.floor(Math.random()*5);
  for (let i=0; i<arms; i++)
    blobPts.push({ a:(i/arms)*Math.PI*2, r:10+Math.random()*14 });

  // albumen (egg white)
  const whitePts = [];
  const wArms    = 12 + Math.floor(Math.random()*5);
  for (let i=0; i<wArms; i++)
    whitePts.push({ a:(i/wArms)*Math.PI*2, r:20+Math.random()*22 });

  // drips
  const drops = [];
  whitePts.forEach((p,i) => {
    if (i%3===0) drops.push({ dx:Math.cos(p.a)*p.r*1.4, dy:Math.sin(p.a)*p.r*0.38, r:2+Math.random()*4, isWhite:true });
    if (i%4===0) drops.push({ dx:Math.cos(p.a)*p.r*0.6, dy:Math.sin(p.a)*p.r*0.6*0.38, r:1.5+Math.random()*3, isWhite:false });
  });

  // curved shell pieces — arc shaped like real broken eggshell
  const shells      = [];
  const shardCount  = 5 + Math.floor(Math.random()*4);
  for (let i=0; i<shardCount; i++) {
    const angle    = Math.random()*Math.PI*2;
    const dist     = 26 + Math.random()*38;
    const arcSize  = (0.4 + Math.random()*0.5)*Math.PI;
    const arcStart = Math.random()*Math.PI*2;
    const outerR   = 12 + Math.random()*12;
    const innerR   = outerR * 0.55;
    const tilt     = (Math.random()-0.5)*0.8;
    shells.push({
      cx: Math.cos(angle)*dist,
      cy: Math.sin(angle)*dist*0.35,
      arcStart, arcSize, outerR, innerR, tilt, color,
    });
  }

  return {
    x, y: GROUND_Y, color,
    blobPts, whitePts, drops, shells,
    alpha: 1, born: performance.now(),
  };
}

function drawSplat(s) {
  ctx.save(); ctx.globalAlpha = s.alpha; ctx.translate(s.x, s.y);
  ctx.scale(1, 0.38);

  // albumen
  ctx.beginPath();
  s.whitePts.forEach((p,i) => {
    const px=Math.cos(p.a)*p.r, py=Math.sin(p.a)*p.r;
    i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.82)'; ctx.fill();
  ctx.strokeStyle = 'rgba(220,220,220,0.5)'; ctx.lineWidth=1.5; ctx.stroke();

  // yolk
  ctx.beginPath();
  s.blobPts.forEach((p,i) => {
    const px=Math.cos(p.a)*p.r, py=Math.sin(p.a)*p.r;
    i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
  });
  ctx.closePath(); ctx.fillStyle=s.color; ctx.fill();

  // yolk shine
  ctx.beginPath(); ctx.ellipse(-4,-4,6,5,0,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fill();

  ctx.restore();
  ctx.save(); ctx.globalAlpha=s.alpha; ctx.translate(s.x,s.y);

  // drip drops
  s.drops.forEach(d => {
    ctx.beginPath(); ctx.ellipse(d.dx,d.dy,d.r,d.r*0.5,0,0,Math.PI*2);
    ctx.fillStyle = d.isWhite ? 'rgba(255,255,255,0.75)' : s.color; ctx.fill();
  });

  // curved shell pieces
  s.shells.forEach(sh => {
    ctx.save(); ctx.translate(sh.cx,sh.cy); ctx.rotate(sh.tilt); ctx.scale(1,0.45);
    ctx.beginPath();
    ctx.arc(0,0,sh.outerR,sh.arcStart,sh.arcStart+sh.arcSize);
    ctx.arc(0,0,sh.innerR,sh.arcStart+sh.arcSize,sh.arcStart,true);
    ctx.closePath();
    ctx.fillStyle='rgba(255,252,240,0.95)'; ctx.fill();
    ctx.strokeStyle=sh.color; ctx.lineWidth=1.5; ctx.stroke();
    // inner shadow for depth
    ctx.beginPath();
    ctx.arc(0,0,sh.innerR+1,sh.arcStart,sh.arcStart+sh.arcSize);
    ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=2; ctx.stroke();
    // egg color stripe on shell
    const midR=(sh.outerR+sh.innerR)/2;
    ctx.beginPath();
    ctx.arc(0,0,midR,sh.arcStart+sh.arcSize*0.2,sh.arcStart+sh.arcSize*0.8);
    ctx.strokeStyle=sh.color+'99'; ctx.lineWidth=2; ctx.stroke();
    ctx.restore();
  });

  ctx.restore();
}

// ------ DOM confetti burst ----------------------------------
function spawnConfetti(tapX, tapY) {
  const container = document.getElementById('burst-container');
  if (!container) return;
  for (let i=0; i<32; i++) {
    const dot  = document.createElement('div');
    dot.className = 'confetti-dot';
    const a    = Math.random()*360, dist=60+Math.random()*140, size=6+Math.random()*10;
    dot.style.cssText=`left:${tapX}px;top:${tapY}px;width:${size}px;height:${size}px;background:${EGG_COLORS[Math.floor(Math.random()*EGG_COLORS.length)]};--dx:${Math.cos(a*Math.PI/180)*dist}px;--dy:${Math.sin(a*Math.PI/180)*dist}px`;
    container.appendChild(dot);
    setTimeout(()=>dot.remove(), 950);
  }
}

// ------ Tap detection ---------------------------------------
function handleTap(clientX, clientY) {
  if (!gameActive) return;
  const rect = canvas.getBoundingClientRect();
  const tapX = clientX - rect.left;
  const tapY = clientY - rect.top;

  for (let i=eggs.length-1; i>=0; i--) {
    const e=eggs[i]; if (e.popping) continue;
    const rx=26*e.scale, ry=36*e.scale, dx=tapX-e.x, dy=tapY-e.y;
    if ((dx*dx)/(rx*rx)+(dy*dy)/(ry*ry)<=1) {
      e.alive=false; e.popping=true; e.popR=0; e.popAlpha=1;
      playSound('assets/crack.mp3');
      spawnConfetti(tapX, tapY);
      gameActive=false; clearInterval(spawnTimer);
      setTimeout(()=>{ showScreen(3); startLoading(); }, 700);
      return;
    }
  }
}

// ------ Game loop -------------------------------------------
function gameLoop() {
  drawScene();
  const now = performance.now();

  // splats under eggs
  splats = splats.filter(s => {
    const age = now - s.born;
    s.alpha   = Math.max(0, 1-(age-1600)/1400);
    drawSplat(s); return s.alpha>0;
  });

  eggs = eggs.filter(e => {
    if (e.popping) { e.popR+=6; drawPop(e); return e.popAlpha>0; }
    e.vy  = Math.min(e.vy + e.acc, 7.5);
    e.y  += e.vy; e.x += e.vx;
    e.wobble += 0.04; e.rotation += e.rotSpeed;
    if (e.y + 36*e.scale >= GROUND_Y) {
      playSound('assets/splat.mp3');
      splats.push(createSplat(e.x, e.color));
      return false;
    }
    drawEgg(e); return e.alive;
  });

  if (gameActive || eggs.some(e=>e.popping) || splats.length>0)
    requestAnimationFrame(gameLoop);
}

// ------ Dramatic entrance -----------------------------------
function dramaticEntrance() {
  for (let i=0; i<22; i++) {
    setTimeout(()=>{
      const e = createEgg(null, true);
      eggs.push(e);
    }, i*80);
  }
  // after entrance, ramp up to full speed
  setTimeout(()=>{
    eggs.forEach(e=>{ e.vy=EGG_MIN_SPD+Math.random()*(EGG_MAX_SPD-EGG_MIN_SPD); });
    spawnTimer = setInterval(()=>{ if(gameActive) eggs.push(createEgg()); }, SPAWN_RATE);
  }, 2200);
}

// ------ Init ------------------------------------------------
function initGame() {
  canvas     = document.getElementById('egg-canvas');
  ctx        = canvas.getContext('2d');
  eggs       = [];
  splats     = [];
  gameActive = true;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    GROUND_Y      = canvas.height - 85;
    buildGrass();
    buildClouds();
  }
  resize();
  window.addEventListener('resize', resize);

  canvas.addEventListener('click', e => handleTap(e.clientX, e.clientY));
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    handleTap(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  dramaticEntrance();
  gameLoop();
}