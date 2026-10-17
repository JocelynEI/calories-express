const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const { searchFoods, quickPortion } = require('../.test-dist/domain/food-search.js');
const { sourceLabel } = require('../.test-dist/domain/foods.js');

/**
 * V4.2 — ce que disent les avis sur les applis concurrentes.
 *
 * Vérifié ici : les boissons se trouvent telles qu'on les boit (et le + n'ajoute
 * pas un verre de café moulu), chaque aliment dit d'où vient son chiffre, et des
 * raccourcis boissons sont proposés avant de taper.
 */

test('Une boisson se trouve telle qu’on la boit, pas en poudre ni en feuilles', () => {
  const cafe = searchFoods('café')[0];
  assert.match(cafe.name, /prêt à boire/, cafe.name);
  assert.ok(cafe.reference.calories.estimated < 20, 'un café noir ne pèse presque rien');
  assert.match(searchFoods('thé')[0].name, /infusé/);
  assert.match(searchFoods('lait')[0].name, /^Lait/);
  assert.match(searchFoods('eau')[0].name, /^Eau/);
  assert.match(searchFoods('cola')[0].name, /^Cola/);
  assert.equal(searchFoods('fromage')[0].id, 'ciqual-12999', 'pas le fromage de tête');
  assert.ok(searchFoods('café moulu')[0].name.includes('moulu'), 'demandé, le moulu reste trouvable');
});

test('Le + sert un café ou un thé à la tasse, et une portion plutôt qu’une assiette', () => {
  assert.equal(quickPortion(searchFoods('café')[0]).label, '1 tasse');
  assert.equal(quickPortion(searchFoods('thé')[0]).label, '1 tasse');
  assert.equal(quickPortion(searchFoods('lait')[0]).label, '1 verre');
  assert.equal(quickPortion(searchFoods('riz cuit')[0]).label, '1 portion');
  for (const drink of ['Eau', 'Café', 'Thé', 'Lait', 'Jus d’orange', 'Cola']) {
    const q = quickPortion(searchFoods(drink)[0]);
    assert.ok(q.item.calories.estimated < 150, `${drink} : ${q.item.calories.estimated} kcal pour ${q.label}`);
  }
});

test('Chaque valeur dit d’où elle vient', () => {
  assert.equal(sourceLabel('label'), 'Lu sur ton étiquette');
  assert.equal(sourceLabel('manual'), 'Ta valeur');
  assert.match(sourceLabel('ciqual'), /Moyenne/);
  assert.equal(sourceLabel(undefined), null, 'un vieux repas sans référence n’affiche rien d’inventé');
  const modal = read('src/components/AddMealModal.tsx');
  assert.ok(modal.includes('sourceLabel(item.reference?.source)'), 'affichée dans le repas');
});

test('Des raccourcis boissons avant de taper', () => {
  const ecran = read('src/components/UnifiedFoodSearch.tsx');
  assert.ok(ecran.includes("const DRINKS = ['Eau', 'Café', 'Thé', 'Lait', 'Jus d’orange', 'Cola'];"));
  assert.match(ecran, /\{!typed && <View style=\{form\.card\}>\s*<Text style=\{form\.title\}>Une boisson \?/);
});

test('Un aliment très calorique sans mesure dédiée : le + sert 30 g, pas une tablette', () => {
  for (const q of ['chocolat noir', 'cacahuète', 'biscuit sec']) {
    const f = searchFoods(q)[0];
    const p = quickPortion(f);
    assert.ok(p.item.calories.estimated < 250, `${f.name} : ${p.item.calories.estimated} kcal pour ${p.label}`);
  }
  assert.equal(quickPortion(searchFoods('pomme')[0]).label, '1 portion', 'un fruit garde sa portion');
});
