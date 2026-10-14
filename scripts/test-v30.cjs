const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const { mealsByMoment, plateSegments, mealSummary, momentForHour, HOME_MOMENTS } = require('../.test-dist/domain/meals.js');
const { weekOf, weekdayInitials } = require('../.test-dist/domain/date.js');

/**
 * V4.0 — l'accueil en cartes.
 *
 * Vérifié ici : les repas se rangent par moment sans en perdre aucun, l'assiette
 * se partage sans déborder, la semaine commence un lundi, et le scan d'étiquette
 * est à un appui de partout.
 */

const meal = (id, moment, kcal, createdAt, names = ['Riz blanc, cuit, sans sel ajouté']) => ({
  id, moment, createdAt, description: names.join(' + '), method: 'phrase',
  items: names.map(name => ({ foodId: name, name, quantity: 100, calories: { min: kcal, estimated: kcal, max: kcal }, macros: { protein: 0, carbs: 0, fat: 0 }, confidence: 'medium' })),
  calories: { min: kcal, estimated: kcal, max: kcal }, macros: { protein: 0, carbs: 0, fat: 0 },
});

/* --------------------------------------------------- les repas par moment */

test('Les quatre moments sont toujours là, dans l’ordre de la journée', () => {
  const groups = mealsByMoment([]);
  assert.deepEqual(groups.map(g => g.moment), HOME_MOMENTS);
  assert.ok(groups.every(g => g.meals.length === 0 && g.kcal === 0), 'une journée vide n’invente rien');
});

test('Aucun repas ne se perd, et « Snack » n’apparaît que s’il est noté', () => {
  const meals = [
    meal('a', 'Dîner', 500, '2026-10-14T19:00:00.000Z'),
    meal('b', 'Snack', 120, '2026-10-14T16:30:00.000Z'),
    meal('c', 'Petit-déjeuner', 380, '2026-10-14T07:30:00.000Z'),
    meal('d', 'Petit-déjeuner', 60, '2026-10-14T09:00:00.000Z'),
  ];
  const groups = mealsByMoment(meals);
  assert.deepEqual(groups.map(g => g.moment), ['Petit-déjeuner', 'Déjeuner', 'Goûter', 'Snack', 'Dîner']);
  assert.equal(groups.reduce((n, g) => n + g.meals.length, 0), meals.length, 'chaque repas a sa place');
  assert.equal(groups[0].kcal, 440);
  assert.deepEqual(groups[0].meals.map(m => m.id), ['c', 'd'], 'dans l’ordre où ils ont été pris');
});

/* ---------------------------------------------------------- l'assiette */

test('Chaque moment prend sur le bord sa part de l’objectif', () => {
  const groups = mealsByMoment([
    meal('a', 'Petit-déjeuner', 500, '2026-10-14T07:30:00.000Z'),
    meal('b', 'Déjeuner', 500, '2026-10-14T12:30:00.000Z'),
  ]);
  const parts = plateSegments(groups, 2000, 0);
  assert.deepEqual(parts.map(p => p.moment), ['Petit-déjeuner', 'Déjeuner']);
  assert.equal(parts[0].start, 0, 'la première part démarre en haut');
  assert.equal(parts[0].length, 0.25);
  assert.equal(parts[1].start, 0.25, 'la suivante reprend où la précédente s’arrête');
});

test('Au-delà de l’objectif, le bord est plein mais ne déborde jamais', () => {
  const groups = mealsByMoment([
    meal('a', 'Déjeuner', 1500, '2026-10-14T12:30:00.000Z'),
    meal('b', 'Dîner', 1500, '2026-10-14T19:30:00.000Z'),
  ]);
  const parts = plateSegments(groups, 2000, 0);
  const end = parts[parts.length - 1].start + parts[parts.length - 1].length;
  assert.ok(Math.abs(end - 1) < 1e-9, 'le tour est complet, pas plus');
  assert.equal(parts[0].length, parts[1].length, 'les proportions entre repas sont gardées');
});

test('Sans objectif ou sans repas, l’assiette reste vide', () => {
  assert.deepEqual(plateSegments(mealsByMoment([]), 2000), []);
  assert.deepEqual(plateSegments(mealsByMoment([meal('a', 'Dîner', 400, '2026-10-14T19:00:00.000Z')]), 0).length, 1, 'un repas sans objectif se voit quand même');
});

/* ----------------------------------------------------- les mots du repas */

test('Le résumé d’un repas garde le nom court de chaque aliment', () => {
  const m = meal('a', 'Déjeuner', 367, '2026-10-14T12:00:00.000Z', ['Riz blanc, cuit, sans sel ajouté', 'Oeuf dur']);
  assert.equal(mealSummary(m), 'Riz blanc, Oeuf dur');
  assert.equal(mealSummary({ ...m, items: [] }), m.description, 'repli sur la description');
});

test('Le moment proposé suit l’heure', () => {
  assert.equal(momentForHour(8), 'Petit-déjeuner');
  assert.equal(momentForHour(12), 'Déjeuner');
  assert.equal(momentForHour(16), 'Goûter');
  assert.equal(momentForHour(20), 'Dîner');
});

/* ---------------------------------------------------------- la semaine */

test('La semaine va du lundi au dimanche et contient le jour choisi', () => {
  const week = weekOf('2026-10-14'); // un mercredi
  assert.equal(week.length, 7);
  assert.equal(week[0], '2026-10-12');
  assert.equal(week[6], '2026-10-18');
  assert.ok(week.includes('2026-10-14'));
  assert.equal(weekOf('2026-10-18')[0], '2026-10-12', 'le dimanche ferme la semaine');
  assert.equal(weekOf('2026-11-02')[0], '2026-11-02', 'un lundi l’ouvre');
  assert.equal(weekdayInitials('2026-10-14').number, 14);
});

/* ------------------------------------------- le scan à portée de pouce */

test('Le scan d’étiquette est sur l’accueil, dans le bouton +, et à côté du champ', () => {
  assert.ok(read('src/screens/TodayScreen.tsx').includes('onPress={onScan}'), 'accueil');
  assert.ok(read('src/components/AddSheet.tsx').includes("onChoose('scan')"), 'bouton +');
  assert.ok(read('src/components/UnifiedFoodSearch.tsx').includes("onPress={() => setSpecial('label')}"), 'à côté du champ');
  const app = read('App.tsx');
  assert.ok(app.includes("onScan={() => openAdd({ start: 'label' })}"), 'le scan ouvre directement l’étiquette');
  assert.ok(read('src/components/LabelFoodForm.tsx').includes('void scan(true);'), 'et l’appareil photo démarre seul');
});

test('Le + d’un moment ouvre l’ajout déjà réglé sur ce moment', () => {
  const app = read('App.tsx');
  assert.ok(app.includes('onAddFor={moment => openAdd({ moment })}'));
  assert.ok(read('src/components/AddMealModal.tsx').includes('initialMoment ?? momentForHour('));
});

test('Le conseil de Jaws ne recouvre plus l’écran', () => {
  const app = read('App.tsx');
  assert.equal(app.includes('<MealCoachPopup'), false, 'plus de fenêtre flottante après un repas');
  assert.ok(app.includes('<MealCoachCard'), 'le conseil arrive dans une carte du fil');
  assert.ok(read('src/screens/TodayScreen.tsx').includes('{coachTip}'));
});

test('Le bouton + propose tout ce qu’on peut ajouter', () => {
  const sheet = read('src/components/AddSheet.tsx');
  for (const choix of ["'search'", "'recipe'", "'activity'", "'weight'"]) assert.ok(sheet.includes(choix), choix);
  assert.ok(read('App.tsx').includes('<AddSheet onChoose={chooseAdd}'));
});

/* --------------------------- V4.0.1 — la lecture d'étiquette ne s'invente rien */

const { parseLabelText } = require('../.test-dist/domain/labels.js');

test('L’apport de référence d’un adulte n’est jamais pris pour l’énergie du produit', () => {
  const r = parseLabelText('Valeurs nutritionnelles pour 100 g\nÉnergie 1960 kJ / 468 kcal\nApport de référence pour un adulte type (8400 kJ / 2000 kcal)');
  assert.deepEqual(r.energies.map(e => e.value), [468]);
});

test('Un « 000 » mal lu ne devient pas « 0 kcal »', () => {
  // Le cas réel : « …de référence 2000 kcal, AR » lu « re 000 kcal, A ».
  assert.equal(parseLabelText('re 000 kcal, A').energies.length, 0);
  assert.equal(parseLabelText('Énergie 05 kcal').energies.length, 0);
  assert.equal(parseLabelText('Pour 100 ml\nÉnergie 0 kJ / 0 kcal').energies[0].value, 0, 'un vrai zéro reste valide');
});

test('Les fautes de lecture courantes de « kcal » sont reconnues', () => {
  assert.equal(parseLabelText('Énergie 1960 kJ / 468 kca1').energies[0].value, 468);
  assert.equal(parseLabelText('Énergie 468 kcaI').energies[0].value, 468);
});

test('La ligne « Énergie » est proposée en premier', () => {
  const r = parseLabelText('Matières grasses 19 g dont 120 kcal\nÉnergie 1960 kJ / 468 kcal');
  assert.equal(r.energies[0].value, 468);
});
