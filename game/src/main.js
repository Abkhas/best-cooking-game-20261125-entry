// Sizzle & Serve: boot, the game loop, input, and the shift's phases.
// Title → playing → shift over. One file owns the loop; the kitchen,
// the orders, the cook and the drawing each live in their own module.

import { Cook } from './cook.js';
import { OrderBoard, SHIFT_SECONDS } from './orders.js';
import { VIEW_W, VIEW_H } from './kitchen.js';
import { drawGame, tickParticles, spawnSteam, floatText } from './render.js';
import { Sfx } from './audio.js';
import { applyShot, runSelfTest } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const sfx = new Sfx();
const cook = new Cook();
const board = new OrderBoard();

const game = {
  phase: 'title', // 'title' | 'playing' | 'over'
  elapsed: 0,
  hearts: 3,
  cook, board,
};

const keys = new Set();
let clickTarget = null;

function resetShift() {
  cook.x = 640; cook.y = 560;
  cook.carrying = []; cook.chopping = null; cook.plate = null;
  cook.wok = { items: [], cooking: 0, cookTime: 0, ready: false, burnt: false, recipe: null };
  cook.wok2 = { items: [], cooking: 0, cookTime: 0, ready: false, burnt: false, recipe: null };
  board.tickets = []; board.served = 0; board.lost = 0;
  board.coins = 0; board.combo = 0; board.bestCombo = 0; board.comboTimer = 0;
  board.spawnIn = 2.5; board.nextId = 1;
  game.elapsed = 0;
  game.hearts = 3;
  game.phase = 'playing';
}

function startShift() {
  sfx.ensure();
  resetShift();
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (e.repeat) return;
  sfx.ensure();
  const k = e.key.toLowerCase();
  if (k === 'm') { sfx.muted = !sfx.muted; return; }
  if (k === 'r' && game.phase !== 'title') { startShift(); return; }
  if (game.phase === 'title' && (k === 'enter' || k === ' ')) { startShift(); return; }
  if (game.phase !== 'playing') return;
  if (k === 'e' || k === ' ') {
    const before = board.coins;
    cook.interact(board, sfx);
    if (board.coins > before) floatText(cook.x, cook.y - 60, `+${board.coins - before} coins`);
    return;
  }
  keys.add(k);
});

window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

canvas.addEventListener('pointerdown', (e) => {
  sfx.ensure();
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * VIEW_W;
  const y = ((e.clientY - rect.top) / rect.height) * VIEW_H;
  if (game.phase === 'title') { startShift(); return; }
  if (game.phase !== 'playing') return;
  clickTarget = { x, y };
  // A click right on a station uses it at once when in reach.
  const dx = x - cook.x;
  const dy = y - cook.y;
  if (Math.hypot(dx, dy) < 60) {
    const before = board.coins;
    cook.interact(board, sfx);
    if (board.coins > before) floatText(cook.x, cook.y - 60, `+${board.coins - before} coins`);
    clickTarget = null;
  }
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game.phase === 'playing') {
    game.elapsed += dt;
    let dx = 0;
    let dy = 0;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (dx !== 0 || dy !== 0) {
      clickTarget = null;
      cook.move(dx, dy, dt);
    } else if (clickTarget) {
      cook.moveToward(clickTarget.x, clickTarget.y, dt);
    } else {
      cook.move(0, 0, dt);
    }
    cook.tick(dt);
    const expired = board.update(dt, game.elapsed);
    if (expired > 0) {
      game.hearts -= expired;
      sfx.bell();
    }
    if (game.elapsed >= SHIFT_SECONDS || game.hearts <= 0) {
      game.phase = 'over';
      sfx.bell();
    }
  }
  tickParticles(dt);
  drawGame(ctx, game);
  requestAnimationFrame(frame);
}

// Staged screenshots (?shot=cover) and the scripted self-test (?selftest=1)
// are real renders of this same code, with the kitchen put in a fixed state.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(game, shot);
  drawGame(ctx, game);
} else if (params.get('selftest') === '1') {
  game.phase = 'playing';
  runSelfTest(game);
  drawGame(ctx, game);
}
requestAnimationFrame(frame);
