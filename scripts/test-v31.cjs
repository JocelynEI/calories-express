const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const { searchFoods, recentFoods, quickPortion, ciqualFood } = require('../.test-dist/domain/food-search.js');

/**
 * V4.1 — chercher et ajouter un aliment en quelques secondes.
 *
 * Vérifié ici : les propositions suivent la frappe dès la 2e lettre, les
 * aliments déjà mangés reviennent en tête, un appui sur + ajoute une portion
 * courante, et l'aliment perso ne demande plus que deux réponses.
 */

test('L’autocomplétion répond dès la 2e lettre, et plus tôt pour tes aliments', () => {
  assert.equal(searchFoods('p').length, 0, 'une seule lettre ne fouille pas toute la base');
  assert.ok(searchFoods('po').length > 0, 'deux lettres suffisent');
  const pomme = searchFoods('pom');
  assert.ok(pomme.length > 0 && pomme.every(f => /pom/i.test(f.name)), 'les noms proposés contiennent ce qui est tapé');
  const perso = { id: 'custom-gateau-portion', name: 'Gâteau de Mamie', reference: { unit: 'portion', amount: 1, calories: { min: 300, estimated: 300, max: 300 }, macros: { protein: 0, carbs: 0, fat: 0 }, macrosComplete: false, source: 'manual' } };
  assert.equal(searchFoods('g', [perso])[0].id, perso.id, 'dès la 1re lettre pour tes aliments');
});

test('Un mot qui commence le nom passe devant un mot au milieu', () => {
  const first = searchFoods('banane')[0];
  assert.equal(first.id, 'ciqual-13005');
  assert.deepEqual(searchFoods('xyzalimentinexistant'), []);
});

const eaten = (id, name, day) => ({ createdAt: `2026-10-${day}T12:00:00.000Z`, items: [{ foodId: id, name, quantity: 100, calories: { min: 1, estimated: 1, max: 1 }, macros: { protein: 0, carbs: 0, fat: 0 }, confidence: 'Moyenne', reference: ciqualFood(['9811', name, 100, 1, 1, 1]).reference }] });

test('Les aliments récents viennent des repas, du plus récent au plus ancien, sans doublon', () => {
  const meals = [eaten('a', 'Riz', '10'), eaten('b', 'Pomme', '12'), eaten('a', 'Riz', '14'), { createdAt: '2026-10-15T08:00:00.000Z', items: [{ foodId: 'old', name: 'Ancien', quantity: 1, calories: { min: 1, estimated: 1, max: 1 }, macros: { protein: 0, carbs: 0, fat: 0 }, confidence: 'Moyenne' }] }];
  const out = recentFoods(meals, [], 6);
  assert.deepEqual(out.map(f => f.id), ['a', 'b'], 'le repas sans référence est ignoré, le doublon aussi');
  const saved = { id: 'm', name: 'Mémorisé', reference: out[0].reference };
  assert.deepEqual(recentFoods(meals, [saved], 6).map(f => f.id), ['a', 'b', 'm'], 'les aliments mémorisés complètent la liste');
  assert.equal(recentFoods(meals, [saved], 2).length, 2, 'la liste respecte sa limite');
  assert.deepEqual(recentFoods([], [], 6), []);
});

test('Le + ajoute une portion courante, dans la bonne unité', () => {
  const lait = searchFoods('lait demi-écrémé').find(f => /lait/i.test(f.name));
  assert.ok(lait);
  const q = quickPortion(lait);
  assert.equal(q.label, '1 verre');
  assert.equal(q.item.quantity, 200);
  assert.equal(q.item.reference.unit, 'ml', 'un liquide se compte en ml');
  assert.equal(q.item.calories.estimated, Math.round(lait.reference.calories.estimated * 2));

  const portion = { id: 'p', name: 'Pain du boulanger', reference: { unit: 'portion', amount: 1, calories: { min: 120, estimated: 120, max: 120 }, macros: { protein: 0, carbs: 0, fat: 0 }, macrosComplete: false, source: 'manual' } };
  const qp = quickPortion(portion);
  assert.equal(qp.item.quantity, 1, 'une référence en portion vaut une portion, jamais des grammes');
  assert.equal(qp.item.calories.estimated, 120);
  assert.equal(qp.label, '1 portion');
});

test('Chaque aliment de la base a une portion rapide valide', () => {
  for (const name of ['riz', 'pomme', 'oeuf', 'yaourt', 'pain', 'huile', 'fromage', 'soupe']) {
    for (const food of searchFoods(name)) {
      const q = quickPortion(food);
      assert.ok(q.item.quantity > 0 && Number.isFinite(q.item.calories.estimated), food.name);
    }
  }
});

/* ------------------------------------------------------- l’interface --- */

test('Chaque proposition a son +, et « moi-même » est toujours au bout de la liste', () => {
  const ecran = read('src/components/UnifiedFoodSearch.tsx');
  assert.ok(ecran.includes('onQuickAdd'), 'un appui sur + ajoute');
  assert.ok(ecran.includes('quickPortion('), 'la portion vient du domaine');
  assert.ok(ecran.includes('recentFoods('), 'les récents ouvrent la recherche');
  assert.match(ecran, /moi-même/, 'ajouter son propre aliment est proposé à l’endroit de la recherche');
  assert.ok(!ecran.includes('Je connais les kcal : saisir une étiquette'), 'l’ancien bouton caché en bas a disparu');
  assert.match(ecran, /reference\.unit === 'portion' \? \[\]/, 'un aliment en portions n’a pas de mesure en grammes');
});

test('Le total et l’enregistrement restent visibles en bas de l’ajout', () => {
  const modal = read('src/components/AddMealModal.tsx');
  assert.ok(modal.includes('styles.footer'));
  assert.ok(modal.includes('autoFocus={!editing && startWith === \'search\'}'), 'le clavier s’ouvre seul sur la recherche');
  const dansCarte = modal.slice(modal.indexOf('Ton repas'), modal.indexOf('</ScrollView>\n\n'));
  assert.ok(!dansCarte.includes('onPress={confirm}'), 'un seul bouton d’enregistrement');
});

test('Mon aliment : le nom et les calories suffisent', () => {
  const f = read('src/components/FoodEntryForms.tsx');
  assert.match(f, /useState<FoodReference\['unit'\]>\('portion'\)/, 'une portion par défaut');
  assert.ok(f.includes('Plus d’options'), 'le reste est derrière un lien');
  assert.ok(f.includes('const refKcal = readNumber(calories), qty = unit === \'portion\' ? 1 : readNumber(quantity)'), 'une portion vaut 1, jamais 100');
});
