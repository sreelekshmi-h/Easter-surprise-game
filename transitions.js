// ============================================================
//  transitions.js  —  Screen switching + URL param reading
// ============================================================

// ------ Global prank params (read once, used everywhere) ----
const urlParams   = new URLSearchParams(window.location.search);
window.PRANK_FROM = urlParams.get('from') || 'A friend';
window.PRANK_TO   = urlParams.get('to')   || 'You';

// ------ Show the right screen on load -----------------------
document.addEventListener('DOMContentLoaded', () => {

  // Personalise Screen 1 greeting if a "from" name was passed
  const fromTag = document.getElementById('from-tag');
  if (fromTag && urlParams.get('from')) {
    fromTag.textContent = `🐣 From: ${window.PRANK_FROM}  →  To: ${window.PRANK_TO}`;
    fromTag.style.display = 'block';
  }

  // Wire up Screen 1 tap button → Screen 2
  const tapBtn = document.getElementById('tap-btn');
  if (tapBtn) tapBtn.addEventListener('click', () => showScreen(2));

  // Always start on Screen 1
  showScreen(1);
});

// ------ Core transition function ----------------------------
/**
 * showScreen(n)
 * Hides every screen, then fades in screen-n.
 * Automatically starts the egg game when showing Screen 2.
 *
 * @param {number} n  — screen number (1–5)
 */
function showScreen(n) {
  const all = document.querySelectorAll('.screen');

  all.forEach(s => s.classList.remove('active'));

  const target = document.getElementById(`screen-${n}`);
  if (!target) {
    console.warn(`showScreen: no element with id "screen-${n}"`);
    return;
  }

  setTimeout(() => {
    target.classList.add('active');

    // Start the egg game as soon as Screen 2 is visible
    if (n === 2) initGame();

  }, 80);

  console.log(`▶ Screen ${n} active`);
}