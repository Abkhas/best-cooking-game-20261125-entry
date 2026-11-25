// Sizzle & Serve: every dish and ingredient the warung can make.
// A recipe is a list of ingredients; each one names the prep it needs
// before it can go in the wok ('none' goes straight in, 'chop' needs
// the chopping board first). Cook time is seconds in the wok.

export const INGREDIENTS = {
  rice: { name: 'Rice', color: '#fff8e7', prep: 'none', icon: 'rice' },
  noodle: { name: 'Noodle', color: '#ffd54f', prep: 'none', icon: 'noodle' },
  egg: { name: 'Egg', color: '#ffe082', prep: 'none', icon: 'egg' },
  chicken: { name: 'Chicken', color: '#ef9a6a', prep: 'chop', icon: 'chicken' },
  veg: { name: 'Veg', color: '#81c784', prep: 'chop', icon: 'veg' },
  chili: { name: 'Chili', color: '#e53935', prep: 'none', icon: 'chili' },
};

export const RECIPES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng', price: 60, cookTime: 6,
    needs: ['rice', 'egg', 'chili'],
    blurb: 'Fried rice, egg, chili — the warung classic.',
  },
  {
    id: 'mie-goreng', name: 'Mie Goreng', price: 70, cookTime: 7,
    needs: ['noodle', 'egg', 'veg'],
    blurb: 'Fried noodles with egg and chopped veg.',
  },
  {
    id: 'ayam-geprek', name: 'Ayam Geprek', price: 90, cookTime: 8,
    needs: ['chicken', 'chili', 'rice'],
    blurb: 'Smashed fried chicken, chili, rice.',
  },
  {
    id: 'soto-ayam', name: 'Soto Ayam', price: 100, cookTime: 9,
    needs: ['chicken', 'veg', 'rice'],
    blurb: 'Chicken soup with veg, served over rice.',
  },
];

/** The recipes unlocked at a given moment of the shift (seconds elapsed). */
export function unlockedRecipes(elapsedSec) {
  if (elapsedSec < 45) return RECIPES.slice(0, 2);
  if (elapsedSec < 100) return RECIPES.slice(0, 3);
  return RECIPES;
}

/** True when the carried items, once prepped, match a recipe exactly. */
export function matchRecipe(carriedIds) {
  const sorted = [...carriedIds].sort().join(',');
  return RECIPES.find((r) => [...r.needs].sort().join(',') === sorted) ?? null;
}
