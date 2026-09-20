const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const { readProductImage, parseProduct } = require('../.test-dist/domain/foods.js');
const { drawingFor } = require('../.test-dist/domain/food-images.js');
const { mealPhoto, mealSubject } = require('../.test-dist/domain/meals.js');

/* ------------------------------------------- les photos réelles (V2.4) */

test('Seules les photos servies par Open Food Facts sont acceptées', () => {
  const bonne = 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.4.200.jpg';
  assert.equal(readProductImage(bonne), bonne);

  // Tout le reste est refusé : c'est une valeur qui arrive du réseau, et
  // l'application ne doit jamais aller chercher une image sur un serveur
  // quelconque, ni suivre une adresse non chiffrée.
  for (const mauvaise of [
    'http://images.openfoodfacts.org/images/products/1/front.jpg', // pas de https
    'https://exemple.test/photo.jpg',
    'https://images.openfoodfacts.org.attaquant.test/images/products/a.jpg',
    'https://images.openfoodfacts.org/images/products/../../etc/passwd',
    'javascript:alert(1)', '', null, undefined, 42, {},
  ]) {
    assert.equal(readProductImage(mauvaise), undefined, `acceptée à tort : ${String(mauvaise)}`);
  }

  assert.equal(readProductImage('https://images.openfoodfacts.org/images/products/' + 'a'.repeat(400) + '.jpg'), undefined, 'adresse démesurée');
});

test('Un produit sans photo reste utilisable', () => {
  const base = {
    code: '3017620422003', product_name: 'Test', brands: 'Marque',
    nutriments: { 'energy-kcal_100g': 120, proteins_100g: 5, carbohydrates_100g: 10, fat_100g: 6 },
  };
  const sans = parseProduct(base);
  assert.ok(sans, 'le produit doit rester valide sans photo');
  assert.equal(sans.imageUrl, undefined);

  const url = 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.4.200.jpg';
  assert.equal(parseProduct({ ...base, image_front_small_url: url }).imageUrl, url);
  // Une adresse abîmée n'invalide pas le produit : on perd l'image, pas les calories.
  const abime = parseProduct({ ...base, image_front_small_url: 'https://ailleurs.test/x.jpg' });
  assert.ok(abime);
  assert.equal(abime.imageUrl, undefined);
});

test('La recherche demande bien les champs photo', () => {
  const source = read('src/services/products.ts');
  assert.ok(source.includes('image_front_small_url'), 'la petite photo doit être demandée');
});

/* ------------------------------------------------ le repli sur le dessin */

test('Le dessin ne se déclenche que sur un mot reconnu', () => {
  assert.equal(drawingFor('Pomme Golden'), 'pomme');
  assert.equal(drawingFor('Filet de saumon fumé'), 'poisson');
  assert.equal(drawingFor('Pain de campagne'), 'pain');
  assert.equal(drawingFor('Omelette aux herbes'), 'oeuf');
  assert.equal(drawingFor('riz'), 'riz');

  // V2.5 : la bibliothèque s'est étoffée, la correspondance suit.
  assert.equal(drawingFor('Lasagnes bolognaise'), 'pates');
  assert.equal(drawingFor('Blanc de poulet'), 'poulet');
  assert.equal(drawingFor('Comté 18 mois'), 'fromage');
  assert.equal(drawingFor('Velouté de potiron'), 'soupe');
  assert.equal(drawingFor('Salade de crudités'), 'salade');

  // Aucune image vaut mieux qu'une image fausse.
  for (const inconnu of ['Barre chocolatée', 'Cassoulet', 'Tiramisu', '', '   ']) {
    assert.equal(drawingFor(inconnu), null, `dessin inventé pour « ${inconnu} »`);
  }
});

/* ---------------------------------------------- la vignette d'un repas */

test('Un repas montre la première photo disponible', () => {
  const url = 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.4.200.jpg';
  const repas = {
    id: 'm1', createdAt: '2026-09-20T08:10:00.000Z', moment: 'Petit-déjeuner',
    description: '80 g de muesli avec du lait', method: 'phrase',
    items: [
      { foodId: 'a', name: 'Muesli', quantity: 80, calories: { min: 300, estimated: 320, max: 340 }, macros: { protein: 8, carbs: 55, fat: 6 }, confidence: 'Bonne' },
      { foodId: 'b', name: 'Lait demi-écrémé', quantity: 200, calories: { min: 90, estimated: 92, max: 95 }, macros: { protein: 7, carbs: 10, fat: 3 }, confidence: 'Bonne', reference: { imageUrl: url } },
    ],
    calories: { min: 390, estimated: 412, max: 435 }, macros: { protein: 15, carbs: 65, fat: 9 },
  };
  assert.equal(mealPhoto(repas), url, 'la photo du second aliment doit être retenue');
  assert.equal(mealSubject(repas), 'Muesli', 'on illustre l’aliment principal, pas la phrase entière');

  const sansPhoto = { ...repas, items: [repas.items[0]] };
  assert.equal(mealPhoto(sansPhoto), undefined);
  assert.equal(mealSubject({ ...sansPhoto, items: [] }), sansPhoto.description, 'repli sur la description');
});

/* --------------------------------------- l'accueil rangé en blocs (V2.4) */

test('L’accueil est découpé en blocs thématiques', () => {
  const home = read('src/screens/TodayScreen.tsx');
  for (const titre of ['Ma journée', 'Mes repas', 'Mon activité']) {
    assert.ok(home.includes(`title="${titre}"`), `bloc manquant : ${titre}`);
  }
  // Ce qui a déménagé ne doit pas revenir en douce.
  assert.equal(home.includes('StoryRail'), false, 'les séquences ont quitté l’accueil');
  assert.equal(home.includes('GuideAvatar'), false, 'le conseil illustré a quitté l’accueil');
});

test('Les minutes de Jaws ne vivent plus qu’à un seul endroit', () => {
  const ecrans = ['src/screens/TodayScreen.tsx', 'src/screens/ProfileScreen.tsx', 'src/screens/JournalScreen.tsx'];
  for (const ecran of ecrans) {
    assert.equal(read(ecran).includes('Les minutes de Jaws'), false, `${ecran} : doublon`);
  }
  assert.ok(read('src/screens/ProgressScreen.tsx').includes('Les minutes de Jaws'), 'elles doivent rester dans la Progression');
});

test('La création de profil ne propose plus de valeurs d’exemple', () => {
  for (const ecran of ['src/screens/OnboardingScreen.tsx', 'src/screens/ProfileScreen.tsx']) {
    const source = read(ecran);
    assert.equal(/placeholder="[^"]+"/.test(source), false, `${ecran} : un exemple gris subsiste`);
    assert.equal(/placeholder: '\d/.test(source), false, `${ecran} : un nombre d’exemple subsiste`);
  }
});

/* ------------------------------- le retour du parcours guidé (V2.4.4) */

const { shouldShowOnboarding } = require('../.test-dist/domain/onboarding.js');

test('Sans profil, le parcours guidé s’affiche', () => {
  assert.equal(shouldShowOnboarding({ replay: false, profileCompleted: false, skippedThisLaunch: false }), true);
});

test('Avec un profil, il ne s’affiche pas tout seul', () => {
  assert.equal(shouldShowOnboarding({ replay: false, profileCompleted: true, skippedThisLaunch: false }), false);
  // ... mais le bouton du Profil l'emporte toujours.
  assert.equal(shouldShowOnboarding({ replay: true, profileCompleted: true, skippedThisLaunch: true }), true);
});

test('« Passer » ne vaut que pour ce lancement', () => {
  // Pendant ce lancement, on n'y revient pas.
  assert.equal(shouldShowOnboarding({ replay: false, profileCompleted: false, skippedThisLaunch: true }), false);
  // Au lancement suivant, la mémoire du « Passer » est repartie : sans profil,
  // les étapes reviennent. C'est le défaut corrigé en V2.4.4 — auparavant ce
  // choix était écrit sur le téléphone, et effacer son profil ne ramenait
  // jamais le parcours.
  assert.equal(shouldShowOnboarding({ replay: false, profileCompleted: false, skippedThisLaunch: false }), true);
});

test('Effacer son profil ramène les étapes', () => {
  // Le scénario exact rapporté : parcours suivi, profil créé, puis effacé.
  let etat = { replay: false, profileCompleted: false, skippedThisLaunch: false };
  assert.equal(shouldShowOnboarding(etat), true, 'premier lancement');

  etat = { ...etat, profileCompleted: true, skippedThisLaunch: true };
  assert.equal(shouldShowOnboarding(etat), false, 'profil créé');

  // Effacement depuis le Profil, puis relancement de l'application.
  etat = { replay: false, profileCompleted: false, skippedThisLaunch: false };
  assert.equal(shouldShowOnboarding(etat), true, 'le parcours doit revenir');
});

test('Aucun réglage enregistré ne peut plus bloquer le parcours', () => {
  // Garde-fou de source : la décision ne doit dépendre que de l'état courant,
  // jamais d'un drapeau écrit sur le téléphone.
  const app = read('App.tsx');
  assert.equal(app.includes('settings.onboardingDone'), false, 'la décision ne doit plus lire le stockage');
  assert.ok(app.includes('shouldShowOnboarding'), 'la décision passe par la fonction testée');

  const parcours = read('src/screens/OnboardingScreen.tsx');
  assert.equal(parcours.includes("setSetting('onboardingDone'"), false, 'le parcours ne doit plus graver ce choix');
});
