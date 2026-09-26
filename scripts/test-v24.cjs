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
 * V2.9 puis V3.0 — l'estimation, mise en avant sans rien inventer.
 *
 * Trois choses à tenir, vérifiées ici : la phrase à compléter (on comprend
 * sans mode d'emploi), sa place sur l'accueil (on la voit sans faire
 * défiler), et le fait que **rien n'est prérempli** (on n'enregistre jamais
 * une séance qu'on n'a pas faite).
 */

/* ------------------------------------------------- rien n'est prérempli -- */

test('Au repos, le bloc ne montre qu’un bouton, comme pour un repas', () => {
  assert.ok(quick.includes('Ajouter une activité'), 'le bouton doit porter le même verbe que « Ajouter un repas »');
  assert.match(quick, /if \(!editing\)/, 'la phrase ne doit apparaître qu’après le bouton');
});

test('Les deux blancs partent vides, et le restent d’une séance à l’autre', () => {
  assert.match(quick, /useState<ActivityKind \| null>\(null\)/, 'aucune activité ne doit être choisie d’avance');
  assert.match(quick, /useState<number \| null>\(null\)/, 'aucune durée ne doit être choisie d’avance');
  assert.ok(quick.includes('quelle activité ?'), 'le blanc de l’activité doit se nommer');
  assert.ok(quick.includes('combien de temps ?'), 'le blanc de la durée doit se nommer');
  // `reset()` est appelé après l'enregistrement : la séance suivante repart
  // de zéro, rien n'est mémorisé.
  assert.match(quick, /const reset = \(\) => \{[\s\S]*?setKind\(null\);[\s\S]*?setMinutes\(null\);/, 'tout doit se vider');
  assert.match(quick, /recordActivity\(record\);[\s\S]*?reset\(\);/, 'la séance enregistrée doit vider la phrase');
});

test('Aucun chiffre ne s’affiche tant qu’un blanc est vide', () => {
  // Le brouillon n'existe que si les deux réponses sont là : pas d'estimation
  // sur une phrase à moitié écrite, donc pas de 0 kcal trompeur.
  assert.match(quick, /const draft: ActivitySession \| null = kind !== null && minutes !== null/, 'le brouillon exige les deux réponses');
  assert.match(quick, /const estimate = draft \? sessionEnergy/, 'l’estimation suit le brouillon');
  assert.match(quick, /\{estimate \? \([\s\S]*?styles\.result/, 'le chiffre est conditionné à l’estimation');
  assert.match(quick, /\{estimate \? \([\s\S]*?Enregistrer cette séance/, 'on ne peut pas enregistrer une phrase incomplète');
});

test('Côté repas non plus, aucune quantité n’est préremplie', () => {
  const foods = read('src/components/FoodEntryForms.tsx');
  assert.match(foods, /const \[quantity, setQuantity\] = useState\(''\)/, 'la quantité consommée doit partir vide');
  assert.doesNotMatch(foods, /setQuantity\(u === 'portion' \? '1' : '100'\)/, 'changer d’unité ne doit pas réécrire un chiffre');
  // Le formulaire refuse déjà de partir sans quantité : c'est ce qui rend le
  // champ vide sans danger.
  assert.ok(foods.includes('Renseigne le nom, les kilocalories et la quantité consommée.'), 'le champ vide doit être refusé à l’ajout');
  assert.ok(foods.includes('Ex. : 250'), 'un exemple doit rester visible en gris, sans être une valeur saisie');
});

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
  // Et l'un enchaîne sur l'autre : on ne laisse personne devant une phrase à
  // moitié remplie sans savoir quoi toucher.
  assert.match(quick, /setOpen\('kind'\)/, 'le premier blanc s’ouvre dès le bouton');
  assert.match(quick, /setOpen\(minutes === null \? 'minutes' : null\)/, 'choisir l’activité enchaîne sur la durée');
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
  assert.ok(quick.includes('Choisir l’activité'), 'un blanc vide doit s’annoncer comme un choix à faire');
  assert.ok(quick.includes('Choisir la durée'), 'idem pour la durée');
  assert.match(quick, /`Activité : \$\{ACTIVITY_LABELS\[kind\]\}/, 'une fois rempli, le mot « activité » doit se présenter');
  assert.match(quick, /`Durée : \$\{minutes\} minutes/, 'une fois remplie, le mot « durée » doit se présenter');
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
