const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sessionEnergy, dailyEnergyPlan, activityEnergy } = require('../.test-dist/domain/activity-energy.js');
const { saveSession, setDaySteps, readActivity } = require('../.test-dist/domain/activity.js');
const { calculateDailyTarget } = require('../.test-dist/domain/calories.js');
const { readExperienceSettings } = require('../.test-dist/domain/experience.js');
const { canShowMealPrompt, markMealPrompt, mealEncouragement, readCoachHistory } = require('../.test-dist/domain/coaching.js');
const { searchFoods, splitMealText, parseFoodSegment, initialQuantity, ciqualFood, CIQUAL_COUNT } = require('../.test-dist/domain/food-search.js');
const { scaleReference, parseProduct, readSavedFoods } = require('../.test-dist/domain/foods.js');
const { createProductSearch, productSearchUrl } = require('../.test-dist/services/products.js');
const day = '2026-09-16', nextDay = '2026-09-17';
const profile = { firstName: '', sexForFormula: 'male', age: 40, heightCm: 180, weightKg: 80, activityLevel: 'active', activityBudgetMode: 'daily', goal: 'lose', targetMode: 'automatic', manualTarget: 2200 };
const empty = () => ({ sessions: [], stepsByDay: {} });
const session = (patch = {}) => ({ id: 's1', day, kind: 'walk', minutes: 30, note: '', effort: 'moderate', weightKg: 80, includeInGoal: true, ...patch });
const noon = () => new Date(2026, 8, 16, 12);

test('Marche 30 min, 80 kg : 152 kcal brutes et 112 kcal actives, sans compter le repos deux fois', () => {
  const e = sessionEnergy(session()); assert.equal(e.grossKcal, 152); assert.equal(e.activeKcal, 112);
});
test('Mode ajusté : base calme + activité, déficit conservé ; coefficient habituel ignoré', () => {
  const journal = saveSession(empty(), session()), plan = dailyEnergyPlan(profile, journal, day);
  assert.equal(plan.target, calculateDailyTarget(profile) + 112);
  assert.equal(plan.maintenance - plan.target, 300);
  assert.equal(plan.target, dailyEnergyPlan({ ...profile, activityLevel: 'sedentary' }, journal, day).target);
  for (const goal of ['maintain', 'gain']) {
    const p = dailyEnergyPlan({ ...profile, goal }, journal, day);
    assert.equal(p.target - p.maintenance, goal === 'maintain' ? 0 : 250);
  }
});
test('Objectif fixe ou manuel : dépense visible, repère non modifié', () => {
  const journal = saveSession(empty(), session());
  for (const p of [{ ...profile, activityBudgetMode: 'fixed' }, { ...profile, targetMode: 'manual' }]) {
    const plan = dailyEnergyPlan(p, journal, day); assert.equal(plan.target, calculateDailyTarget(p)); assert.equal(plan.creditedKcal, 0); assert.equal(plan.activity.activeKcal, 112);
  }
});
test('Modification puis suppression recalculent le crédit sans cumuler les anciennes séances', () => {
  let journal = saveSession(empty(), session()); journal = saveSession(journal, session({ minutes: 60 }));
  assert.equal(journal.sessions.length, 1); assert.equal(dailyEnergyPlan(profile, journal, day).creditedKcal, 224);
  journal = { ...journal, sessions: [] }; assert.equal(dailyEnergyPlan(profile, journal, day).creditedKcal, 0);
});
test('V1.6 : les pas sont maintenant estimés et la marche comprise n’est pas ajoutée deux fois', () => {
  const journal = setDaySteps(saveSession(empty(), session({ includeInGoal: false })), day, 6000);
  const plan = dailyEnergyPlan(profile, journal, day); assert.equal(plan.activity.activeKcal, 160); assert.equal(plan.creditedKcal, 48);
  assert.equal(dailyEnergyPlan(profile, setDaySteps(empty(), day, 6000), day).creditedKcal, 107);
});
test('Poids mémorisé stable, pas de crédit reporté le lendemain et pas de poids fictif sans profil', () => {
  const journal = saveSession(empty(), session());
  assert.equal(dailyEnergyPlan({ ...profile, weightKg: 100 }, journal, day).creditedKcal, 112);
  assert.equal(dailyEnergyPlan(profile, journal, nextDay).creditedKcal, 0);
  assert.equal(dailyEnergyPlan(profile, journal, day, false).creditedKcal, 0);
  assert.equal(sessionEnergy(session({ weightKg: undefined })), null);
});
test('Migration activité : defaults signalés ; nouvelles valeurs conservées ; autre activité reste inconnue', () => {
  const old = sessionEnergy(session({ effort: undefined, weightKg: undefined }), 80); assert.ok(old.usesDefaults); assert.equal(old.activeKcal, 72);
  assert.deepEqual(readActivity(saveSession(empty(), session())), saveSession(empty(), session()));
  assert.equal(sessionEnergy(session({ kind: 'other' })), null);
  for (const weightKg of [0, -1, NaN, Infinity, 301]) assert.equal(sessionEnergy(session({ weightKg })), null);
  assert.equal(activityEnergy(saveSession(empty(), session({ kind: 'other' })), day, 80).unknown, 1);
});
test('Conseils : deux par jour, espacés de trois heures, pause du jour et désactivation', () => {
  let history = readCoachHistory(undefined), now = noon();
  assert.ok(canShowMealPrompt(history, true, now)); history = markMealPrompt(history, now);
  assert.equal(canShowMealPrompt(history, true, new Date(now.getTime() + 60000)), false);
  now = new Date(now.getTime() + 3 * 3600000); assert.ok(canShowMealPrompt(history, true, now)); history = markMealPrompt(history, now);
  assert.equal(canShowMealPrompt(history, true, new Date(now.getTime() + 3 * 3600000)), false);
  assert.ok(canShowMealPrompt(history, true, new Date(2026, 8, 17, 12)));
  assert.equal(canShowMealPrompt({ ...history, snoozedDay: nextDay }, true, new Date(2026, 8, 17, 12)), false);
  assert.equal(canShowMealPrompt(readCoachHistory(null), false, noon()), false);
});
test('Conseils : contexte activité et repos, indépendants des calories mangées', () => {
  assert.equal(mealEncouragement(empty(), 'Déjeuner', noon()).idea, 'walk');
  assert.equal(mealEncouragement(empty(), 'Petit-déjeuner', noon()).idea, 'mobility');
  assert.equal(mealEncouragement(saveSession(empty(), session()), 'Déjeuner', noon()).idea, null);
  assert.equal(mealEncouragement(empty(), 'Dîner', new Date(2026, 8, 16, 22)).idea, null);
});
test('Ciqual : plus de 3300 références avec énergie, inconnus non transformés en zéro exact', () => {
  assert.ok(CIQUAL_COUNT > 3300);
  const unknown = ciqualFood(['x', 'Exemple', 100, null, 20, 0]); assert.equal(unknown.reference.macrosComplete, false);
  const zero = ciqualFood(['y', 'Eau', 0, 0, 0, 0]); assert.equal(zero.reference.macrosComplete, true); assert.equal(scaleReference(zero, 250).calories.estimated, 0);
  assert.equal(readSavedFoods([unknown]).length, 1);
});
test('Recherche locale : accents, pluriels, cuisson, références à 100 g', () => {
  const rice = searchFoods('riz cuit')[0]; assert.ok(rice.name.toLowerCase().includes('cuit')); assert.equal(rice.reference.amount, 100); assert.equal(rice.reference.unit, 'g');
  assert.ok(searchFoods('œufs durs').some(f => /dur/i.test(f.name)));
  assert.ok(searchFoods('pâtes cuites').length > 0);
  assert.equal(scaleReference(rice, 150).calories.estimated, Math.round(rice.reference.calories.estimated * 1.5));
  assert.deepEqual(searchFoods('xyzalimentinexistant'), []);
});
test('Phrase : aliments distincts, grammes, kg, décimales françaises et compte de pièces', () => {
  const pieces = splitMealText('150 g de riz cuit et 2 œufs'); assert.equal(pieces.length, 2); assert.deepEqual(pieces.map(p => [p.query, p.quantity, p.unit]), [['riz cuit', 150, 'g'], ['œufs', 2, 'piece']]);
  assert.deepEqual(splitMealText('0,5 kg de riz cuit, 25 cl de lait').map(p => [p.quantity, p.unit]), [[500, 'g'], [250, 'ml']]);
  assert.equal(parseFoodSegment('une banane').quantity, 1); assert.equal(parseFoodSegment("j’ai mangé 150 g de riz").query, 'riz');
  assert.equal(parseFoodSegment('1234567890123').query, '1234567890123');
});
test('Quantité : aucune conversion implicite ml/g ; pièce inconnue demande le poids', () => {
  const rice = searchFoods('riz cuit')[0]; assert.equal(initialQuantity(rice, parseFoodSegment('150 g de riz')).quantity, '150');
  assert.equal(initialQuantity(rice, parseFoodSegment('200 ml de riz')).quantity, '');
  assert.equal(initialQuantity(rice, parseFoodSegment('2 galettes de riz')).quantity, '');
  const egg = searchFoods('oeuf dur').find(f => f.id === 'ciqual-22010'); assert.ok(egg); const q = initialQuantity(egg, parseFoodSegment('2 œufs')); assert.equal(q.quantity, '100'); assert.match(q.note, /indicative/);
  assert.equal(searchFoods('banane')[0].id, 'ciqual-13005'); assert.equal(searchFoods('pates cuites')[0].id, 'ciqual-9811');
});
test('Nouveau service de recherche : marques en liste et forme hits, erreurs lisibles', async () => {
  const raw = { code: '3277390015076', product_name_fr: 'Yaourts au nougat', brands: ['Savoie yaourt'], nutriments: { 'energy-kcal_100g': 140, proteins_100g: 3 } };
  assert.equal(parseProduct(raw).brand, 'Savoie yaourt');
  assert.equal(new URL(productSearchUrl('yaourt')).hostname, 'search.openfoodfacts.org');
  assert.equal(new URL(productSearchUrl('yaourt nature')).searchParams.get('q'), 'yaourt nature');
  assert.equal(new URL(productSearchUrl('"yaourt" OR *:*')).searchParams.get('q'), 'yaourt');
  const search = createProductSearch(async () => ({ ok: true, status: 200, json: async () => ({ hits: [raw] }) }));
  assert.equal((await search('3277390015076'))[0].kcal100, 140); assert.deepEqual(await search('1234567890123'), []);
  await assert.rejects(createProductSearch(async () => ({ ok: false, status: 503 }))('yaourt'), /hors ligne/);
  await assert.rejects(createProductSearch(async () => ({ ok: true, status: 200, json: async () => ({ error: 'query failed' }) }))('yaourt'), /incomplète/);
});

test('Préférences : migration des conseils et conservation de la désactivation', () => {
  assert.equal(readExperienceSettings({ animations: false, welcome: false }).activityPrompts, true);
  assert.equal(readExperienceSettings(JSON.parse(JSON.stringify({ animations: true, welcome: true, activityPrompts: false }))).activityPrompts, false);
});
