const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  words, head, isLiquid, familyOf, displayUnit, measuresFor,
  stepCount, countLabel, quantityFor, referenceForDisplay,
} = require('../.test-dist/domain/measures.js');

const ciqual = require('../src/data/ciqual2025.json');
const propre = (nom) => String(nom).replace(/\s+/g, ' ');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

/**
 * V3.3 — les mesures courantes.
 *
 * Deux risques : classer de travers (faire boire une salade de museau), et
 * convertir de travers (annoncer un bol de lait à 46 kcal). Les deux sont
 * couverts ici, et le classement est vérifié sur les 3 339 aliments réels du
 * catalogue, pas sur trois exemples choisis.
 */

/* ------------------------------------------------------- lire un nom ---- */

test('Les noms sont découpés en mots entiers, sans accent', () => {
  assert.deepEqual(words('Café au lait'), ['cafe', 'au', 'lait']);
  assert.deepEqual(words('Chou-fleur, bouilli/cuit à l’eau'), ['chou', 'fleur', 'bouilli', 'cuit', 'a', 'l', 'eau']);
  // Le piège du museau : « eau » ne doit jamais sortir d’un mot plus long.
  assert.ok(!words('Salade de museau de porc').includes('eau'));
});

test('On ne lit que la tête du nom : l’aliment, pas sa cuisson', () => {
  assert.deepEqual(head('Chou-fleur, bouilli/cuit à l’eau'), ['chou', 'fleur']);
  assert.deepEqual(head('Coq au vin'), ['coq']);
  assert.deepEqual(head('Jus de fruits, à base de concentré'), ['jus', 'de', 'fruits']);
  assert.deepEqual(head('Sardine, à l’huile de tournesol'), ['sardine']);
});

/* ------------------------------------------------- liquide ou solide ---- */

const LIQUIDES = [
  'Lait demi-écrémé, UHT', 'Jus d’orange, pur jus', 'Eau minérale, gazeuse',
  'Boisson au thé, aromatisée', 'Bière blonde', 'Vin rouge', 'Café, expresso',
  'Soupe aux légumes variés, déshydratée reconstituée', 'Bouillon de boeuf, déshydraté reconstitué',
  'Chocolat chaud', 'Yaourt à boire nature', 'Smoothie fruits rouges',
];

const SOLIDES = [
  'Coq au vin', 'Chou-fleur, bouilli/cuit à l’eau', 'Salade de museau de porc, avec sauce',
  'Saucisse cocktail', 'Thé, feuille', 'Café, poudre soluble', 'Chocolat au lait, tablette',
  'Riz au lait', 'Sardine, à l’huile de tournesol, appertisée', 'Gâteau au yaourt',
  'Moules marinières (oignons et vin blanc), préemballées', 'Pizza jambon fromage, préemballée',
];

test('Ce qui se boit, et ce qui ne se boit pas', () => {
  for (const nom of LIQUIDES) assert.equal(isLiquid(nom), true, `devrait être liquide : ${nom}`);
  for (const nom of SOLIDES) assert.equal(isLiquid(nom), false, `ne devrait pas être liquide : ${nom}`);
});

test('Les familles rangent chaque aliment avec ses semblables', () => {
  const attendu = {
    'Lait demi-écrémé, UHT': 'liquide',
    'Soupe à l’oignon, préemballée à réchauffer': 'soupe',
    'Huile d’olive vierge extra': 'huile',
    'Pain blanc, passé au grille-pain': 'pain',
    'Oeuf de poule, entier, cuit dur': 'oeuf',
    'Yaourt nature, au lait entier': 'yaourt',
    'Fromage frais type petit suisse, nature': 'yaourt',
    'Emmental': 'fromage',
    'Fromage de tête': 'autre',
    'Pâtes fraîches, aux oeufs, cuites': 'feculent',
    'Pâtes alimentaires, crues': 'autre',
    'Pizza jambon fromage, préemballée': 'autre',
  };
  for (const [nom, famille] of Object.entries(attendu)) {
    assert.equal(familyOf(nom), famille, `${nom} devrait être « ${famille} »`);
  }
});

/* ------------------------------ le catalogue entier, pas un échantillon -- */

test('Aucun plat cuisiné ne se retrouve dans les boissons', () => {
  // Les mots qui, dans un nom de boisson, trahissent un plat : si l'un d'eux
  // apparaît en tête d'un aliment classé liquide, c'est une erreur.
  const platsInterdits = ['salade', 'saucisse', 'poulet', 'boeuf', 'porc', 'moules', 'pizza', 'gateau', 'tarte', 'sandwich'];
  const fautifs = [];
  for (const [, nom] of ciqual) {
    const propreNom = propre(nom);
    if (familyOf(propreNom) !== 'liquide' && familyOf(propreNom) !== 'soupe') continue;
    // Le premier mot nomme l'aliment : « Bouillon de boeuf » est un bouillon,
    // « Saucisse cocktail » est une saucisse.
    if (platsInterdits.includes(head(propreNom)[0])) fautifs.push(propreNom);
  }
  assert.deepEqual(fautifs, [], `classés à boire par erreur : ${fautifs.slice(0, 5).join(' | ')}`);
});

test('Le classement reste stable et mesuré sur les 3 339 aliments', () => {
  const compte = {};
  for (const [, nom] of ciqual) {
    const famille = familyOf(propre(nom));
    compte[famille] = (compte[famille] ?? 0) + 1;
  }
  assert.equal(Object.values(compte).reduce((a, b) => a + b, 0), ciqual.length);
  // Des bornes larges : elles n'imposent pas un chiffre, elles préviennent
  // qu'un changement de règle a tout fait basculer d'un côté.
  assert.ok(compte.liquide > 200 && compte.liquide < 600, `liquides : ${compte.liquide}`);
  assert.ok(compte.soupe > 20 && compte.soupe < 150, `soupes : ${compte.soupe}`);
  assert.ok(compte.autre > 2000, `le reste doit rester majoritaire : ${compte.autre}`);
});

test('Chaque aliment du catalogue reçoit des mesures utilisables', () => {
  for (const [, nom] of ciqual.slice(0, 500)) {
    const mesures = measuresFor(propre(nom));
    assert.ok(mesures.length > 0, `aucune mesure pour ${nom}`);
    for (const mesure of mesures) {
      assert.ok(mesure.amount > 0 && mesure.amount <= 1000, `${nom} : mesure aberrante ${mesure.amount}`);
      assert.ok(mesure.label.length > 0 && mesure.label.length < 20, `${nom} : libellé douteux`);
    }
  }
});

/* --------------------------------------------------- les conversions ---- */

test('Un bol de lait demi-écrémé donne bien 115 kcal', () => {
  const mesures = measuresFor('Lait demi-écrémé, UHT');
  const bol = mesures.find(mesure => mesure.id === 'bol');
  assert.ok(bol, 'le bol doit être proposé pour un lait');
  assert.equal(bol.amount, 250);
  assert.equal(displayUnit('Lait demi-écrémé, UHT'), 'ml');
  // 46 kcal pour 100 ml × 2,5 = 115.
  assert.equal(Math.round(46 * quantityFor(bol, 1) / 100), 115);
});

test('Le compteur avance par demi-mesures et ne descend jamais à zéro', () => {
  assert.equal(stepCount(1, 1), 1.5);
  assert.equal(stepCount(1, -1), 0.5);
  assert.equal(stepCount(0.5, -1), 0.5, 'une demi-mesure est le minimum');
  assert.equal(stepCount(20, 1), 20, 'et vingt le maximum');
  assert.equal(quantityFor({ id: 'bol', label: '1 bol', amount: 250 }, 0.5), 125);
  assert.equal(quantityFor({ id: 'bol', label: '1 bol', amount: 250 }, 2), 500);
});

test('Le compteur s’écrit en français', () => {
  const bol = { id: 'bol', label: '1 bol', amount: 250 };
  const cuillere = { id: 'cs', label: '1 c. à soupe', amount: 15 };
  assert.equal(countLabel(bol, 1), '1 bol');
  assert.equal(countLabel(bol, 2), '2 bols');
  assert.equal(countLabel(bol, 0.5), '½ bol');
  assert.equal(countLabel(bol, 1.5), '1,5 bol');
  assert.equal(countLabel(cuillere, 2), '2 c. à soupe', 'une cuillère ne prend pas de s ici');
});

test('Un liquide se présente en millilitres, sans changer ses calories', () => {
  const lait = { id: 'x', name: 'Lait demi-écrémé, UHT', reference: { unit: 'g', amount: 100, calories: { min: 46, estimated: 46, max: 46 }, macros: { protein: 3, carbs: 5, fat: 1.5 }, macrosComplete: true, source: 'ciqual' } };
  const affiche = referenceForDisplay(lait);
  assert.equal(affiche.unit, 'ml');
  assert.equal(affiche.amount, 100);
  assert.equal(affiche.calories.estimated, 46, 'les calories ne bougent pas');
  const pain = { ...lait, name: 'Pain blanc' };
  assert.equal(referenceForDisplay(pain).unit, 'g', 'un solide reste en grammes');
});

/* ------------------------------------------------------- l’interface --- */

test('L’étape de quantité propose les mesures avant le champ libre', () => {
  const ecran = read('src/components/UnifiedFoodSearch.tsx');
  assert.ok(ecran.includes('2 · COMBIEN EN AS-TU PRIS ?'), 'la question doit titrer l’étape');
  assert.match(ecran, /useState<'mesures' \| 'pesee'>\(saisie \? 'pesee' : 'mesures'\)/, 'les mesures sont le mode par défaut');
  assert.ok(ecran.includes('Revenir aux mesures courantes'), 'le champ libre reste accessible, et réversible');
  assert.ok(ecran.includes('measuresFor'), 'les mesures viennent du domaine');
  // L'équivalence doit être affichée sous chaque mesure : une moyenne annoncée
  // vaut mieux qu'une précision fausse.
  assert.match(ecran, /styles\.mesureEquiv/, 'chaque mesure affiche son équivalence');
});
