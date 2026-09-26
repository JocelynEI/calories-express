const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { sessionEnergy, DEFAULT_EFFORT, ASSUMED_WEIGHT_KG } = require('../.test-dist/domain/activity-energy.js');
const { ACTIVITY_LABELS, ACTIVITY_PHRASES } = require('../.test-dist/domain/activity.js');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const quick = read('src/components/QuickActivity.tsx');
const home = read('src/screens/TodayScreen.tsx');

/**
 * V2.9 — « la fonctionnalité qui estime n'est pas assez mise en avant ».
 *
 * Deux choses à tenir, et elles se vérifient toutes les deux ici :
 * la phrase à compléter (on comprend sans mode d'emploi), et sa place sur
 * l'accueil (on la voit sans faire défiler).
 */

/* --------------------------------------------- la phrase à compléter --- */

test('Le bloc pose une question et se lit comme une phrase', () => {
  assert.ok(quick.includes('Combien ai-je dépensé ?'), 'la question doit titrer le bloc');
  assert.ok(quick.includes('J’ai fait '), 'la phrase doit commencer par ce que la personne a fait');
  assert.ok(quick.includes(' pendant '), 'la durée doit s’enchaîner dans la même phrase');
  assert.ok(quick.includes('kilocalories dépensées'), 'le résultat doit être écrit en toutes lettres, pas en sigle');
  // Les deux blancs de la phrase sont des boutons : sans cela, la phrase se
  // lit mais ne se remplit pas.
  assert.match(quick, /setOpen\(open === 'kind' \? null : 'kind'\)/, 'l’activité doit s’ouvrir au toucher');
  assert.match(quick, /setOpen\(open === 'minutes' \? null : 'minutes'\)/, 'la durée doit s’ouvrir au toucher');
});

test('La phrase reste du français, quelle que soit l’activité choisie', () => {
  assert.ok(quick.includes('ACTIVITY_PHRASES[kind]'), 'la phrase doit utiliser les tournures, pas les étiquettes du formulaire');
  for (const kind of Object.keys(ACTIVITY_LABELS)) {
    const phrase = ACTIVITY_PHRASES[kind];
    assert.ok(phrase, `aucune tournure pour ${kind}`);
    assert.match(phrase, /^(du |de la |de l’|une )/, `« J’ai fait ${phrase} » ne se dit pas`);
    assert.equal(phrase, phrase.toLocaleLowerCase('fr-FR'), 'la tournure s’écrit en minuscules dans une phrase');
  }
});

test('Le résultat s’annonce aux lecteurs d’écran quand il change', () => {
  assert.ok(quick.includes('accessibilityLiveRegion="polite"'), 'le chiffre doit être relu quand il bouge');
  assert.match(quick, /accessibilityLabel=\{`Activité : \$\{ACTIVITY_LABELS\[kind\]\}/, 'le mot « activité » doit se présenter');
  assert.match(quick, /accessibilityLabel=\{`Durée : \$\{minutes\} minutes/, 'le mot « durée » doit se présenter');
});

/* ------------------------------------------------ la place sur l’accueil */

test('L’estimation vient juste après le baromètre, avant les repas', () => {
  const journee = home.indexOf('title="Ma journée"');
  const activite = home.indexOf('title="Mon activité"');
  const repas = home.indexOf('title="Mes repas"');
  assert.ok(journee >= 0 && activite >= 0 && repas >= 0, 'les trois blocs doivent exister');
  assert.ok(journee < activite, 'le repère du jour reste en premier');
  assert.ok(activite < repas, 'l’estimation doit passer avant les repas : c’est elle qu’on ne trouvait pas');
  assert.ok(home.indexOf('<QuickActivity') < repas, 'la saisie rapide suit son bloc');
});

/* ------------------------------------- aucun choix ne peut afficher zéro */

const list = (source, name) => {
  const match = source.match(new RegExp(`${name}[^=]*=\\s*\\[([^\\]]*)\\]`));
  assert.ok(match, `${name} introuvable dans QuickActivity`);
  return match[1].split(',').map(item => item.trim().replace(/^'|'$/g, '')).filter(Boolean);
};

const KINDS = list(quick, 'QUICK_KINDS');
const DURATIONS = list(quick, 'DURATIONS').map(Number);

test('Chaque activité proposée sait se chiffrer, sans profil', () => {
  assert.ok(KINDS.length >= 6, 'la liste doit couvrir les activités courantes');
  for (const kind of KINDS) {
    assert.ok(ACTIVITY_LABELS[kind], `pas de nom lisible pour ${kind}`);
    const estimation = sessionEnergy({ id: 'x', day: '2026-09-26', kind, minutes: 30, note: '', effort: DEFAULT_EFFORT });
    assert.ok(estimation, `aucune estimation pour ${kind}`);
    assert.ok(estimation.activeKcal > 0, `${kind} afficherait 0 kcal`);
    assert.equal(estimation.assumedWeight, true, `${kind} doit signaler le poids moyen`);
    assert.equal(estimation.weightKg, ASSUMED_WEIGHT_KG);
  }
});

test('Chaque durée proposée donne un chiffre qui monte avec le temps', () => {
  assert.ok(DURATIONS.includes(30), '30 min, le cas d’école, doit rester proposé');
  let precedent = 0;
  for (const minutes of DURATIONS.slice().sort((a, b) => a - b)) {
    const estimation = sessionEnergy({ id: 'x', day: '2026-09-26', kind: 'swim', minutes, note: '', effort: DEFAULT_EFFORT });
    assert.ok(estimation && estimation.activeKcal > precedent, `${minutes} min ne dépasse pas la durée précédente`);
    precedent = estimation.activeKcal;
  }
});

test('Le cas que Jocelyn décrit : 30 min de natation, sans rien avoir réglé', () => {
  const estimation = sessionEnergy({ id: 'x', day: '2026-09-26', kind: 'swim', minutes: 30, note: '', effort: DEFAULT_EFFORT });
  assert.equal(estimation.activeKcal, 245);
  assert.equal(ACTIVITY_LABELS.swim, 'Natation');
});
