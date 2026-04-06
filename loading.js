// ============================================================
//  loading.js  —  Loading Bar + Sound + Prank Reveal (Screens 3 & 4)
// ============================================================

// ------ Config ----------------------------------------------
const LOAD_DURATION = 4000;  // total ms to fill the bar
const LOAD_MESSAGES = [
  'Loading your prize...',
  'Preparing surprise...',
  'Almost there...',
  'Just a sec...',
  'Getting it ready...',
];

let loadInterval  = null;
let msgInterval   = null;
let loadStartTime = null;
let loadRunning   = false;   // ✅ guard against double-calls

// ------ Audio -----------------------------------------------
function playSoundL(src) {
  try {
    const a = new Audio(src);
    a.volume = 0.85;
    a.play().catch(() => {});
  } catch(e) {}
}

// ------ Cycle loading messages ------------------------------
function startMessageCycle() {
  const el = document.getElementById('loading-text');
  let idx  = 0;

  if (el) el.textContent = LOAD_MESSAGES[0];

  msgInterval = setInterval(() => {
    idx = (idx + 1) % LOAD_MESSAGES.length;
    if (el) {
      el.style.opacity = '0';           // fade out
      setTimeout(() => {
        el.textContent   = LOAD_MESSAGES[idx];
        el.style.opacity = '1';         // fade in
        // Note: add  transition: opacity 0.25s ease;  to #loading-text in style.css
      }, 250);
    }
  }, LOAD_DURATION / LOAD_MESSAGES.length);
}

// ------ Main loading bar — called from game.js --------------
function startLoading() {
  if (loadRunning) return;   // ✅ prevent double trigger
  loadRunning = true;

  const bar   = document.getElementById('loading-bar');
  const pctEl = document.getElementById('loading-pct');
  if (!bar || !pctEl) return;

  // Reset visuals
  bar.style.width   = '0%';
  pctEl.textContent = '0%';
  loadStartTime     = performance.now();

  startMessageCycle();

  loadInterval = setInterval(() => {
    const elapsed = performance.now() - loadStartTime;
    const pct     = Math.min(100, Math.round((elapsed / LOAD_DURATION) * 100));

    bar.style.width   = pct + '%';
    pctEl.textContent = pct + '%';

    if (pct >= 100) {
      clearInterval(loadInterval);
      clearInterval(msgInterval);
      loadRunning = false;
      onLoadComplete();
    }
  }, 30);
}

// ------ Called when bar hits 100% ---------------------------
function onLoadComplete() {
  setTimeout(() => {
    playSoundL('assets/fahh.mp3');
    showScreen(4);
    triggerReveal();
  }, 300);
}

// ------ Screen 4 — Husky reveal + confetti ------------------
function triggerReveal() {
  // Restart husky gif animation cleanly
  const husky = document.getElementById('husky-gif');
  if (husky) {
    husky.style.animation = 'none';
    void husky.offsetWidth;   // force reflow
    husky.style.animation = '';
  }

  spawnRevealConfetti();

  // Wire "prank your friends" button → Screen 5
  const btn = document.getElementById('to-screen5');
  if (btn) btn.onclick = () => showScreen(5);
}

// ------ Fullscreen confetti rain for Screen 4 ---------------
function spawnRevealConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  const colors = ['#ff6eb4','#ffd94a','#5dde7a','#b06aff','#4fc3f7','#ff9f43','#ff4757','#ffffff'];
  const shapes = ['circle', 'square', 'ribbon'];

  let wave = 0;
  const maxWaves = 6;

  function spawnWave() {
    for (let i = 0; i < 22; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';

      const shape  = shapes[Math.floor(Math.random() * shapes.length)];
      piece.classList.add(`confetti-${shape}`);

      const color  = colors[Math.floor(Math.random() * colors.length)];
      const startX = Math.random() * 100;
      const delay  = Math.random() * 0.6;
      const dur    = 1.8 + Math.random() * 1.4;
      const size   = 8 + Math.random() * 10;
      const drift  = (Math.random() - 0.5) * 200;

      piece.style.cssText = `
        left: ${startX}%;
        top: -20px;
        width: ${size}px;
        height: ${shape === 'ribbon' ? size * 2.5 : size}px;
        background: ${color};
        animation: confettiFall ${dur}s ${delay}s ease-in forwards;
        --drift: ${drift}px;
      `;

      container.appendChild(piece);
      setTimeout(() => piece.remove(), (dur + delay + 0.5) * 1000);
    }

    wave++;
    if (wave < maxWaves) setTimeout(spawnWave, 350);
  }

  spawnWave();
}