const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  TELEMETRY_EVENTS, ALLOWED_KEYS, isTelemetryEvent, validMessage, buildMessage,
  newId, screenSize, shouldSend, shouldAskConsent,
} = require('../.test-dist/domain/telemetry.js');
const { readExperienceSettings, DEFAULT_EXPERIENCE } = require('../.test-dist/domain/experience.js');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

/**
 * V3.1 — le journal de test.
 *
 * Ce fichier a un seul but : rendre impossible ce qui ne doit pas arriver.
 * Un journal d'usage qui laisserait fuir un aliment ou un poids serait pire
 * que pas de journal du tout, donc chaque garde-fou est vérifié ici, y
 * compris en essayant de le contourner.
 */

const base = { event: 'repas-ajoute', visiteur: '3f9dp2a1ck', visite: '0q7b4x2zem', version: '3.1.0', width: 390 };

/* ------------------------------------------------- ce qui peut sortir ---- */

test('Un message normal contient six champs, et rien d’autre', () => {
  const message = buildMessage({ ...base, now: new Date('2026-09-26T18:04:11.201Z') });
  assert.deepEqual(Object.keys(message).sort(), [...ALLOWED_KEYS].sort());
  assert.equal(message.at, '2026-09-26T18:04:11.201Z');
  assert.equal(message.evenement, 'repas-ajoute');
  assert.equal(message.ecran, 'telephone');
});

test('La largeur d’écran est rangée, jamais envoyée au pixel près', () => {
  assert.equal(screenSize(390), 'telephone');
  assert.equal(screenSize(834), 'tablette');
  assert.equal(screenSize(1512), 'ordinateur');
  assert.equal(screenSize(Number.NaN), 'telephone', 'une largeur illisible ne doit pas faire échouer l’envoi');
  const message = buildMessage({ ...base, width: 1512.375 });
  assert.equal(message.ecran, 'ordinateur');
  assert.ok(!JSON.stringify(message).includes('1512'), 'la largeur exacte ne doit apparaître nulle part');
});

/* --------------------------------------- ce qui ne peut PAS sortir ------- */

test('Aucun aliment, aucun poids, aucune calorie ne peut passer', () => {
  // On essaie, de toutes les façons plausibles : un événement bricolé, un
  // champ ajouté, une valeur remplacée. Chaque tentative doit donner `null`.
  const tentatives = [
    { ...base, event: 'repas-ajoute: 250 g de pâtes' },
    { ...base, event: 'poids-82' },
    { ...base, event: '' },
    { ...base, visiteur: 'jocelyn' },
    { ...base, visiteur: 'marie12345' },
    { ...base, visite: 'pauldupont' },
    { ...base, visiteur: 'jaws.lebon@gmail.com' },
    { ...base, version: 'poulet rôti' },
  ];
  for (const tentative of tentatives) {
    assert.equal(buildMessage(tentative), null, `a laissé passer : ${JSON.stringify(tentative)}`);
  }

  // Et un message complet auquel on ajoute un champ interdit après coup.
  const message = buildMessage(base);
  assert.ok(validMessage(message));
  assert.equal(validMessage({ ...message, poids: 82 }), false, 'un champ en trop doit faire rejeter le message');
  assert.equal(validMessage({ ...message, aliment: 'pâtes' }), false);
  assert.equal(validMessage({ ...message, at: 'hier' }), false);
  assert.equal(validMessage({ ...message, ecran: '390x844' }), false);
  const { ecran, ...incomplet } = message;
  assert.equal(validMessage(incomplet), false, 'un champ manquant aussi');
});

test('La liste des actions est fermée', () => {
  assert.ok(TELEMETRY_EVENTS.length >= 18, 'les quatre familles doivent être couvertes');
  for (const event of TELEMETRY_EVENTS) {
    assert.match(event, /^[a-z-]+$/, `${event} doit rester un mot-clé, sans contenu`);
    assert.ok(isTelemetryEvent(event));
  }
  assert.equal(isTelemetryEvent('repas-supprime'), false, 'une action non prévue est refusée');
  assert.equal(isTelemetryEvent(42), false);
  // Les deux comparaisons qui font l'intérêt du journal.
  for (const paire of [['ouvre-ajout-repas', 'repas-ajoute'], ['profil-commence', 'profil-termine'],
    ['ouvre-activite', 'activite-abandonnee'], ['seance-estimee', 'seance-enregistree']]) {
    for (const event of paire) assert.ok(isTelemetryEvent(event), `${event} manque pour comparer`);
  }
});

/* ------------------------------------------------- rien sans accord ----- */

test('Rien ne part sans accord, hors du web, ou sans adresse', () => {
  const url = 'https://script.google.com/macros/s/AKfycb/exec';
  assert.equal(shouldSend({ consent: 'yes', platform: 'web', url }), true);
  assert.equal(shouldSend({ consent: 'unknown', platform: 'web', url }), false, 'tant qu’on n’a pas demandé, non');
  assert.equal(shouldSend({ consent: 'no', platform: 'web', url }), false, 'un refus est un refus');
  assert.equal(shouldSend({ consent: 'yes', platform: 'ios', url }), false, 'le journal est réservé au site');
  assert.equal(shouldSend({ consent: 'yes', platform: 'android', url }), false);
  assert.equal(shouldSend({ consent: 'yes', platform: 'web', url: '' }), false, 'sans adresse, pas de journal');
  assert.equal(shouldSend({ consent: 'yes', platform: 'web', url: 'http://exemple.fr' }), false, 'jamais en clair');
});

test('La question ne se pose que là où elle a un sens', () => {
  const url = 'https://script.google.com/macros/s/AKfycb/exec';
  assert.equal(shouldAskConsent({ consent: 'unknown', platform: 'web', url }), true);
  assert.equal(shouldAskConsent({ consent: 'yes', platform: 'web', url }), false, 'on ne redemande pas');
  assert.equal(shouldAskConsent({ consent: 'no', platform: 'web', url }), false, 'surtout pas après un refus');
  assert.equal(shouldAskConsent({ consent: 'unknown', platform: 'ios', url }), false);
  assert.equal(shouldAskConsent({ consent: 'unknown', platform: 'web', url: '' }), false, 'sans journal, aucune question');
});

test('Livré tel quel, le journal est éteint', () => {
  const config = read('src/config/test-journal.ts');
  assert.match(config, /export const TEST_JOURNAL_URL = '';/, 'l’adresse doit partir vide du dépôt');
});

/* ---------------------------------------------- le réglage se souvient -- */

test('Le choix est gardé, et une ancienne sauvegarde repose la question', () => {
  assert.equal(DEFAULT_EXPERIENCE.testJournal, 'unknown');
  assert.equal(readExperienceSettings({ testJournal: 'yes' }).testJournal, 'yes');
  assert.equal(readExperienceSettings({ testJournal: 'no' }).testJournal, 'no');
  assert.equal(readExperienceSettings({}).testJournal, 'unknown', 'une sauvegarde d’avant la V3.1');
  assert.equal(readExperienceSettings({ testJournal: 'peut-être' }).testJournal, 'unknown', 'une valeur abîmée');
  // Les réglages d'avant ne doivent pas être perdus au passage.
  assert.equal(readExperienceSettings({ motion: 'off', welcome: false }).motion, 'off');
  assert.equal(readExperienceSettings({ motion: 'off', welcome: false }).welcome, false);
});

test('Les numéros tirés au sort ont la forme attendue', () => {
  for (let i = 0; i < 200; i += 1) {
    const id = newId();
    assert.match(id, /^[0-9][a-z0-9]{9}$/, `numéro invalide : ${id}`);
  }
  assert.notEqual(newId(), newId(), 'deux tirages ne doivent pas se ressembler');
  // Un tirage dégénéré ne doit pas produire un identifiant vide.
  assert.match(newId(() => 0), /^[0-9][a-z0-9]{9}$/);
  assert.match(newId(() => 0.9999999), /^[0-9][a-z0-9]{9}$/);
});

/* ------------------------------------------------- l’interface --------- */

test('La question dit ce qui est noté et ce qui ne l’est jamais', () => {
  const card = read('src/components/TestJournalConsent.tsx');
  assert.ok(card.includes('Ce qui est noté'));
  assert.ok(card.includes('Ce qui ne sort jamais d’ici'));
  for (const mot of ['poids', 'aliments', 'calories']) {
    assert.ok(card.toLowerCase().includes(mot), `la liste des exclusions doit nommer : ${mot}`);
  }
  assert.ok(card.includes('Non merci'), 'le refus doit être un vrai bouton');
  assert.ok(card.includes('marche exactement pareil si tu refuses'), 'refuser ne doit rien coûter');
});

test('L’interrupteur du Profil permet de revenir sur son choix', () => {
  const profil = read('src/screens/ProfileScreen.tsx');
  assert.ok(profil.includes('Aider au test'));
  assert.match(profil, /setSetting\('testJournal', value \? 'yes' : 'no'\)/);
});

test('Les repères sont posés aux endroits qui apprennent quelque chose', () => {
  const app = read('App.tsx');
  assert.match(app, /track\('ouvre-ajout-repas'\)/, 'l’ouverture du formulaire');
  assert.match(app, /track\('ajout-repas-abandonne'\)/, 'et son abandon : c’est la paire qui compte');
  assert.match(app, /track\(wasEditing \? 'repas-modifie' : 'repas-ajoute'\)/);
  assert.match(app, /track\(SCREEN_EVENTS\[tab\]\)/, 'les écrans ouverts');
  const onboarding = read('src/screens/OnboardingScreen.tsx');
  assert.match(onboarding, /track\('profil-commence'\)/);
  assert.match(onboarding, /track\('profil-termine'\)/);
  assert.match(onboarding, /track\('profil-passe'\)/);
  const quick = read('src/components/QuickActivity.tsx');
  assert.match(quick, /track\('seance-enregistree'\)/);
});

test('Le script Google refuse ce que l’application refuse déjà', () => {
  const gs = read('docs/journal-de-test.gs');
  for (const event of TELEMETRY_EVENTS) {
    assert.ok(gs.includes(`'${event}'`), `le script Google ignore l’action ${event}`);
  }
  assert.match(gs, /EVENEMENTS\.indexOf\(recu\.evenement\) === -1/, 'le script doit filtrer les actions');
  assert.match(gs, /valeur\.length <= 40/, 'une valeur trop longue ne doit pas être recopiée');
  for (const colonne of ALLOWED_KEYS) {
    assert.ok(gs.includes(`'${colonne}'`), `colonne manquante côté Google : ${colonne}`);
  }
});
