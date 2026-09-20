const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readNumber, scaleReference, portionIssue, parseProduct, productToFood, hasMeasuredQuantity, readSavedFoods } = require('../.test-dist/domain/foods.js');
const { createProductSearch, productSearchUrl } = require('../.test-dist/services/products.js');
const { activityIssue, activitySummary, saveSession, setDaySteps, readActivity, validDay, ACTIVITY_IDEAS } = require('../.test-dist/domain/activity.js');
const { dayKey } = require('../.test-dist/domain/date.js');
const { calculateDailyTarget } = require('../.test-dist/domain/calories.js');
const food = (unit = 'g', kcal = 150) => ({ id: 'custom-test', name: 'Mon aliment', reference: { amount: unit === 'portion' ? 1 : 100, unit, calories: { min: kcal, estimated: kcal, max: kcal }, macros: { protein: 10, carbs: 20, fat: 5 }, macrosComplete: true, source: 'manual' } });
const product = (extra = {}) => ({ code: '1234567890123', product_name: 'Test', nutriments: { 'energy-kcal_100g': 150, proteins_100g: 10, carbohydrates_100g: 20, fat_100g: 5 }, ...extra });
const response = body => ({ ok: true, status: 200, json: async () => body });
const empty = () => ({ sessions: [], stepsByDay: {} });
const today = dayKey(new Date());
const session = (extra = {}) => ({ id: 's1', day: today, kind: 'walk', minutes: 15, note: '', ...extra });

test('Saisie française : décimales et zéro acceptés, vide et valeurs invalides refusés', () => {
  assert.equal(readNumber('12,5'), 12.5); assert.equal(readNumber('0'), 0); assert.equal(readNumber('.5'), .5);
  for (const value of ['', ' ', null, undefined, NaN, Infinity, -2, '-2', 'abc', '0x10', '1e6']) assert.equal(readNumber(value), null);
});
test('Un aliment pesé à 250 g est calculé sur sa valeur pour 100 g', () => {
  const item = scaleReference(food(), 250);
  assert.equal(item.calories.estimated, 375); assert.equal(item.quantity, 250);
  assert.deepEqual(item.macros, { protein: 25, carbs: 50, fat: 12.5 });
});
test('Millilitres, demi-portions et références à zéro restent utilisables', () => {
  assert.equal(scaleReference(food('ml', 42), 330).calories.estimated, 139);
  assert.equal(scaleReference(food('portion', 500), .5).calories.estimated, 250);
  assert.equal(scaleReference(food('ml', 0), 500).calories.estimated, 0);
});
test('Changer plusieurs fois une quantité repart de la référence sans cumuler les arrondis', () => {
  const original = food('g', 137.4);
  const first = scaleReference(original, 33);
  const second = scaleReference({ id: first.foodId, name: first.name, reference: first.reference }, 250);
  assert.equal(second.calories.estimated, 344); assert.equal(scaleReference(original, 100).calories.estimated, 137);
});
test('Quantités impossibles et référence endommagée ne deviennent pas un repas', () => {
  for (const qty of [0, -1, Infinity, NaN, 5001]) assert.ok(portionIssue(qty, food().reference));
  assert.ok(portionIssue(21, food('portion').reference));
  assert.throws(() => scaleReference(food('portion', 900), 20));
  assert.ok(portionIssue(100, { ...food().reference, amount: 0 }));
});
test('Les poids dans une phrase ne sont jamais interprétés comme un nombre de portions', () => {
  for (const phrase of ['200g de riz', '0,5 kg de pâtes', '25 cl de jus', '150 grammes de riz', '1 litre de lait']) assert.ok(hasMeasuredQuantity(phrase));
  assert.equal(hasMeasuredQuantity('2 œufs et une banane'), false);
});
test('Open Food Facts : valeurs normalisées, langue française et unité choisie', () => {
  const parsed = parseProduct(product({ product_name_fr: 'Yaourt nature', brands: 'Marque', nutriments: { 'energy-kcal_100g': 64, 'energy-kcal_serving': 80, 'energy-kcal': 80, proteins_100g: 4, carbohydrates_100g: 6, fat_100g: 2 }, nutrition_data_per: 'serving' }));
  assert.equal(parsed.name, 'Yaourt nature'); assert.equal(parsed.kcal100, 64);
  assert.equal(scaleReference(productToFood(parsed, 'g'), 125).calories.estimated, 80);
  assert.equal(productToFood(parsed, 'ml').reference.unit, 'ml');
});
test('Énergie absente et zéro réel sont distingués ; conversion kJ en kcal', () => {
  assert.equal(parseProduct(product({ nutriments: {} })), null);
  assert.equal(parseProduct(product({ nutriments: { 'energy-kcal_100g': '' } })), null);
  assert.equal(parseProduct(product({ nutriments: { 'energy-kcal_100g': 0 } })).kcal100, 0);
  assert.ok(Math.abs(parseProduct(product({ nutriments: { 'energy-kj_100g': 418.4 } })).kcal100 - 100) < 1e-10);
  assert.equal(parseProduct(product({ no_nutrition_data: 'on' })), null);
  assert.equal(parseProduct(product({ code: 'javascript:alert(1)' })), null);
  assert.equal(parseProduct(product({ product_name: '  ' })), null);
});
test('Les macronutriments manquants portent un indicateur de bilan partiel', () => {
  const parsed = parseProduct(product({ nutriments: { 'energy-kcal_100g': 90, proteins_100g: 5 } }));
  assert.equal(parsed.macrosComplete, false);
  assert.equal(scaleReference(productToFood(parsed, 'g'), 200).macrosComplete, false);
  assert.equal(parseProduct(product()).macrosComplete, true);
});
test('API v3.6 : nouvelle structure nutritionnelle et rejet des bases ambiguës', async () => {
  const base = { per: '100g', preparation: 'as_sold', nutrients: { 'energy-kcal': { unit: 'kcal', value: 78.5 }, proteins: { unit: 'g', value: 4.2 }, carbohydrates: { unit: 'g', value: 8 }, fat: { unit: 'g', value: 3.3 } } };
  const raw = product({ nutriments: undefined, nutrition: { aggregated_set: base } });
  const search = createProductSearch(async () => response({ hits: [raw] }));
  const [parsed] = await search('1234567890123');
  assert.equal(parsed.kcal100, 78.5); assert.equal(parsed.macrosComplete, true);
  assert.equal(scaleReference(productToFood(parsed, 'g'), 125).calories.estimated, 98);
  assert.equal(parseProduct({ ...raw, nutrition: { aggregated_set: { ...base, per: 'serving' } } }), null);
  assert.equal(parseProduct({ ...raw, nutrition: { aggregated_set: { ...base, preparation: 'prepared' } } }), null);
  assert.equal(parseProduct({ ...raw, nutrition: { input_sets: [base] } }), null);
  assert.equal(parseProduct({ ...raw, nutrition: { aggregated_set: { ...base, nutrients: { 'energy-kcal': { unit: 'kJ', value: 400 } } } } }), null);
});
test('Migration des aliments personnels : ancien stockage vide, doublons et données corrompues', () => {
  assert.deepEqual(readSavedFoods(undefined), []);
  assert.equal(readSavedFoods([food(), food(), null, { ...food(), id: 'bad', reference: { ...food().reference, macros: {} } }]).length, 1);
  assert.deepEqual(readSavedFoods([{ ...food(), reference: { ...food().reference, sourceUrl: 'javascript:alert(1)' } }]), []);
});
test('Recherche : mots encodés et lecture exacte par code-barres', () => {
  const url = new URL(productSearchUrl('riz & lait'));
  assert.equal(url.host, 'search.openfoodfacts.org');
  assert.equal(url.searchParams.get('q'), 'riz lait');
  assert.equal(new URL(productSearchUrl('1234567890123')).searchParams.get('q'), 'code:"1234567890123"');
});
test('Recherche : filtrage des résultats, dédoublonnage et cache', async () => {
  let calls = 0;
  const search = createProductSearch(async () => { calls++; return response({ hits: [product(), product(), product({ nutriments: {} })] }); });
  assert.equal((await search('yaourt')).length, 1);
  await search(' YAOURT '); assert.equal(calls, 1);
  await assert.rejects(search('ab'), /3 caractères/); assert.equal(calls, 1);
});
test('Recherche : limite locale, expiration et cache accessible pendant la limite', async () => {
  let now = 1000, calls = 0;
  const search = createProductSearch(async () => { calls++; return response({ hits: [] }); }, () => now);
  for (let i = 0; i < 8; i++) await search(`nom${i}`);
  await assert.rejects(search('suivant'), /Attends une minute/);
  await search('nom0'); assert.equal(calls, 8);
  now += 60000; await search('suivant'); assert.equal(calls, 9);
  now += 300001; await search('nom0'); assert.equal(calls, 10);
});
test('Recherche : erreurs réseau, service limité, réponses invalides et produit absent', async () => {
  await assert.rejects(createProductSearch(async () => { throw new TypeError('Failed to fetch'); })('yaourt'), /sans connexion/);
  await assert.rejects(createProductSearch(async () => ({ ok: false, status: 429 }))('yaourt'), /limite temporairement/);
  await assert.rejects(createProductSearch(async () => response(null))('yaourt'), /incomplète/);
  await assert.rejects(createProductSearch(async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('invalid json'); } }))('yaourt'), /illisible/);
  assert.deepEqual(await createProductSearch(async () => ({ ok: false, status: 404 }))('1234567890123'), []);
});
test('Annuler une recherche interrompt la requête', async () => {
  let aborted = false;
  const search = createProductSearch((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => { aborted = true; reject(new Error('abort')); })));
  const controller = new AbortController(), promise = search('yaourt', controller.signal);
  controller.abort(); await assert.rejects(promise); assert.equal(aborted, true);
});
test('Une recherche trop longue est interrompue avec une explication', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const search = createProductSearch((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('abort')))));
  const promise = search('yaourt'); t.mock.timers.tick(20001);
  await assert.rejects(promise, /prend trop de temps/); t.mock.timers.reset();
});
test('Pas : un nouveau total remplace le précédent et reste attaché à la bonne date', () => {
  let journal = setDaySteps(empty(), today, 2000); journal = setDaySteps(journal, today, 6500);
  assert.equal(activitySummary(journal, today).steps, 6500);
  assert.equal(activitySummary(journal, '2020-01-01').steps, null);
  assert.equal(activitySummary(setDaySteps(journal, today, 0), today).steps, 0);
  for (const value of [-1, 1.5, 100001, NaN]) assert.throws(() => setDaySteps(journal, today, value));
});
test('Séances : ajouter, modifier sans doublon, séparer les jours et supprimer', () => {
  let journal = saveSession(empty(), session());
  journal = saveSession(journal, session({ minutes: 22.5 }));
  journal = saveSession(journal, session({ id: 's2', minutes: 5, kind: 'mobility' }));
  journal = saveSession(journal, session({ id: 'old', day: '2020-01-01', minutes: 30 }));
  assert.equal(activitySummary(journal, today).minutes, 27.5);
  assert.equal(activitySummary(journal, today).sessions.length, 2);
  journal = { ...journal, sessions: journal.sessions.filter(s => s.id !== 's2') };
  assert.equal(activitySummary(journal, today).minutes, 22.5);
});
test('Activité : données invalides et total supérieur à une journée refusés', () => {
  for (const extra of [{ minutes: 0 }, { minutes: 601 }, { minutes: NaN }, { kind: 'unknown' }, { day: '2026-02-30' }, { day: '2099-01-01' }]) assert.ok(activityIssue(session(extra), empty()));
  assert.equal(validDay('2024-02-29'), true); assert.equal(validDay('2025-02-29'), false);
  let journal = saveSession(empty(), session({ id: 'a', minutes: 600 }));
  journal = saveSession(journal, session({ id: 'b', minutes: 600 }));
  assert.throws(() => saveSession(journal, session({ id: 'c', minutes: 241 })));
});
test('Migration V1.3 sans activité et rechargement des nouvelles données', () => {
  assert.deepEqual(readActivity(undefined), empty());
  const journal = setDaySteps(saveSession(empty(), session()), today, 6500);
  assert.deepEqual(readActivity(JSON.parse(JSON.stringify(journal))), journal);
  assert.equal(readActivity({ sessions: [null, session({ minutes: -1 }), session()], stepsByDay: { [today]: -10 } }).sessions.length, 1);
});
test('Les idées ne créent aucune séance et le mode fixe conserve son objectif alimentaire', () => {
  const profile = { firstName: '', sexForFormula: 'male', age: 30, heightCm: 175, weightKg: 75, activityLevel: 'light', goal: 'lose', targetMode: 'automatic', manualTarget: 2000 };
  const before = calculateDailyTarget(profile); saveSession(empty(), session());
  assert.equal(calculateDailyTarget(profile), before);
  assert.equal(ACTIVITY_IDEAS.find(idea => idea.kind === 'interval').minutes, 15);
  assert.deepEqual(empty().sessions, []);
});
