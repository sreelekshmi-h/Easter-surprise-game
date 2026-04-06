// ============================================================
//  game.js  —  Egg Falling Game  (Screen 2)
// ============================================================

// ------ Constants -------------------------------------------
const EGG_COLORS  = ['#ff6eb4','#ffd94a','#5dde7a','#b06aff','#4fc3f7','#ff9f43'];
const SPAWN_RATE  = 1200;   // ms between new eggs
const EGG_MIN_SPD = 1.8;
const EGG_MAX_SPD = 4.2;
const EGG_RADIUS  = 34;     // half-height of egg hitbox

let canvas, ctx;
let eggs       = [];
let spawnTimer = null;
let gameActive = false;

// ------ Audio -----------------------------------------------
function playSound(src) {
  try {
    const a = new Audio(src);
    a.volume = 0.7;
    a.play().catch(() => {});
  } catch(e) {}
}

// ------ Egg object ------------------------------------------
function createEgg() {
  const colorIdx = Math.floor(Math.random() * EGG_COLORS.length);
  return {
    x      : EGG_RADIUS + Math.random() * (canvas.width - EGG_RADIUS * 2),
    y      : -EGG_RADIUS,
    vy     : EGG_MIN_SPD + Math.random() * (EGG_MAX_SPD - EGG_MIN_SPD),
    color  : EGG_COLORS[colorIdx],
    scale  : 0.85 + Math.random() * 0.35,
    wobble : Math.random() * Math.PI * 2,
    alive  : true,
    popping: false,
    popR   : 0,
  };
}

// ------ Draw a single egg -----------------------------------
function drawEgg(e) {
  ctx.save();
  ctx.translate(e.x, e.y);

  const sway = Math.sin(e.wobble) * 6;
  ctx.translate(sway, 0);

  const rx = EGG_RADIUS * 0.72 * e.scale;
  const ry = EGG_RADIUS * e.scale;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(2, 4, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = e.color;
  ctx.fill();

  // Stripe
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = rx * 0.55;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.5, ry * 0.15);
  ctx.lineTo( rx * 1.5, ry * 0.15);
  ctx.stroke();
  ctx.restore();

  // Shine dot
  ctx.beginPath();
  ctx.ellipse(-rx * 0.28, -ry * 0.32, rx * 0.22, ry * 0.16, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();

  ctx.restore();
}

// ------ Draw pop burst --------------------------------------
function drawPop(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  const r = e.popR;

  // Expanding ring
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = e.color;
  ctx.lineWidth   = 6;
  ctx.globalAlpha = Math.max(0, 1 - r / 90);
  ctx.stroke();

  // Particles
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const px = Math.cos(angle) * r * 0.85;
    const py = Math.sin(angle) * r * 0.85;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle   = EGG_COLORS[i % EGG_COLORS.length];
    ctx.globalAlpha = Math.max(0, 1 - r / 90);
    ctx.fill();
  }

  ctx.restore();
}

// ------ Main game loop --------------------------------------
function gameLoop() {
  if (!gameActive) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  eggs = eggs.filter(e => {
    if (e.popping) {
      e.popR += 5;
      drawPop(e);
      return e.popR < 90;
    }

    e.y      += e.vy;
    e.wobble += 0.04;

    if (e.y - EGG_RADIUS > canvas.height) {
      playSound('assets/splat.mp3');
      return false;
    }

    drawEgg(e);
    return e.alive;
  });

  requestAnimationFrame(gameLoop);
}

// ------ Tap / click detection --------------------------------
function handleTap(clientX, clientY) {
  if (!gameActive) return;

  const rect = canvas.getBoundingClientRect();
  const tapX = clientX - rect.left;
  const tapY = clientY - rect.top;

  for (let i = eggs.length - 1; i >= 0; i--) {
    const e = eggs[i];
    if (e.popping) continue;

    const dx = tapX - e.x;
    const dy = tapY - e.y;
    const rx = EGG_RADIUS * 0.72 * e.scale;
    const ry = EGG_RADIUS * e.scale;

    // Ellipse hit test
    if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
      e.alive   = false;
      e.popping = true;
      e.popR    = 0;

      playSound('assets/crack.mp3');
      spawnConfetti(clientX, clientY);

      // Stop the game, then move to Screen 3
      gameActive = false;
      clearInterval(spawnTimer);

      setTimeout(() => {
        showScreen(3);
        startLoading();
      }, 700);

      return; // only pop one egg per tap
    }
  }
}

// ------ DOM confetti burst ----------------------------------
function spawnConfetti(cx, cy) {
  const container = document.getElementById('burst-container');
  if (!container) return;

  for (let i = 0; i < 28; i++) {
    const dot   = document.createElement('div');
    dot.className = 'confetti-dot';
    const angle = Math.random() * 360;
    const dist  = 60 + Math.random() * 120;
    const dx    = Math.cos(angle * Math.PI / 180) * dist;
    const dy    = Math.sin(angle * Math.PI / 180) * dist;
    dot.style.cssText = `
      left: ${cx}px; top: ${cy}px;
      background: ${EGG_COLORS[Math.floor(Math.random() * EGG_COLORS.length)]};
      --dx: ${dx}px; --dy: ${dy}px;
    `;
    container.appendChild(dot);
    setTimeout(() => dot.remove(), 900);
  }
}

// ------ Init — called by transitions.js when Screen 2 opens --
function initGame() {
  canvas     = document.getElementById('egg-canvas');
  ctx        = canvas.getContext('2d');
  eggs       = [];
  gameActive = true;

  // Fit canvas to window
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ✅ Event listeners are INSIDE initGame so canvas is guaranteed to exist
  canvas.addEventListener('click', e => handleTap(e.clientX, e.clientY));
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    handleTap(t.clientX, t.clientY);
  }, { passive: false });

  // Spawn two eggs immediately
  eggs.push(createEgg());
  eggs.push(createEgg());

  // Then keep spawning
  spawnTimer = setInterval(() => {
    if (gameActive) eggs.push(createEgg());
  }, SPAWN_RATE);

  gameLoop();
}