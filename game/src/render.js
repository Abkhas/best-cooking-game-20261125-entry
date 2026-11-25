// Sizzle & Serve: everything the player sees — the kitchen, the cook,
// the order board, the timer, the steam. All art is drawn in code;
// no image files. Readable at a glance is the whole point: big labels,
// big timers, big food.

import { INGREDIENTS } from './recipes.js';
import { STATIONS, DECOR, VIEW_W, VIEW_H, HUD_H, BOARD_H } from './kitchen.js';
import { SHIFT_SECONDS } from './orders.js';

const PALETTE = {
  wall: '#f6ead2', floor: '#e8b48a', floorAlt: '#e5ad84',
  counter: '#8d5a2b', counterTop: '#b5773a', crate: '#a4713b',
  board: '#d9a066', wok: '#37474f', plate: '#eceff1',
  serve: '#2e7d32', trash: '#616161', ink: '#3e2723',
  ticket: '#fffde7', ticketEdge: '#f9a825', danger: '#e53935',
  ok: '#43a047', hud: '#263238',
};

const particles = [];
const floats = [];

export function spawnSteam(x, y) {
  if (particles.length > 60) return;
  particles.push({ x: x + (Math.random() - 0.5) * 30, y, r: 6 + Math.random() * 8, vy: -22 - Math.random() * 14, life: 0.9 });
}

export function floatText(x, y, text, color = '#2e7d32') {
  floats.push({ x, y, text, color, life: 1.2 });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', bold = true) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700' : '400'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One ingredient drawn as a small vector icon, centred at (x, y), radius r. */
export function drawIngredient(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'rice') {
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath(); ctx.arc(0, 2, r, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(-r, 0, r * 2, 3);
  } else if (id === 'noodle') {
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r, i * r * 0.45);
      ctx.quadraticCurveTo(0, i * r * 0.45 - r * 0.5, r, i * r * 0.45);
      ctx.stroke();
    }
  } else if (id === 'egg') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb300';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'chicken') {
    ctx.fillStyle = '#ef9a6a';
    ctx.beginPath(); ctx.arc(-r * 0.2, 0, r * 0.75, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff8e7'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r * 0.4, -r * 0.2); ctx.lineTo(r * 0.95, -r * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.4, r * 0.2); ctx.lineTo(r * 0.95, r * 0.7); ctx.stroke();
  } else if (id === 'veg') {
    ctx.fillStyle = '#66bb6a';
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.7;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, r * 0.55, r * 0.28, a, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'chili') {
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = r * 0.55; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.8, Math.PI * 0.15, Math.PI * 0.85, false); ctx.stroke();
    ctx.strokeStyle = '#43a047'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.75); ctx.lineTo(-r * 0.95, -r * 1.05); ctx.stroke();
  } else if (id.startsWith('dish:')) {
    ctx.fillStyle = '#eceff1';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath(); ctx.arc(0, -r * 0.15, r * 0.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawStation(ctx, s, cook, now) {
  const near = cook && Math.hypot(cook.x - (s.x + s.w / 2), cook.y - (s.y + s.h / 2)) < 90;
  ctx.save();
  if (s.kind === 'crate') {
    ctx.fillStyle = PALETTE.crate;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(s.x + 6, s.y + 6, s.w - 12, 10);
    drawIngredient(ctx, s.gives, s.x + s.w / 2, s.y + 38, 20);
    text(ctx, s.label, s.x + s.w / 2, s.y + s.h - 14, 13, '#fff8e7', 'center');
  } else if (s.kind === 'board') {
    ctx.fillStyle = PALETTE.board;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8); ctx.fill();
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(s.x + 18, s.y + 18, 46, 8);
    ctx.fillRect(s.x + 18, s.y + 34, 46, 8);
    text(ctx, 'CHOP', s.x + s.w / 2, s.y + s.h - 13, 13, '#4e342e', 'center');
    if (cook && cook.chopping) {
      const p = cook.chopping.done / cook.chopping.total;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(s.x, s.y - 14, s.w, 9);
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(s.x, s.y - 14, s.w * p, 9);
    }
  } else if (s.kind === 'wok') {
    const wok = s.id === 'wok2' ? cook.wok2 : cook.wok;
    ctx.fillStyle = PALETTE.wok;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8); ctx.fill();
    ctx.fillStyle = '#263238';
    ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + 40, 34, 0, Math.PI * 2); ctx.fill();
    if (wok.items.length > 0) {
      ctx.fillStyle = wok.burnt ? '#3e2723' : '#ff8f00';
      ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + 40, 26, 0, Math.PI * 2); ctx.fill();
      // the dish itself: its ingredients showing in the pan
      wok.items.forEach((item, i) => {
        const a = (i / wok.items.length) * Math.PI * 2;
        drawIngredient(ctx, item.id, s.x + s.w / 2 + Math.cos(a) * 11, s.y + 40 + Math.sin(a) * 11, 8);
      });
      if (wok.ready && !wok.burnt) {
        text(ctx, 'READY!', s.x + s.w / 2, s.y + 40, 13, '#fff', 'center');
      }
    }
    if (wok.cooking > 0 && !wok.ready) {
      const p = Math.min(1, wok.cooking / wok.cookTime);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(s.x, s.y - 14, s.w, 9);
      ctx.fillStyle = '#ff7043';
      ctx.fillRect(s.x, s.y - 14, s.w * p, 9);
    }
    if (wok.burnt) text(ctx, 'BURNT!', s.x + s.w / 2, s.y - 24, 13, PALETTE.danger, 'center');
    text(ctx, s.label, s.x + s.w / 2, s.y + s.h - 13, 13, '#eceff1', 'center');
    if (wok.items.length > 0 && Math.random() < 0.25) spawnSteam(s.x + s.w / 2, s.y + 10);
  } else if (s.kind === 'plate') {
    ctx.fillStyle = PALETTE.plate;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8); ctx.fill();
    if (cook.plate) {
      drawIngredient(ctx, `dish:${cook.plate}`, s.x + s.w / 2, s.y + 38, 22);
      text(ctx, cook.plateName().toUpperCase(), s.x + s.w / 2, s.y + s.h - 13, 12, '#3e2723', 'center');
    } else {
      ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + 38, 22, 0, Math.PI * 2); ctx.stroke();
      text(ctx, 'PLATE', s.x + s.w / 2, s.y + s.h - 13, 13, '#78909c', 'center');
    }
  } else if (s.kind === 'serve') {
    ctx.fillStyle = PALETTE.serve;
    roundRect(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
    ctx.fillStyle = '#c8e6c9';
    roundRect(ctx, s.x + 10, s.y + 10, s.w - 20, 54, 6); ctx.fill();
    text(ctx, 'SERVE', s.x + s.w / 2, s.y + 38, 18, '#1b5e20', 'center');
    text(ctx, 'WINDOW', s.x + s.w / 2, s.y + 96, 13, '#e8f5e9', 'center');
    text(ctx, 'E to serve', s.x + s.w / 2, s.y + 122, 12, '#c8e6c9', 'center');
    text(ctx, 'the dish', s.x + s.w / 2, s.y + 142, 12, '#c8e6c9', 'center');
  } else if (s.kind === 'trash') {
    ctx.fillStyle = PALETTE.trash;
    roundRect(ctx, s.x, s.y, s.w, s.h, 8); ctx.fill();
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath(); ctx.moveTo(s.x + 26, s.y + 26); ctx.lineTo(s.x + 66, s.y + 26); ctx.lineTo(s.x + 60, s.y + 66); ctx.lineTo(s.x + 32, s.y + 66); ctx.closePath(); ctx.fill();
    text(ctx, 'TRASH', s.x + s.w / 2, s.y + s.h - 13, 13, '#eeeeee', 'center');
  }
  if (near) {
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 3;
    roundRect(ctx, s.x - 3, s.y - 3, s.w + 6, s.h + 6, 10); ctx.stroke();
  }
  ctx.restore();
}

function drawCook(ctx, cook) {
  const { x, y } = cook;
  ctx.save();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(x, y + 18, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  // body (apron)
  ctx.fillStyle = '#eceff1';
  roundRect(ctx, x - 16, y - 6, 32, 26, 8); ctx.fill();
  ctx.fillStyle = '#ef5350';
  ctx.fillRect(x - 16, y + 8, 32, 5);
  // head + chef hat
  ctx.fillStyle = '#ffccbc';
  ctx.beginPath(); ctx.arc(x, y - 16, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x - 8, y - 26, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 8, y - 26, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 30, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 13, y - 28, 26, 6);
  // face
  ctx.fillStyle = '#3e2723';
  ctx.beginPath(); ctx.arc(x - 5, y - 17, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5, y - 17, 1.8, 0, Math.PI * 2); ctx.fill();
  // carried items float above
  cook.carrying.forEach((item, i) => {
    const ix = x + (i - (cook.carrying.length - 1) / 2) * 26;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(ix, y - 48, 12, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, item.id, ix, y - 48, 9);
  });
  // action bubble
  if (cook.actionTimer > 0) {
    ctx.fillStyle = 'rgba(38,50,56,0.92)';
    const w = ctx.measureText(cook.actionText).width + 24;
    roundRect(ctx, x - w / 2, y - 84, w, 26, 13); ctx.fill();
    text(ctx, cook.actionText, x, y - 71, 13, '#fff', 'center');
  }
  ctx.restore();
}

function drawTickets(ctx, board) {
  const x0 = 24;
  const y0 = HUD_H + 8;
  const w = 196;
  const h = BOARD_H - 16;
  const gap = 12;
  text(ctx, 'ORDER BOARD', x0, y0 - 0 + 4, 12, '#8d6e63', 'left');
  board.tickets.forEach((t, i) => {
    const x = x0 + i * (w + gap);
    const y = y0 + 14;
    const low = t.patience < t.patienceMax * 0.3;
    ctx.fillStyle = PALETTE.ticket;
    roundRect(ctx, x, y, w, h - 14, 8); ctx.fill();
    ctx.strokeStyle = low ? PALETTE.danger : PALETTE.ticketEdge;
    ctx.lineWidth = low ? 3 : 2;
    roundRect(ctx, x, y, w, h - 14, 8); ctx.stroke();
    text(ctx, t.recipe.name.toUpperCase(), x + 10, y + 16, 15, PALETTE.ink, 'left');
    text(ctx, `$${t.recipe.price}`, x + w - 10, y + 16, 14, '#2e7d32', 'right');
    t.recipe.needs.forEach((need, j) => {
      drawIngredient(ctx, need, x + 22 + j * 34, y + 42, 12);
    });
    // patience bar
    const p = Math.max(0, t.patience / t.patienceMax);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    roundRect(ctx, x + 10, y + h - 26, w - 20, 8, 4); ctx.fill();
    ctx.fillStyle = low ? PALETTE.danger : (p > 0.6 ? PALETTE.ok : '#ffa000');
    roundRect(ctx, x + 10, y + h - 26, (w - 20) * p, 8, 4); ctx.fill();
  });
  if (board.tickets.length === 0) {
    text(ctx, 'No orders yet — tickets will appear here.', x0 + 220, y0 + 52, 14, '#8d6e63', 'left', false);
  }
}

function drawHud(ctx, board, elapsed, hearts, phase) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  text(ctx, 'SIZZLE & SERVE', 20, 24, 22, '#ffd54f', 'left');
  text(ctx, 'WARUNG RUSH', 20, 48, 11, '#b0bec5', 'left');
  // shift timer
  const left = Math.max(0, SHIFT_SECONDS - elapsed);
  const mm = Math.floor(left / 60);
  const ss = String(Math.floor(left % 60)).padStart(2, '0');
  const urgent = left < 30;
  text(ctx, `SHIFT ${mm}:${ss}`, 330, 32, 20, urgent ? '#ff8a65' : '#ffffff', 'left');
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(460, 22, 220, 12);
  ctx.fillStyle = urgent ? '#ff7043' : '#66bb6a';
  ctx.fillRect(460, 22, 220 * (left / SHIFT_SECONDS), 12);
  // coins / combo / served
  text(ctx, `🪙 ${board.coins}`, 740, 32, 20, '#ffd54f', 'left');
  text(ctx, board.combo > 1 ? `COMBO x${board.combo}` : 'COMBO —', 880, 32, 18, board.combo > 1 ? '#ff8a65' : '#90a4ae', 'left');
  text(ctx, `SERVED ${board.served}`, 1060, 32, 18, '#ffffff', 'left');
  // hearts: three small hearts top-right
  for (let i = 0; i < 3; i++) {
    const hx = 1230 - i * 26;
    const hy = 32;
    ctx.fillStyle = i < hearts ? '#ef5350' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 6);
    ctx.bezierCurveTo(hx - 10, hy - 4, hx - 5, hy - 11, hx, hy - 5);
    ctx.bezierCurveTo(hx + 5, hy - 11, hx + 10, hy - 4, hx, hy + 6);
    ctx.fill();
  }
  if (phase !== 'playing') return;
}

function drawDecor(ctx) {
  for (const d of DECOR) {
    if (d.kind === 'island') {
      ctx.fillStyle = '#6d4c41';
      roundRect(ctx, d.x, d.y, d.w, d.h, 10); ctx.fill();
      ctx.fillStyle = '#a1887f';
      roundRect(ctx, d.x + 8, d.y + 8, d.w - 16, d.h - 16, 8); ctx.fill();
      // bowls of prepped food on the island
      const bowls = ['rice', 'veg', 'chili', 'egg', 'noodle', 'chicken'];
      bowls.forEach((id, i) => {
        const bx = d.x + 50 + i * 88;
        ctx.fillStyle = '#eceff1';
        ctx.beginPath(); ctx.arc(bx, d.y + 42, 26, 0, Math.PI * 2); ctx.fill();
        drawIngredient(ctx, id, bx, d.y + 42, 16);
      });
      text(ctx, 'PREP ISLAND', d.x + d.w / 2, d.y + d.h - 10, 11, '#d7ccc8', 'center');
    } else if (d.kind === 'table') {
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(d.x + 30, d.y + d.h, 24, 26);
      ctx.fillRect(d.x + d.w - 54, d.y + d.h, 24, 26);
      ctx.fillStyle = '#bcaaa4';
      roundRect(ctx, d.x, d.y, d.w, d.h, 10); ctx.fill();
      ctx.fillStyle = '#eceff1';
      ctx.beginPath(); ctx.arc(d.x + 55, d.y + 45, 18, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(d.x + d.w - 55, d.y + 45, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8f00';
      ctx.beginPath(); ctx.arc(d.x + 55, d.y + 45, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(d.x + d.w - 55, d.y + 45, 10, 0, Math.PI * 2); ctx.fill();
      // chairs
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(d.x + 40, d.y - 14, 30, 12);
      ctx.fillRect(d.x + d.w - 70, d.y - 14, 30, 12);
    } else if (d.kind === 'plant') {
      ctx.fillStyle = '#a1887f';
      ctx.beginPath(); ctx.arc(d.x + 26, d.y + 36, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#43a047';
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.6;
        ctx.beginPath();
        ctx.ellipse(d.x + 26 + Math.cos(a) * 12, d.y + 18 + Math.sin(a) * 12, 14, 7, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // menu poster on the wall, right side
  ctx.fillStyle = '#fff8e1';
  roundRect(ctx, 1080, 500, 150, 96, 8); ctx.fill();
  ctx.strokeStyle = '#f9a825'; ctx.lineWidth = 3;
  roundRect(ctx, 1080, 500, 150, 96, 8); ctx.stroke();
  text(ctx, "TODAY'S MENU", 1155, 520, 13, '#e65100', 'center');
  text(ctx, 'Nasi Goreng $60', 1155, 544, 12, '#4e342e', 'center', false);
  text(ctx, 'Mie Goreng $70', 1155, 562, 12, '#4e342e', 'center', false);
  text(ctx, 'Ayam Geprek $90', 1155, 580, 12, '#4e342e', 'center', false);
}

export function drawGame(ctx, state) {
  const { cook, board, elapsed, hearts, phase } = state;
  // floor
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.floorAlt;
  for (let y = HUD_H + BOARD_H; y < VIEW_H; y += 64) {
    for (let x = ((y / 64) % 2) * 32; x < VIEW_W; x += 64) {
      ctx.fillRect(x, y, 32, 32);
    }
  }
  // rug under the work zone
  ctx.fillStyle = 'rgba(121,85,72,0.35)';
  roundRect(ctx, 260, 420, 700, 130, 16); ctx.fill();
  // wall band behind the board
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, HUD_H, VIEW_W, BOARD_H);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, HUD_H + BOARD_H - 6, VIEW_W, 6);
  // order board area
  drawTickets(ctx, board);
  // furniture first, then stations
  drawDecor(ctx);
  // stations
  for (const s of STATIONS) drawStation(ctx, s, cook, performance.now());
  // steam + floats
  for (const p of particles) {
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, p.life)})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  for (const f of floats) {
    text(ctx, f.text, f.x, f.y, 20, f.color, 'center');
  }
  // cook
  drawCook(ctx, cook);
  // HUD on top
  drawHud(ctx, board, elapsed, hearts, phase);
  // help line
  text(ctx, 'WASD / arrows to move  •  E to use a station  •  M to mute  •  R to restart', 20, VIEW_H - 16, 13, '#6d4c41', 'left', false);

  if (phase === 'title') {
    ctx.fillStyle = 'rgba(38,32,28,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'SIZZLE & SERVE', VIEW_W / 2, 240, 64, '#ffd54f', 'center');
    text(ctx, 'WARUNG RUSH', VIEW_W / 2, 300, 28, '#ffffff', 'center');
    text(ctx, 'Cook the orders before patience runs out.', VIEW_W / 2, 360, 20, '#ffe0b2', 'center', false);
    text(ctx, 'Pick ingredients → chop → wok → plate → serve', VIEW_W / 2, 396, 20, '#ffe0b2', 'center', false);
    text(ctx, 'Press ENTER or click to start the shift', VIEW_W / 2, 470, 22, '#ffffff', 'center');
    text(ctx, 'WASD / arrows move  •  E uses a station', VIEW_W / 2, 510, 16, '#bcaaa4', 'center', false);
  }
  if (phase === 'over') {
    ctx.fillStyle = 'rgba(38,32,28,0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'SHIFT OVER', VIEW_W / 2, 260, 56, '#ffd54f', 'center');
    text(ctx, `Dishes served: ${board.served}    Coins earned: ${board.coins}`, VIEW_W / 2, 340, 24, '#ffffff', 'center');
    text(ctx, `Best combo: x${board.bestCombo}    Orders lost: ${board.lost}`, VIEW_W / 2, 384, 20, '#ffe0b2', 'center', false);
    text(ctx, 'Press R to cook another shift', VIEW_W / 2, 460, 22, '#ffffff', 'center');
  }
}

/** Advance steam and floating text by dt seconds. */
export function tickParticles(dt) {
  for (const p of particles) { p.y += p.vy * dt; p.life -= dt; p.r += 6 * dt; }
  for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
  for (const f of floats) { f.y -= 30 * dt; f.life -= dt; }
  for (let i = floats.length - 1; i >= 0; i--) if (floats[i].life <= 0) floats.splice(i, 1);
}
