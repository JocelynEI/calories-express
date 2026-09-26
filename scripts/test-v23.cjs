const test = require('node:test');
const assert = require('node:assert/strict');

const { sessionPraise, dayPraise, streakPraise, weekSessionCount, sessionStreak, mealStreak } = require('../.test-dist/domain/praise.js');
const { sessionEnergy, resolveWeight, ASSUMED_WEIGHT_KG, DEFAULT_EFFORT, sessionEnergyIssue } = require('../.test-dist/domain/activity-energy.js');

const seance = (day, kind, minutes, id = `${day}-${kind}`) => ({ id, day, kind, minutes, note: '' });
const journal = (sessions) => ({ sessions, stepsByDay: {} });

/* ------------------------------ estimer sans profil (V2.8) */

test('Sans profil, la dépense est estimée avec un poids moyen, et c’est dit', () => {
  // Ce que la saisie rapide enregistre : l'allure habituelle, écrite noir sur
  // blanc dans la séance (8 MET pour le crawl moyen).
  const nage = { ...seance('2026-09-25', 'swim', 30), effort: DEFAULT_EFFORT };
  assert.equal(sessionEnergyIssue(nage), null, 'l’absence de poids ne doit plus bloquer');

  const estimation = sessionEnergy(nage);
  assert.ok(estimation, 'une estimation doit sortir');
  assert.equal(estimation.assumedWeight, true, 'le poids supposé doit être signalé');
  assert.equal(estimation.weightKg, ASSUMED_WEIGHT_KG);
  // (8 - 1) × 70 kg × 0,5 h = 245 kcal actives.
  assert.equal(estimation.activeKcal, 245);
});

test('Une séance sans intensité garde le calcul prudent d’avant', () => {
  // Des séances enregistrées avant que l'intensité existe ne doivent pas se
  // recalculer à la hausse des mois plus tard. Le repli reste « facile ».
  const ancienne = seance('2026-09-25', 'swim', 30);
  assert.equal(sessionEnergy(ancienne, 70).activeKcal, 168);
});

test('Un vrai poids remplace toujours le poids supposé', () => {
  const nage = seance('2026-09-25', 'swim', 30);
  // Séance enregistrée sans profil : 70 kg retenus, marqués comme supposés.
  const enregistree = { ...nage, weightKg: ASSUMED_WEIGHT_KG, weightAssumed: true };
  assert.equal(resolveWeight(enregistree, 92).weightKg, 92, 'le profil doit reprendre la main');
  assert.equal(resolveWeight(enregistree, 92).assumed, false);
  assert.ok(sessionEnergy(enregistree, 92).activeKcal > sessionEnergy(enregistree).activeKcal, 'la séance se recalcule');

  // Un poids choisi à la main pour CETTE séance ne doit pas être écrasé.
  const choisi = { ...nage, weightKg: 58 };
  assert.equal(resolveWeight(choisi, 92).weightKg, 58);
});

test('Un poids hors bornes reste une erreur', () => {
  assert.match(sessionEnergyIssue({ ...seance('2026-09-25', 'swim', 30), weightKg: 12 }) ?? '', /poids/i);
});

/* ------------------------------------------ félicitations d’une séance */

test('La séance est félicitée avec sa durée et ses kcal', () => {
  const praise = sessionPraise({ kind: 'swim', minutes: 30, activeKcal: 245, journal: journal([]), day: '2026-09-25' });
  assert.match(praise.message, /30 minutes/);
  assert.match(praise.message, /245 kcal/);
  assert.equal(praise.detail, undefined, 'pas de mot sur la régularité pour une première séance');
});

test('Le poids supposé est annoncé dans les félicitations', () => {
  const praise = sessionPraise({ kind: 'swim', minutes: 30, activeKcal: 245, assumedWeight: true, journal: journal([]), day: '2026-09-25' });
  assert.match(praise.message, /poids moyen/);
});

test('Une très courte séance est saluée, pas minimisée', () => {
  const praise = sessionPraise({ kind: 'mobility', minutes: 5, activeKcal: 8, journal: journal([]), day: '2026-09-25' });
  assert.match(praise.message, /habitude/);
  assert.doesNotMatch(praise.message, /seulement|trop court|peu/i);
});

test('Deux séances identiques donnent le même message', () => {
  const entree = { kind: 'run', minutes: 40, activeKcal: 350, journal: journal([]), day: '2026-09-25' };
  assert.deepEqual(sessionPraise(entree), sessionPraise(entree));
});

test('La régularité se compte sur les jours et sur la semaine', () => {
  const suite = journal([seance('2026-09-25', 'run', 30), seance('2026-09-24', 'walk', 20), seance('2026-09-23', 'swim', 30)]);
  assert.equal(sessionStreak(suite, '2026-09-25'), 3);
  assert.equal(weekSessionCount(suite, '2026-09-25'), 3);

  // Une coupure arrête la série, mais la semaine continue de compter.
  const coupe = journal([seance('2026-09-25', 'run', 30), seance('2026-09-23', 'swim', 30)]);
  assert.equal(sessionStreak(coupe, '2026-09-25'), 1);
  assert.equal(weekSessionCount(coupe, '2026-09-25'), 2);

  // Trois jours de suite : on rappelle que le repos fait partie du sport.
  const praise = sessionPraise({ kind: 'run', minutes: 30, activeKcal: 300, journal: suite, day: '2026-09-25' });
  assert.match(praise.detail ?? '', /repos/);
});

/* ------------------------------------------- la journée alimentaire */

const jour = (extra = {}) => ({
  meals: [{}, {}, {}], consumed: 2000, target: 2100, protein: 100, proteinTarget: 105,
  hasProfile: true, activeMinutes: 0, day: '2026-09-25', today: '2026-09-25', ...extra,
});

test('Rien ne s’affiche tant que la journée n’est pas remplie', () => {
  assert.equal(dayPraise(jour({ meals: [{}, {}] })), null, 'deux repas : on se tait');
  assert.equal(dayPraise(jour({ meals: [] })), null);
});

test('Une journée dans le repère est félicitée', () => {
  const praise = dayPraise(jour());
  assert.ok(praise);
  assert.match(praise.message, /repère/);
  assert.match(praise.message, /protéines/i);
});

test('Une journée sous le repère n’est jamais félicitée pour cela', () => {
  const praise = dayPraise(jour({ consumed: 900 }));
  assert.ok(praise, 'les trois repas notés méritent quand même un mot');
  assert.doesNotMatch(praise.message, /repère/, 'ne pas laisser croire que manger peu est réussi');
  assert.doesNotMatch(`${praise.title} ${praise.message} ${praise.detail ?? ''}`, /moins|léger|privation|contrôle/i);
});

test('Au-dessus du repère, aucun reproche', () => {
  const praise = dayPraise(jour({ consumed: 2600 }));
  assert.ok(praise);
  assert.doesNotMatch(`${praise.title} ${praise.message} ${praise.detail ?? ''}`, /trop|dépassé|attention|excès/i);
});

test('Le mouvement de la journée est mentionné quand il y en a', () => {
  assert.match(dayPraise(jour({ activeMinutes: 30 })).message, /30 minutes de mouvement/);
  assert.doesNotMatch(dayPraise(jour({ activeMinutes: 5 })).message, /mouvement/);
});

/* ------------------------------------------------------- régularité */

test('Le mot sur la régularité reste rare', () => {
  assert.equal(streakPraise(1), null);
  assert.equal(streakPraise(2), null);
  assert.equal(streakPraise(4), null);
  assert.equal(streakPraise(6), null);
  for (const palier of [3, 7, 14, 30]) assert.ok(streakPraise(palier), `palier manquant : ${palier}`);
  assert.match(streakPraise(3).message, /habitude/);
});

test('La série de repas se compte sur les jours notés', () => {
  const repas = (day) => ({ createdAt: `${day}T12:00:00.000Z` });
  assert.equal(mealStreak([repas('2026-09-25'), repas('2026-09-24')], '2026-09-25'), 2);
  assert.equal(mealStreak([repas('2026-09-24')], '2026-09-25'), 0, 'la série s’arrête si aujourd’hui est vide');
});

/* ------------------------------------------- l’interface (garde-fous) */

const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('La saisie rapide écrit son intensité et signale le poids supposé', () => {
  const quick = read('src/components/QuickActivity.tsx');
  assert.ok(quick.includes('effort: DEFAULT_EFFORT'), 'l’intensité doit être enregistrée, pas déduite plus tard');
  assert.ok(quick.includes('weightAssumed: assumed'), 'la séance doit retenir que le poids est supposé');
  assert.ok(quick.includes('ASSUMED_WEIGHT_KG'), 'le poids moyen doit être annoncé à l’écran');
});

test('La saisie rapide est sur l’accueil, et le formulaire complet reste accessible', () => {
  const home = read('src/screens/TodayScreen.tsx');
  assert.ok(home.includes('<QuickActivity'), 'le bloc rapide doit être sur l’accueil');
  assert.ok(home.includes('onDetails={onActivity}'), 'le formulaire complet doit rester joignable');
  const form = read('src/components/SessionEntryForm.tsx');
  assert.ok(form.includes('Intensité réellement effectuée'), 'les réglages fins ne doivent pas disparaître');
});

test('Les félicitations ne s’affichent que si le domaine en renvoie', () => {
  const home = read('src/screens/TodayScreen.tsx');
  assert.ok(/\{praise \? <PraiseCard/.test(home), 'la carte est conditionnelle');
  assert.ok(home.includes('const praise = regularity ?? dayWell;'), 'une seule carte à la fois');
  const card = read('src/components/PraiseCard.tsx');
  assert.doesNotMatch(card, /rate|échec|manqué|raté/i, 'aucune version négative de la carte');
});
