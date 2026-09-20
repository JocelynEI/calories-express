const { test } = require('node:test');
const assert = require('node:assert/strict');
const { stepEnergy, dailyEnergyPlan } = require('../.test-dist/domain/activity-energy.js');
const { setDaySteps, saveSession, readActivity } = require('../.test-dist/domain/activity.js');
const { parseLabelText, foodFromLabel, pieceWeightFromPack } = require('../.test-dist/domain/labels.js');
const { scaleReference, readSavedFoods, itemQuantityLabel } = require('../.test-dist/domain/foods.js');
const { burgerIngredients, isBurgerQuery, makeRecipe } = require('../.test-dist/domain/recipes.js');
const { splitMealText, initialQuantity, parseFoodSegment, searchFoods } = require('../.test-dist/domain/food-search.js');
const { ocrPage, ocrMessage } = require('../.test-dist/services/ocr/page.js');
const day = '2026-09-17';
const profile = { firstName: 'Test', sexForFormula: 'male', age: 40, heightCm: 180, weightKg: 75, activityLevel: 'light', activityBudgetMode: 'daily', goal: 'lose', targetMode: 'automatic', manualTarget: 2200 };
const empty = () => ({ sessions: [], stepsByDay: {} });
const detail = { weightKg: 75, baselineSteps: 2000 };
const label = (patch = {}) => ({ name: 'Biscuits de test', kcal: 500, basis: '100g', byPiece: true, gramsPerPiece: 20, portionName: 'biscuit', ...patch });

test('Pas : poids, dépense hors repos et distinction avec les pas déjà dans la base', () => {
  const e = stepEnergy(6000, 75, 2000);
  assert.equal(e.activeKcal, 150); assert.equal(e.eligibleKcal, 100);
  assert.equal(stepEnergy(1500, 75, 2000).eligibleKcal, 0);
  assert.equal(stepEnergy(0, 75).activeKcal, 0);
  for (const v of [null, -1, 1.5, NaN, Infinity, 100001]) assert.equal(stepEnergy(v, 75), null);
  for (const weight of [undefined, 0, NaN, 301]) assert.equal(stepEnergy(6000, weight), null);
});
test('6500 remplace 5000, le repère évolue et conserve le déficit ; historique stable au changement de poids', () => {
  let journal = setDaySteps(empty(), day, 5000, detail);
  assert.equal(dailyEnergyPlan(profile, journal, day).creditedKcal, 75);
  journal = setDaySteps(journal, day, 6500, detail);
  const plan = dailyEnergyPlan(profile, journal, day);
  assert.equal(plan.activity.steps, 6500); assert.equal(plan.activity.activeKcal, 163); assert.equal(plan.creditedKcal, 113);
  assert.equal(plan.maintenance - plan.target, 300);
  assert.equal(dailyEnergyPlan({ ...profile, weightKg: 100 }, journal, day).activity.activeKcal, 163);
  assert.equal(dailyEnergyPlan(profile, journal, '2026-09-18').creditedKcal, 0);
  assert.equal(dailyEnergyPlan(profile, journal, day, false).creditedKcal, 0);
  assert.equal(dailyEnergyPlan(profile, empty(), day, false).activity.stepsEstimate, null);
});
test('Les modes fixe et manuel montrent les kcal des pas sans changer le repère', () => {
  const journal = setDaySteps(empty(), day, 6000, detail);
  for (const p of [{ ...profile, activityBudgetMode: 'fixed' }, { ...profile, targetMode: 'manual' }]) {
    const plan = dailyEnergyPlan(p, journal, day);
    assert.equal(plan.activity.activeKcal, 150); assert.equal(plan.creditedKcal, 0);
    assert.equal(plan.target, dailyEnergyPlan(p, empty(), day).target);
  }
});
test('Une marche incluse ne s’ajoute pas aux pas ; vélo distinct oui ; suppression et total zéro recalculent', () => {
  let j = setDaySteps(empty(), day, 6000, detail);
  j = saveSession(j, { id: 'walk', day, kind: 'walk', minutes: 30, note: '', effort: 'moderate', weightKg: 75 }); //105 active
  let p = dailyEnergyPlan(profile, j, day);
  assert.equal(p.activity.activeKcal, 150); assert.equal(p.creditedKcal, 105); assert.equal(p.activity.deduplicatedKcal, 105);
  j = saveSession(j, { id: 'bike', day, kind: 'cycle', minutes: 20, note: '', effort: 'moderate', weightKg: 75 }); //150 active
  p = dailyEnergyPlan(profile, j, day); assert.equal(p.activity.activeKcal, 300); assert.equal(p.creditedKcal, 255);
  j = { ...j, sessions: [] }; p = dailyEnergyPlan(profile, j, day); assert.equal(p.activity.activeKcal, 150);
  assert.equal(dailyEnergyPlan(profile, setDaySteps(j, day, 0, detail), day).creditedKcal, 0);
});
test('Une autre séance incluse dans les pas est dédoublonnée ; une marche sans pas reste estimée', () => {
  let j = setDaySteps(empty(), day, 6000, detail);
  j = saveSession(j, { id: 'dance', day, kind: 'interval', minutes: 20, effort: 'moderate', note: '', weightKg: 75, includedInSteps: true });
  assert.equal(dailyEnergyPlan(profile, j, day).activity.activeKcal, 150);
  j = { ...j, stepsByDay: {} }; assert.equal(dailyEnergyPlan(profile, j, day).activity.activeKcal, 100);
});
test('Migration conserve pas et métadonnées ; des métadonnées corrompues ne suppriment pas le nombre de pas', () => {
  const j = setDaySteps(empty(), day, 5000, detail);
  assert.deepEqual(readActivity(JSON.parse(JSON.stringify(j))), j);
  const bad = { ...j, stepDetailsByDay: { [day]: { weightKg: 0, baselineSteps: -100 } } };
  assert.equal(readActivity(bad).stepsByDay[day], 5000); assert.equal(readActivity(bad).stepDetailsByDay, undefined);
  assert.throws(() => setDaySteps(j, day, 6000, { weightKg: 75, baselineSteps: NaN }));
});
test('Burger maison au bœuf : proposition reconnue, phrase entière, ingrédients et cuisson visibles', () => {
  assert.ok(isBurgerQuery('un burger maison avec viande de bœuf'));
  assert.equal(splitMealText('burger maison avec viande de bœuf').length, 1);
  assert.equal(splitMealText('burger maison avec viande de bœuf et 100 g de frites').length, 2);
  const items = burgerIngredients(); assert.equal(items.length, 6);
  assert.ok(items.some(i => /boeuf.*cuit/i.test(i.food.name)));
  const recipe = makeRecipe('Mon burger', items, 1);
  const expected = Math.round(items.reduce((n, i) => n + i.quantity * i.food.reference.calories.estimated / 100, 0));
  assert.equal(scaleReference(recipe, 1).calories.estimated, expected);
  assert.equal(scaleReference(recipe, .5).calories.estimated, Math.round(recipe.reference.calories.estimated / 2));
  assert.equal(readSavedFoods([recipe]).length, 1);
  assert.equal(initialQuantity(recipe, parseFoodSegment('2 burgers')).quantity, '2');
});
test('Recette : fromage retiré, poids ajusté et portions partagées changent les kcal sans constante burger', () => {
  const items = burgerIngredients(), base = makeRecipe('Burger', items, 1);
  const noCheese = items.filter(i => i.food.id !== 'ciqual-12726');
  assert.ok(makeRecipe('Burger', noCheese, 1).reference.calories.estimated < base.reference.calories.estimated);
  const twice = items.map(i => ({ ...i, quantity: i.quantity * 2 }));
  assert.equal(makeRecipe('Burger', twice, 2).reference.calories.estimated, base.reference.calories.estimated);
  assert.throws(() => makeRecipe('Plat', [], 1)); assert.throws(() => makeRecipe('Plat', items, 0));
  assert.throws(() => makeRecipe('Plat', [{ ...items[0], quantity: NaN }], 1));
  assert.ok(searchFoods('hamburger').some(f => /Hamburger|burger/i.test(f.name)));
});
test('Étiquette 100 g : des vrais kcal, pas les kJ ou le sucre ; zéro est valide', () => {
  const r = parseLabelText('VALEURS POUR 100 g\nÉnergie 2092 kJ / 500 kcal\nSucres 32 g\nSel 0,5 g');
  assert.deepEqual(r.energies.map(e => e.value), [500]); assert.equal(r.only100g, true);
  assert.equal(parseLabelText('Ingrédients : sucre 32 g, farine, cacao 5 %').energies.length, 0);
  assert.equal(parseLabelText('Pour 100 ml\nÉnergie 0 kJ / 0 kcal').energies[0].value, 0);
  assert.equal(parseLabelText('Énergie 418,4 kJ').energies[0].value, 100);
});
test('Deux colonnes et portion de deux biscuits ne deviennent pas une calorie par biscuit', () => {
  const r = parseLabelText('Pour 100 g | Pour 2 biscuits (40 g)\nÉnergie 2092 kJ 500 kcal | 837 kJ 200 kcal');
  assert.deepEqual(r.energies.map(e => e.value), [500, 200]); assert.equal(r.only100g, false);
  assert.equal(r.gramsPerPiece, 20); assert.equal(r.piecesPerServing, 2);
  assert.equal(parseLabelText('Une portion 40 g\nÉnergie 200 kcal').gramsPerPiece, null);
  const food = foodFromLabel(label({ kcal: 200, basis: 'serving', piecesPerServing: 2 }));
  assert.equal(scaleReference(food, 3).calories.estimated, 300);
});
test('3 biscuits : calcul par poids, par pièce ou par paquet concordant et mémorisation', () => {
  const a = foodFromLabel(label()); const b = foodFromLabel(label({ kcal: 100, basis: 'piece' }));
  const c = foodFromLabel(label({ gramsPerPiece: pieceWeightFromPack(300, 15) }));
  for (const food of [a, b, c]) {
    const item = scaleReference(food, 3); assert.equal(item.calories.estimated, 300); assert.equal(itemQuantityLabel(item), '3 biscuits');
    const saved = readSavedFoods(JSON.parse(JSON.stringify([food]))); assert.equal(saved.length, 1);
    assert.equal(scaleReference(saved[0], 4).calories.estimated, 400);
  }
});
test('Étiquette : poids inconnu, unité incorrecte, portions invalides et kcal excessives ne sont pas devinés', () => {
  assert.throws(() => foodFromLabel(label({ gramsPerPiece: null })));
  assert.throws(() => foodFromLabel(label({ basis: 'serving', piecesPerServing: 0 })));
  assert.throws(() => foodFromLabel(label({ basis: '100ml' })));
  assert.throws(() => foodFromLabel(label({ kcal: 2092 })));
  assert.equal(pieceWeightFromPack(300, 0), null); assert.equal(pieceWeightFromPack(300, 2.5), null);
  assert.equal(scaleReference(foodFromLabel(label({ byPiece: false })), 60).calories.estimated, 300);
  assert.equal(scaleReference(foodFromLabel(label({ kcal: 40, basis: '100ml', byPiece: false })), 250).calories.estimated, 100);
});
test('OCR : photo strictement base64, versions épinglées et aucun envoi de la photo via fetch', () => {
  const html = ocrPage('YWJj'); assert.match(html, /tesseract\.js@6\.0\.1/); assert.match(html, /worker\.recognize\('data:image\/jpeg;base64,YWJj'\)/);
  assert.doesNotMatch(html, /fetch\(|XMLHttpRequest|sendBeacon/);
  assert.throws(() => ocrPage('</script><script>bad()'));
  let text = ''; const cb = { onText: t => text = t, onError: () => {}, onProgress: () => {} };
  ocrMessage('invalid', cb); ocrMessage(JSON.stringify({ channel: 'other', type: 'done', value: 'no' }), cb); assert.equal(text, '');
  ocrMessage(JSON.stringify({ channel: 'calories-label-ocr', type: 'done', value: '500 kcal' }), cb); assert.equal(text, '500 kcal');
});

test('Une séance exclue du repère ne revient pas dans le crédit par les pas', () => {
  const j = saveSession(setDaySteps(empty(), day, 6000, detail), { id: 'habit', day, kind: 'walk', minutes: 60, note: '', effort: 'moderate', weightKg: 75, includeInGoal: false });
  const plan = dailyEnergyPlan(profile, j, day); assert.equal(plan.activity.activeKcal, 210); assert.equal(plan.creditedKcal, 0);
});
