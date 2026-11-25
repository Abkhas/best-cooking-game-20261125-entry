# Sizzle & Serve — Warung Rush

A cooking game for make.fun's best-cooking-game-20261125-0137 bounty.

## The game

You run a small warung kitchen for one 3-minute shift. Tickets land on
the order board with a patience bar. Walk the cook (WASD / arrows, or
click to move), press E at a station:

- **Crates** (left wall) — pick up rice, noodle, egg, chicken, veg, chili.
- **Chop board** — raw chicken and veg need chopping first.
- **Woks** (two burners) — drop a recipe's ingredients in to cook. Take
  the dish out when READY — leave it and it burns.
- **Plate counter** — plate the cooked dish.
- **Serve window** — serve the dish its ticket asked for.

Four recipes (Nasi Goreng, Mie Goreng, Ayam Geprek, Soto Ayam) unlock
across the shift. Serve fast for a patience bonus; chain serves for a
combo. Let a ticket's patience run out and you lose a heart. Three
hearts, one shift, then the summary screen.

## Play it

```sh
# serve game/ and open it in a desktop browser
python3 -m http.server 8080 --directory game
# or: node serve (see below)
```

No build step, no network: `game/index.html` plus its modules, all
drawn in code, sounds synthesized with WebAudio.

## Screenshots

`screenshots/` holds four real renders of the game in a browser
(1-service is the cover): the order board, the cook mid-shift, both
woks going, and a plated dish on its way to the serve window. They
were taken headless from the game's own `?shot=` states — see
`game/src/shots.js`.

## Design notes

Two decisions shape how the game plays. First, the prep island sits
between the crates and the woks on purpose: every dish forces a route
— crates, board, wok, plate, serve window — so an order is a planning
problem (which ticket first, which wok is free, what can be carried
together), not a fetch quest. A straight line from crate to wok would
have made the kitchen a corridor. Second, patience pays a bonus
instead of a flat price: a dish served with patience left earns up to
40% more, and the combo adds 10 coins a serve. Serving fast matters
more than serving at all, which is what makes the combo meaningful —
it rewards a cook who reads the board and chains serves, not one who
clears tickets in any order.

## Verify the hand-in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `game/` + `screenshots/` to `out/` and writes
`out/dossier.json`. The headless self-test plays one full order
through the real interact path:

```sh
# served in a headless browser; the page reports SELFTEST PASS
chromium --headless=new --dump-dom "http://localhost:8080/index.html?selftest=1"
```

## Tech

- Plain Canvas 2D, no libraries, no assets — every sprite is drawn.
- `game/src/recipes.js` — dishes and ingredients.
- `game/src/kitchen.js` — the floor, stations, furniture, collision.
- `game/src/orders.js` — the order board, patience, scoring, combos.
- `game/src/cook.js` — movement, hands, chop / cook / plate / serve.
- `game/src/render.js` — all drawing: kitchen, cook, tickets, HUD.
- `game/src/audio.js` — synthesized WebAudio blips.
- `game/src/shots.js` — staged screenshot scenes + the self-test.
- `game/src/main.js` — boot, loop, input, shift phases.
