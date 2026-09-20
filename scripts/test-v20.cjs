const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { ILLUSTRATIONS } = require('../.test-dist/data/illustrations.js');
const read = (...parts) => fs.readFileSync(path.join(__dirname, '..', ...parts), 'utf8');

/* ------------------------------------------------------- formes d'aliments */

test('Chaque illustration est un SVG complet et cohérent', () => {
  const foods = Object.entries(ILLUSTRATIONS);
  assert.ok(foods.length >= 15, `la bibliothèque doit rester fournie (${foods.length})`);

  for (const [name, food] of foods) {
    assert.ok(food.label && food.label.length > 0, `${name} : libellé manquant`);
    const svg = food.svg;
    assert.match(svg, /^<svg viewBox="0 0 100 100">/, `${name} : en-tête SVG attendu`);
    assert.match(svg, /<\/svg>$/, `${name} : SVG non refermé`);

    // Les balises doivent être équilibrées : un SVG mal fermé ne lève aucune
    // erreur, il ne dessine simplement rien.
    const ouvertes = (svg.match(/<(?!\/)[a-zA-Z]/g) || []).length;
    const fermees = (svg.match(/<\/[a-zA-Z]/g) || []).length + (svg.match(/\/>/g) || []).length;
    assert.equal(ouvertes, fermees, `${name} : ${ouvertes} balises ouvertes pour ${fermees} fermées`);

    // Chaque dégradé référencé doit exister, et son identifiant doit être
    // préfixé par le nom de l'aliment : deux illustrations affichées côte à
    // côte se voleraient sinon leurs couleurs.
    const definis = new Set([...svg.matchAll(/id="([\w-]+)"/g)].map(m => m[1]));
    for (const id of definis) {
      assert.ok(id.startsWith(name + '-'), `${name} : identifiant « ${id} » non préfixé`);
    }
    for (const [, id] of svg.matchAll(/url\(#([\w-]+)\)/g)) {
      assert.ok(definis.has(id), `${name} : dégradé « ${id} » référencé mais absent`);
    }
  }
});

test('Aucun identifiant de dégradé n’est partagé entre deux illustrations', () => {
  const vus = new Map();
  for (const [name, food] of Object.entries(ILLUSTRATIONS)) {
    for (const [, id] of food.svg.matchAll(/id="([\w-]+)"/g)) {
      assert.equal(vus.has(id), false, `« ${id} » est défini par ${vus.get(id)} et par ${name}`);
      vus.set(id, name);
    }
  }
});

test('Les noms d’aliments utilisés par l’application existent bien', () => {
  const names = Object.keys(ILLUSTRATIONS);
  const sources = ['src/components/FoodMotion.tsx', 'src/screens/TodayScreen.tsx', 'src/components/FeedbackToast.tsx'];
  for (const file of sources) {
    const source = read(file);
    for (const used of source.matchAll(/foods=\{\[([^\]]*)\]\}/g)) {
      for (const quoted of used[1].matchAll(/'([^']+)'/g)) {
        assert.ok(names.includes(quoted[1]), `${file} : l’aliment « ${quoted[1]} » n’existe pas`);
      }
    }
  }
  const motion = read('src/components/FoodMotion.tsx');
  for (const quoted of (motion.match(/DEFAULT_FOODS[^;]+/s) || [''])[0].matchAll(/'([^']+)'/g)) {
    assert.ok(names.includes(quoted[1]), `sélection par défaut : « ${quoted[1]} » n’existe pas`);
  }
});

/* ------------------------------------------------------------ avatar animé */

test('L’avatar est livré d’une seule pièce', () => {
  // V2.3 : le découpage en trois calques ouvrait les coutures du cou et de
  // l'épaule dès qu'une pose s'ajoutait à la respiration. Une seule image
  // entière ne peut pas se découdre — cette assertion empêche d'y revenir
  // sans y avoir réfléchi.
  const image = path.join(__dirname, '..', 'assets', 'jaws-avatar.png');
  assert.ok(fs.existsSync(image), 'assets/jaws-avatar.png manquant');
  assert.ok(fs.statSync(image).size > 10000, 'jaws-avatar.png : fichier suspect');

  const avatar = read('src/components/GuideAvatar.tsx');
  const sources = [...avatar.matchAll(/require\('([^']+)'\)/g)].map(match => match[1]);
  assert.deepEqual(sources, ['../../assets/jaws-avatar.png'], 'l’avatar ne doit charger qu’une seule image');
});

test('L’avatar ne rogne jamais son propre cadre', () => {
  // Il s'incline et saute volontairement hors de sa boîte : un `overflow`
  // masqué le couperait net.
  const avatar = read('src/components/GuideAvatar.tsx');
  assert.equal(avatar.includes("overflow: 'hidden'"), false, 'GuideAvatar ne doit pas masquer son débordement');

  // Même raison pour la barre du bas : le bouton « Ajouter » dépasse de 31
  // pixels vers le haut. La V2.2 le coupait.
  const nav = read('src/components/BottomNav.tsx');
  assert.ok(nav.includes('marginTop: -31'), 'le bouton Ajouter doit toujours dépasser');
  assert.equal(nav.includes("overflow: 'hidden'"), false, 'la barre du bas ne doit pas masquer son débordement');
});

test('L’avatar reste une image fixe', () => {
  // V2.4 : plus aucune animation dans ce composant. Les écrans continuent de
  // passer une pose, mais elle n'a plus d'effet — l'assertion garantit que
  // personne ne recrée une valeur animée ici sans s'en rendre compte.
  const avatar = read('src/components/GuideAvatar.tsx');
  assert.equal(/Animated\./.test(avatar), false, 'GuideAvatar ne doit plus animer quoi que ce soit');
  assert.equal(avatar.includes('useEffect'), false, 'aucune animation à démarrer ni à arrêter');

  // Les quatre poses restent déclarées : les écrans les passent encore.
  for (const pose of ['idle', 'nod', 'wave', 'present']) {
    assert.ok(avatar.includes(`'${pose}'`), `pose absente : ${pose}`);
  }
  const screens = [
    'src/components/GuideCard.tsx', 'src/components/MealCoachPopup.tsx',
    'src/components/ActivityCelebration.tsx', 'src/screens/TodayScreen.tsx',
    'src/screens/OnboardingScreen.tsx', 'src/components/StoryScene.tsx',
  ];
  for (const file of screens) {
    for (const used of read(file).matchAll(/pose="(\w+)"/g)) {
      assert.ok(['idle', 'nod', 'wave', 'present'].includes(used[1]), `${file} : pose inconnue « ${used[1]} »`);
    }
  }
});

/* ------------------------------------------- garde-fou d'animation (V1.8.2) */

test('Un seul pilote d’animation par fichier animé', () => {
  // Le JS pour les fichiers qui écoutent leurs valeurs, le natif pour ceux qui
  // ne font que transformer. Ce qui casse, c'est de mélanger les deux dans une
  // même vue : la règle se vérifie donc fichier par fichier.
  const js = [
    'src/components/StoryScene.tsx', 'src/components/StoryPlayer.tsx',
    'src/screens/OnboardingScreen.tsx', 'src/screens/WelcomeScreen.tsx',
  ];
  // GuideAvatar n'anime plus rien depuis la V2.4 : il ne figure plus ici.
  const natif = ['src/components/FoodMotion.tsx'];
  for (const file of js) {
    assert.equal(read(file).includes('useNativeDriver: true'), false, `${file} doit rester sur le pilote JS`);
  }
  for (const file of natif) {
    assert.equal(read(file).includes('useNativeDriver: false'), false, `${file} doit rester sur le pilote natif`);
    assert.ok(read(file).includes('useNativeDriver: true'), `${file} doit déclarer son pilote`);
  }
});

/* ------------------------------------- l'interrupteur général des animations */

const { shouldReduceMotion, motionStatus, isAppActive } = require('../.test-dist/domain/experience.js');

test('Les animations ne sont réduites que si quelque chose le demande vraiment', () => {
  const calme = { motion: 'system', systemReduced: false, screenReader: false };
  assert.equal(shouldReduceMotion(calme), false, 'par défaut, ça bouge');
  assert.equal(shouldReduceMotion({ ...calme, motion: 'off' }), true, 'choix « jamais »');
  assert.equal(shouldReduceMotion({ ...calme, systemReduced: true }), true, 'préférence du téléphone');
  assert.equal(shouldReduceMotion({ ...calme, screenReader: true }), true, 'lecteur d’écran');
});

test('Un choix explicite l’emporte sur le réglage du téléphone', () => {
  // C'est le blocage de la V2.1 : le téléphone demandait de réduire, et rien
  // dans l'application ne permettait de passer outre ni même de le savoir.
  const bloque = { motion: 'on', systemReduced: true, screenReader: true };
  assert.equal(shouldReduceMotion(bloque), false, '« toujours » doit vouloir dire toujours');
  assert.equal(shouldReduceMotion({ ...bloque, motion: 'system' }), true);
});

test('L’écran Profil explique toujours pourquoi ça bouge, ou pourquoi non', () => {
  const cas = [
    { motion: 'system', systemReduced: false, screenReader: false },
    { motion: 'system', systemReduced: true, screenReader: false },
    { motion: 'system', systemReduced: false, screenReader: true },
    { motion: 'on', systemReduced: true, screenReader: false },
    { motion: 'off', systemReduced: false, screenReader: false },
  ];
  const vues = new Set();
  for (const entree of cas) {
    const phrase = motionStatus(entree);
    assert.ok(phrase.length > 15, `phrase trop courte : ${phrase}`);
    vues.add(phrase);
  }
  assert.equal(vues.size, cas.length, 'chaque situation doit avoir sa propre explication');
  assert.match(motionStatus(cas[1]), /téléphone/, 'le cas bloquant doit nommer le téléphone');
  assert.match(motionStatus(cas[1]), /Toujours/, 'et indiquer la sortie de secours');
});

test('Un état d’application indéterminé compte comme actif', () => {
  // C'est le piège corrigé en V2.1 : l'écouteur ne réagit qu'aux changements,
  // donc une valeur initiale fausse ne serait jamais corrigée et plus aucune
  // animation ne démarrerait.
  assert.equal(isAppActive('active'), true);
  assert.equal(isAppActive('unknown'), true, '« unknown » ne doit pas geler l’application');
  assert.equal(isAppActive(null), true);
  assert.equal(isAppActive(undefined), true);
  assert.equal(isAppActive('background'), false);
  assert.equal(isAppActive('inactive'), false);
});
