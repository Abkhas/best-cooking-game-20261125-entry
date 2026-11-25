// Sizzle & Serve: the cook — movement, hands, and every station action.
// The cook carries up to 3 items. An item is { id, prepped } where prepped
// means chopped where chopping was needed. The wok holds one dish at a
// time; the plate holds one finished dish.

import { INGREDIENTS, matchRecipe } from './recipes.js';
import { collidesWithStation, collidesWithDecor, insideRoom, nearestStation } from './kitchen.js';

export const CARRY_MAX = 3;
export const CHOP_SECONDS = 2.2;

export class Cook {
  constructor() {
    this.x = 640; this.y = 560;
    this.r = 20;
    this.speed = 250;
    this.dir = 'down';
    this.moving = false;
    this.carrying = []; // [{ id, prepped }]
    this.chopping = null; // { item, done, total } while at the board
    this.wok = { items: [], cooking: 0, cookTime: 0, ready: false, burnt: false, recipe: null };
    this.wok2 = { items: [], cooking: 0, cookTime: 0, ready: false, burnt: false, recipe: null };
    this.plate = null; // recipe id waiting on the plate counter
    this.actionText = '';
    this.actionTimer = 0;
  }

  move(dx, dy, dt) {
    if (dx === 0 && dy === 0) { this.moving = false; return; }
    const len = Math.hypot(dx, dy);
    const nx = this.x + (dx / len) * this.speed * dt;
    const ny = this.y + (dy / len) * this.speed * dt;
    const blocked = (px, py) => collidesWithStation(px, py, this.r) || collidesWithDecor(px, py, this.r);
    if (insideRoom(nx, this.y, this.r) && !blocked(nx, this.y)) this.x = nx;
    if (insideRoom(this.x, ny, this.r) && !blocked(this.x, ny)) this.y = ny;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    this.moving = true;
  }

  moveToward(tx, ty, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    if (Math.hypot(dx, dy) < 6) { this.moving = false; return; }
    this.move(dx, dy, dt);
  }

  say(text, seconds = 1.4) {
    this.actionText = text;
    this.actionTimer = seconds;
  }

  tick(dt) {
    if (this.actionTimer > 0) this.actionTimer -= dt;
    if (this.chopping) {
      const board = nearestStation(this.x, this.y);
      if (!board || board.kind !== 'board') {
        this.chopping = null;
        this.say('Chopping stopped.');
      } else {
        this.chopping.done += dt;
        if (this.chopping.done >= this.chopping.total) this.finishChop(this._sfx);
      }
    }
    for (const wok of [this.wok, this.wok2]) {
      if (wok.cooking > 0 && !wok.ready) {
        wok.cooking += dt;
        if (wok.cooking >= wok.cookTime) { wok.ready = true; wok.cooking = wok.cookTime; }
      } else if (wok.ready && !wok.burnt) {
        wok.cooking += dt;
        if (wok.cooking >= wok.cookTime + 5) wok.burnt = true;
      }
    }
  }

  /** The one interact key: what E does depends on the nearest station. */
  interact(board, sfx) {
    this._sfx = sfx;
    const station = nearestStation(this.x, this.y);
    if (!station) { this.say('Walk to a station!'); return; }
    if (station.kind === 'crate') return this.pickUp(station, sfx);
    if (station.kind === 'board') return this.chop(board, sfx);
    if (station.kind === 'wok') return this.useWok(station.id === 'wok2' ? this.wok2 : this.wok, sfx);
    if (station.kind === 'plate') return this.usePlate(sfx);
    if (station.kind === 'serve') return this.serve(board, sfx);
    if (station.kind === 'trash') return this.trash(sfx);
  }

  pickUp(station, sfx) {
    if (this.carrying.length >= CARRY_MAX) { this.say('Hands full!'); sfx?.deny(); return; }
    const ing = INGREDIENTS[station.gives];
    this.carrying.push({ id: station.gives, prepped: ing.prep === 'none' });
    this.say(`+ ${ing.name}`);
    sfx?.pickup();
  }

  chop(board, sfx) {
    const raw = this.carrying.find((c) => !c.prepped);
    if (!raw) { this.say('Nothing to chop!'); sfx?.deny(); return; }
    if (this.chopping) return;
    this.chopping = { item: raw, done: 0, total: CHOP_SECONDS };
    sfx?.chop();
  }

  finishChop(sfx) {
    if (!this.chopping) return;
    this.chopping.item.prepped = true;
    this.chopping = null;
    this.say('Chopped!');
    sfx?.done();
  }

  useWok(wok, sfx) {
    if (wok.ready) {
      if (wok.burnt) { this.say('Burnt! Trash it.'); sfx?.deny(); return; }
      this.takeFromWok(wok, sfx);
      return;
    }
    if (wok.cooking > 0) { this.say('Still cooking…'); return; }
    if (this.carrying.length === 0) { this.say('Bring ingredients!'); sfx?.deny(); return; }
    const unprepped = this.carrying.find((c) => !c.prepped);
    if (unprepped) { this.say(`${INGREDIENTS[unprepped.id].name} needs chopping!`); sfx?.deny(); return; }
    const recipe = matchRecipe(this.carrying.map((c) => c.id));
    if (!recipe) { this.say('That is no recipe!'); sfx?.deny(); return; }
    wok.items = [...this.carrying];
    wok.recipe = recipe;
    wok.cookTime = recipe.cookTime;
    wok.cooking = 0.01;
    this.carrying = [];
    this.say(`Cooking ${recipe.name}…`);
    sfx?.sizzle();
  }

  takeFromWok(wok, sfx) {
    if (this.carrying.length >= CARRY_MAX) { this.say('Hands full!'); sfx?.deny(); return; }
    this.carrying.push({ id: `dish:${wok.recipe.id}`, prepped: true });
    wok.items = []; wok.cooking = 0; wok.ready = false; wok.burnt = false; wok.recipe = null;
    this.say('Dish up!');
    sfx?.pickup();
  }

  usePlate(sfx) {
    const dish = this.carrying.find((c) => c.id.startsWith('dish:'));
    if (!dish) { this.say('Bring a cooked dish!'); sfx?.deny(); return; }
    if (this.plate !== null) { this.say('Plate is busy!'); sfx?.deny(); return; }
    this.plate = dish.id.slice(5);
    this.carrying = this.carrying.filter((c) => c !== dish);
    this.say(`${this.plateName()} plated — serve it!`);
    sfx?.done();
  }

  plateName() {
    if (!this.plate) return '';
    return this.plate.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  }

  serve(board, sfx) {
    if (this.plate === null) { this.say('Nothing to serve!'); sfx?.deny(); return; }
    const result = board.serveDish(this.plate);
    if (result.served) {
      this.say(`Served! +${result.coins}`);
      sfx?.serve();
    } else {
      board.wrongServe();
      this.say('Nobody ordered that!');
      sfx?.deny();
    }
    this.plate = null;
  }

  trash(sfx) {
    let cleared = false;
    for (const wok of [this.wok, this.wok2]) {
      if (wok.burnt || wok.items.length > 0) {
        wok.items = []; wok.cooking = 0; wok.ready = false; wok.burnt = false; wok.recipe = null;
        cleared = true;
      }
    }
    if (this.carrying.length > 0) { this.carrying = []; cleared = true; }
    if (this.plate !== null) { this.plate = null; cleared = true; }
    this.say(cleared ? 'Trashed.' : 'Nothing to trash.');
    if (cleared) sfx?.trash();
  }
}
