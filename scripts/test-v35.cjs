const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const { parseLabelText, foodFromLabel, macrosFound } = require('../.test-dist/domain/labels.js');
const { labelMacroTrial, trialNotice, readLabelMacroReads, FREE_LABEL_MACRO_READS } = require('../.test-dist/domain/premium.js');
const {
  templateFromDay, applyTemplate, templateIssue, templateLine, readDayTemplates, suggestedTemplateName,
  MAX_TEMPLATES, MAX_MEALS_PER_TEMPLATE,
} = require('../.test-dist/domain/day-template.js');
const { mealsForDay } = require('../.test-dist/domain/meals.js');

/**
 * V5.0 — l'étiquette complète et la journée type.
 *
 * Vérifié ici : les grammes sont lus sans jamais confondre « dont sucres » avec
 * les glucides ; ils suivent la même mise à l'échelle que les kcal ; les trois
 * lectures offertes sont annoncées et comptées ; une journée type est une copie
 * exacte, replacée sans écraser ce qui existe.
 */

/* ---------------------- Lire les macros de l'étiquette ---------------------- */

const ETIQUETTE = [
  'Valeurs nutritionnelles moyennes pour 100 g',
  'Énergie 2050 kJ / 489 kcal',
  'Matières grasses 24,5 g',
  'dont acides gras saturés 11,2 g',
  'Glucides 62,1 g',
  'dont sucres 33,4 g',
  'Fibres alimentaires 2,9 g',
  'Protéines 6,2 g',
  'Sel 0,45 g',
].join('\n');

test('L’étiquette : les trois grammes sont lus, les kcal ne changent pas', () => {
  const result = parseLabelText(ETIQUETTE);
  assert.equal(result.energies[0].value, 489, 'les kcal restent lues comme avant');
  assert.deepEqual(result.macros, { protein: 6.2, carbs: 62.1, fat: 24.5 });
  assert.equal(macrosFound(result.macros), 3);
});

test('L’étiquette : « dont sucres » n’est pas un glucide, « dont acides gras » pas un lipide', () => {
  const merged = parseLabelText('Glucides 62,1 g dont sucres 33,4 g\nMatières grasses 24,5 g dont acides gras saturés 11,2 g');
  assert.equal(merged.macros.carbs, 62.1, 'la valeur avant « dont »');
  assert.equal(merged.macros.fat, 24.5);
  // Le mot seul sur sa ligne, la sous-ligne en dessous : on ne prend rien.
  const split = parseLabelText('Matières grasses\ndont acides gras saturés 11 g');
  assert.equal(split.macros.fat, null, 'mieux rien qu’une valeur fausse');
});

test('L’étiquette : une valeur coupée en deux lignes est retrouvée', () => {
  assert.equal(parseLabelText('Protéines\n6,2 g').macros.protein, 6.2);
});

test('L’étiquette : le tableau des apports de référence n’est jamais lu', () => {
  const result = parseLabelText('Protéines 6,2 g\nApports de référence pour un adulte type : Protéines 50 g');
  assert.equal(result.macros.protein, 6.2, 'la valeur du produit, pas celle de l’adulte type');
});

test('L’étiquette : sans « g », un nombre n’est pas un gramme', () => {
  assert.equal(parseLabelText('Protéines 6').macros.protein, null);
  assert.equal(parseLabelText('Protéines 6 g').macros.protein, 6);
  assert.deepEqual(parseLabelText('Énergie 489 kcal').macros, { protein: null, carbs: null, fat: null });
});

test('L’étiquette : une photo illisible ne produit aucune valeur, et ne plante pas', () => {
  for (const text of ['', '   ', 'xxxx\n----', '0 0 0']) {
    assert.deepEqual(parseLabelText(text).macros, { protein: null, carbs: null, fat: null });
  }
});

/* ----------------- Les grammes suivent la même règle que les kcal ----------------- */

const base = { name: 'Biscuits', kcal: 489, basis: '100g', byPiece: false, portionName: 'biscuit' };
const macros = { protein: 6.2, carbs: 62.1, fat: 24.5 };

test('Pour 100 g, les grammes lus sont gardés tels quels', () => {
  const food = foodFromLabel({ ...base, macros });
  assert.deepEqual(food.reference.macros, macros);
  assert.equal(food.reference.macrosComplete, true);
  assert.equal(food.reference.amount, 100);
  assert.equal(food.reference.calories.estimated, 489);
  assert.match(food.reference.description, /6[.,]2 g de protéines/);
});

test('Par pièce, les grammes sont mis à l’échelle comme les kcal', () => {
  const food = foodFromLabel({ ...base, byPiece: true, gramsPerPiece: 25, macros });
  assert.equal(food.reference.unit, 'portion');
  assert.equal(Math.round(food.reference.calories.estimated * 10) / 10, 122.3, '489 × 0,25');
  assert.deepEqual(food.reference.macros, { protein: 1.6, carbs: 15.5, fat: 6.1 });
  const portion = foodFromLabel({ ...base, basis: 'serving', piecesPerServing: 2, macros });
  assert.deepEqual(portion.reference.macros, { protein: 3.1, carbs: 31.1, fat: 12.3 }, 'une portion de 2 pièces : la moitié');
});

test('Sans macros, l’aliment est exactement celui d’avant la V5.0', () => {
  const food = foodFromLabel(base);
  assert.deepEqual(food.reference.macros, { protein: 0, carbs: 0, fat: 0 });
  assert.equal(food.reference.macrosComplete, false);
  assert.ok(!/protéines/.test(food.reference.description));
});

test('Des macros partielles restent partielles : aucun zéro inventé', () => {
  const food = foodFromLabel({ ...base, macros: { protein: 6.2, carbs: null, fat: null } });
  assert.equal(food.reference.macrosComplete, false, 'l’accueil affichera « bilan partiel »');
  assert.equal(food.reference.macros.protein, 6.2);
});

test('Une valeur impossible est refusée, avec une phrase qui dit quoi vérifier', () => {
  assert.throws(() => foodFromLabel({ ...base, macros: { ...macros, protein: 150 } }), /protéines/);
  assert.throws(() => foodFromLabel({ ...base, macros: { ...macros, fat: -1 } }), /lipides/);
  // Par pièce, une valeur au-dessus de 100 g reste possible : la pièce peut être grosse.
  assert.doesNotThrow(() => foodFromLabel({ ...base, basis: 'piece', macros: { protein: 150, carbs: 10, fat: 5 } }));
});

/* --------------------------- Les lectures offertes --------------------------- */

test('Trois lectures offertes, annoncées dès la première', () => {
  assert.equal(FREE_LABEL_MACRO_READS, 3);
  const first = labelMacroTrial(0, false);
  assert.deepEqual(first, { unlocked: false, allowed: true, left: 3, used: 0 });
  assert.match(trialNotice(first), /3 lectures offertes/);
  assert.match(trialNotice(labelMacroTrial(1, false)), /reste 2 lectures/);
  assert.match(trialNotice(labelMacroTrial(2, false)), /Dernière/);
  const done = labelMacroTrial(3, false);
  assert.equal(done.allowed, false, 'la quatrième est verrouillée');
  assert.equal(trialNotice(done), null);
});

test('Le premium ne compte pas les lectures, et un compteur abîmé ne débloque rien', () => {
  const unlocked = labelMacroTrial(3, true);
  assert.equal(unlocked.allowed, true);
  assert.equal(trialNotice(unlocked), null, 'rien à annoncer à qui a payé');
  assert.equal(readLabelMacroReads(-5), 0);
  assert.equal(readLabelMacroReads(99), 3, 'jamais plus que le maximum');
  assert.equal(readLabelMacroReads('deux'), 0);
  assert.equal(readLabelMacroReads(1.5), 0);
  assert.equal(labelMacroTrial(-5, false).allowed, true);
});

/* ------------------------------ La journée type ------------------------------ */

const DAY = '2026-10-17';
const at = (day, hour, minute) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d, hour, minute, 0).toISOString(); };
const mealAt = (day, hour, minute, kcal, id, moment = 'Déjeuner') => ({
  id, createdAt: at(day, hour, minute), moment, description: `repas ${id}`, method: 'manual',
  items: [{ foodId: 'x', name: 'x', quantity: 1, calories: { min: kcal, estimated: kcal, max: kcal }, macros: { protein: 1, carbs: 2, fat: 3 }, confidence: 'Moyenne' }],
  calories: { min: kcal, estimated: kcal, max: kcal }, macros: { protein: 1, carbs: 2, fat: 3 },
});
const journee = [mealAt(DAY, 8, 15, 400, 'a', 'Petit-déjeuner'), mealAt(DAY, 12, 30, 800, 'b'), mealAt(DAY, 19, 45, 700, 'c', 'Dîner')];

test('Une journée type est la copie exacte des repas déjà confirmés, du matin au soir', () => {
  const template = templateFromDay(journee, DAY, 'Ma semaine');
  assert.equal(template.name, 'Ma semaine');
  assert.deepEqual(template.meals.map(m => m.id), ['a', 'b', 'c'], 'rangés dans l’ordre de la journée');
  assert.equal(templateLine(template), '3 repas · 1 900 kcal'.replace('1 900', (1900).toLocaleString('fr-FR')));
  assert.equal(templateFromDay([], DAY, 'Vide'), null, 'une journée vide ne fait pas un modèle');
});

test('Les journées d’exemple ne deviennent jamais un modèle', () => {
  const demo = [mealAt(DAY, 8, 0, 300, 'demo-breakfast'), mealAt(DAY, 12, 0, 500, 'vrai')];
  const template = templateFromDay(demo, DAY, 'Test');
  assert.deepEqual(template.meals.map(m => m.id), ['vrai']);
  assert.equal(templateFromDay([mealAt(DAY, 8, 0, 300, 'demo-x')], DAY, 'Test'), null);
});

test('Rejouer une journée : nouvelle identité, heures gardées, bonne date', () => {
  const template = templateFromDay(journee, DAY, 'Ma semaine');
  const target = '2026-10-20';
  const added = applyTemplate(template, target);
  assert.equal(added.length, 3);
  assert.equal(mealsForDay(added, target).length, 3, 'les trois repas tombent bien sur la journée visée');
  for (const [index, meal] of added.entries()) {
    assert.notEqual(meal.id, template.meals[index].id, 'une copie, pas le modèle lui-même');
    const source = new Date(template.meals[index].createdAt), copy = new Date(meal.createdAt);
    assert.equal(copy.getHours(), source.getHours(), 'le petit-déjeuner reste le matin');
    assert.equal(copy.getMinutes(), source.getMinutes());
    assert.equal(meal.moment, template.meals[index].moment);
    assert.equal(meal.calories.estimated, template.meals[index].calories.estimated);
    assert.notEqual(meal.items, template.meals[index].items, 'les aliments sont copiés, pas partagés');
  }
  // Modifier la copie ne touche pas au modèle.
  added[0].items[0].name = 'changé';
  assert.equal(template.meals[0].items[0].name, 'x');
});

test('Les limites d’une journée type sont dites, pas subies', () => {
  const templates = Array.from({ length: MAX_TEMPLATES }, (_, i) => ({ id: `t${i}`, name: `Journée type ${i + 1}`, createdAt: at(DAY, 10, 0), meals: journee }));
  assert.equal(templateIssue([], 'Ma semaine', 3), null);
  assert.match(templateIssue([], '  ', 3), /nom/);
  assert.match(templateIssue([], 'Ma semaine', 0), /aucun repas/);
  assert.match(templateIssue([], 'x'.repeat(41), 3), /40/);
  assert.match(templateIssue([], 'Ma semaine', MAX_MEALS_PER_TEMPLATE + 1), /15/);
  assert.match(templateIssue(templates, 'Une de plus', 3), /Supprimes-en une/);
  assert.equal(templateIssue(templates, 'Journée type 2', 3), null, 'réenregistrer sous le même nom reste possible');
  assert.equal(suggestedTemplateName([]), 'Journée type 1');
  assert.equal(suggestedTemplateName(templates.slice(0, 2)), 'Journée type 3');
});

test('Un modèle abîmé dans le stockage est écarté, pas réparé', () => {
  const good = { id: 't1', name: 'Ma semaine', createdAt: at(DAY, 10, 0), meals: journee };
  assert.equal(readDayTemplates([good]).length, 1);
  assert.equal(readDayTemplates([{ ...good, meals: [] }]).length, 0, 'un modèle sans repas ne sert à rien');
  assert.equal(readDayTemplates([{ ...good, name: '' }]).length, 0);
  assert.equal(readDayTemplates([{ ...good, createdAt: 'hier' }]).length, 0);
  assert.equal(readDayTemplates([{ ...good, meals: [{ sans: 'rien' }] }]).length, 0);
  assert.deepEqual(readDayTemplates('non'), []);
  assert.deepEqual(readDayTemplates(null), []);
  assert.equal(readDayTemplates(Array.from({ length: 9 }, (_, i) => ({ ...good, id: `t${i}` }))).length, MAX_TEMPLATES);
});

/* ----------------------- Ce qui reste gratuit, à l'écran ----------------------- */

test('Les kcal de l’étiquette ne dépendent jamais du premium', () => {
  const form = read('src/components/LabelFoodForm.tsx');
  assert.ok(form.includes('const usingMacros = trial.allowed && showMacros && macrosFound(typedMacros) > 0'));
  assert.ok(form.includes('...(usingMacros ? { macros: typedMacros } : {})'), 'sans droit, aucun gramme n’est transmis');
  // Les kcal, la référence et la quantité ne connaissent pas le premium.
  const code = form.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  const kcalPart = code.slice(code.indexOf('const kcal = readNumber(energy)'), code.indexOf('const typedMacros'));
  assert.ok(kcalPart.length > 0 && !/trial|premium|paywall/i.test(kcalPart), 'le calcul des kcal est inchangé');
});

test('Une lecture offerte n’est décomptée qu’à l’ajout, et jamais pour un acheteur', () => {
  const form = read('src/components/LabelFoodForm.tsx');
  assert.ok(form.includes('if (usingMacros && !premium.unlocked) useLabelMacroRead();'));
  const onPress = form.slice(form.indexOf('onPress={() => {\n          if (!preview || !food)'), form.indexOf('onAdd(preview);'));
  assert.ok(onPress.includes('useLabelMacroRead'), 'le décompte est dans le bouton d’ajout');
  assert.equal((form.match(/useLabelMacroRead\(\)/g) || []).length, 1, 'un seul endroit décompte');
});

test('La journée type s’affiche sur l’accueil, et « Refaire un repas habituel » reste gratuit', () => {
  const today = read('src/screens/TodayScreen.tsx');
  assert.ok(today.includes('<DayTemplates />'));
  assert.ok(today.includes('Refaire un repas habituel') && today.includes('repeatMeal(template.meal, selectedDay)'), 'le repas habituel est intact');
  const templates = read('src/components/DayTemplates.tsx');
  assert.ok(templates.includes("feature=\"journee\""), 'verrouillée, elle renvoie à l’écran du premium');
  assert.ok(templates.includes('addMeals(added)'), 'les repas sont ajoutés ensemble, pas un par un');
});

test('Plusieurs repas s’ajoutent en une fois, sans s’écraser dans la journée d’exemple', () => {
  const ctx = read('src/state/AppContext.tsx');
  const addMeals = ctx.slice(ctx.indexOf('const addMeals = useCallback'), ctx.indexOf('const updateMeal'));
  assert.ok(addMeals.includes('[...entries, ...(isDemo ? [] : current)]'));
  assert.ok(addMeals.includes('setIsDemo(false)'));
  assert.ok(ctx.includes('setDayTemplates(readDayTemplates(parsed.dayTemplates))'), 'les modèles sont relus défensivement');
  assert.ok(ctx.includes('setLabelMacroReads(readLabelMacroReads(parsed.labelMacroReads))'));
  assert.ok(ctx.includes('dayTemplates,\n  }, null, 2)'), 'les modèles font partie de la sauvegarde de la personne');
  const exportPart = ctx.slice(ctx.indexOf('const exportData'), ctx.indexOf('const value = useMemo'));
  assert.ok(!/labelMacroReads/.test(exportPart), 'le compteur d’essais n’est pas une donnée de la personne');
});
