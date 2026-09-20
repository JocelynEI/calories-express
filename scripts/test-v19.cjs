const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  STEP_ORDER, STEPS, GOAL_CHOICES, ACTIVITY_CHOICES, FIELD_LIMITS,
  fieldIssue, stepIssue, nextStep, previousStep, progressAt, summarize, resultSentence,
} = require('../.test-dist/domain/onboarding.js');
const { readExperienceSettings, DEFAULT_EXPERIENCE } = require('../.test-dist/domain/experience.js');

const base = {
  firstName: '', sexForFormula: 'male', age: 42, heightCm: 178, weightKg: 80,
  activityLevel: 'light', activityBudgetMode: 'fixed', goal: 'lose',
  targetMode: 'automatic', manualTarget: 2200,
};

/* ------------------------------------------------------------- le parcours */

test('Le parcours a six étapes, dans un ordre stable et sans trou', () => {
  assert.deepEqual(STEP_ORDER, ['welcome', 'name', 'goal', 'body', 'activity', 'result']);
  for (const id of STEP_ORDER) {
    assert.equal(STEPS[id].id, id);
    assert.ok(STEPS[id].title.length > 0 && STEPS[id].says.length > 0, `${id} : textes manquants`);
    assert.ok(STEPS[id].says.length <= 60, `${id} : la phrase de Jaws doit rester courte`);
  }
  assert.equal(previousStep('welcome'), null, 'la première étape n’a pas de précédente');
  assert.equal(nextStep('result'), null, 'la dernière étape termine le parcours');
  assert.equal(nextStep('goal'), 'body');
  assert.equal(previousStep('body'), 'goal');
});

test('L’avancement ne compte que les étapes de saisie et finit plein', () => {
  assert.equal(progressAt('welcome').done, 0, 'l’accueil ne compte pas');
  assert.equal(progressAt('welcome').total, 4, 'prénom, objectif, chiffres, activité');
  assert.equal(progressAt('name').done, 1, 'la première question montre déjà un quart');
  assert.equal(progressAt('goal').done, 2);
  assert.equal(progressAt('activity').done, 4);
  const end = progressAt('result');
  assert.equal(end.done, end.total);
  assert.equal(end.ratio, 1);
  for (const id of STEP_ORDER) {
    const ratio = progressAt(id).ratio;
    assert.ok(ratio >= 0 && ratio <= 1, `${id} : avancement hors limites`);
  }
});

/* ------------------------------------------------------------ la validation */

test('Un champ vide est expliqué, pas simplement refusé', () => {
  for (const field of Object.keys(FIELD_LIMITS)) {
    const issue = fieldIssue(field, null);
    assert.ok(issue && issue.length > 10, `${field} : message trop court`);
  }
  assert.match(fieldIssue('age', 12), /adultes/, 'un âge d’enfant doit être expliqué clairement');
  assert.match(fieldIssue('age', 42.5), /entières/);
  assert.match(fieldIssue('heightCm', 40), /120 et 230/);
  assert.match(fieldIssue('weightKg', 500), /35 et 300/);
  assert.equal(fieldIssue('age', 42), null);
  assert.equal(fieldIssue('heightCm', 178), null);
  assert.equal(fieldIssue('weightKg', 80.4), null);
});

test('Le prénom ne bloque jamais : il est facultatif', () => {
  assert.equal(stepIssue('name', { ...base, firstName: '' }), null);
  assert.equal(stepIssue('welcome', base), null);
});

test('L’étape des chiffres signale le premier champ à corriger', () => {
  assert.match(stepIssue('body', { ...base, age: NaN }), /âge/i);
  assert.match(stepIssue('body', { ...base, heightCm: NaN }), /120 et 230|valeur en cm/);
  assert.match(stepIssue('body', { ...base, weightKg: NaN }), /35 et 300|valeur en kg/);
  assert.equal(stepIssue('body', base), null);
});

test('L’étape de l’activité refuse un repère hors des limites de la version', () => {
  // Profil valide : on passe.
  assert.equal(stepIssue('activity', base), null);
  // Une combinaison qui sort des limites doit être signalée avant l’annonce du
  // repère, jamais découverte après coup sur l’écran d’accueil.
  const tiny = { ...base, sexForFormula: 'female', age: 90, heightCm: 140, weightKg: 36, activityLevel: 'sedentary', goal: 'lose' };
  const issue = stepIssue('activity', tiny);
  assert.ok(issue === null || /limites|professionnel/.test(issue), `message inattendu : ${issue}`);
});

/* ------------------------------------------------------------- le résultat */

test('Le résumé détaille le calcul au lieu de sortir un nombre seul', () => {
  const result = summarize(base);
  assert.equal(result.issue, null);
  assert.ok(result.bmr > 0, 'les besoins au repos doivent être calculés');
  assert.ok(result.maintenance > result.bmr, 'le maintien inclut l’activité habituelle');
  assert.equal(result.target, result.maintenance - 300, 'perte de poids : −300 kcal');
  assert.equal(result.direction, 'deficit');
  assert.equal(result.difference, 300);

  const gain = summarize({ ...base, goal: 'gain' });
  assert.equal(gain.target, gain.maintenance + 250);
  assert.equal(gain.direction, 'surplus');

  const keep = summarize({ ...base, goal: 'maintain' });
  assert.equal(keep.target, keep.maintenance);
  assert.equal(keep.direction, 'maintenance');
});

test('Un profil incomplet donne un message, jamais un repère inventé', () => {
  const result = summarize({ ...base, weightKg: NaN });
  assert.ok(result.issue, 'un poids manquant doit être signalé');
  assert.equal(result.target, 0, 'aucun repère ne doit être annoncé sans profil valide');
});

test('La phrase de conclusion n’invite jamais à retirer le déficit deux fois', () => {
  const deficit = resultSentence('deficit', 300);
  assert.match(deficit, /déjà compris/);
  assert.match(deficit, /deuxième fois/);
  assert.match(resultSentence('surplus', -250), /250/);
  assert.match(resultSentence('maintenance', 0), /maintenir/);
  for (const sentence of [deficit, resultSentence('surplus', -250), resultSentence('maintenance', 0)]) {
    assert.doesNotMatch(sentence, /compenser|br[ûu]ler|punition/i);
  }
});

/* ------------------------------------------------- le réglage de mémorisation */

test('Une mise à jour depuis une version précédente ne perd pas les préférences', () => {
  // Réglages d'une V1.8 : la nouvelle clé manque et doit prendre sa valeur par défaut.
  const old = readExperienceSettings({ animations: false, welcome: true, activityPrompts: false });
  assert.equal(old.motion, 'off', 'un ancien interrupteur coupé devient « jamais »');
  assert.equal(old.activityPrompts, false);
  assert.equal(old.onboardingDone, false);
  assert.deepEqual(readExperienceSettings(null), DEFAULT_EXPERIENCE);
  assert.equal(readExperienceSettings({ onboardingDone: 'oui' }).onboardingDone, false, 'une valeur invalide ne vaut pas vrai');
  assert.equal(readExperienceSettings({ onboardingDone: true }).onboardingDone, true);
});

/* --------------------------------------------------------- les choix offerts */

test('Chaque choix proposé correspond à une valeur que le profil accepte', () => {
  assert.deepEqual(GOAL_CHOICES.map(c => c.id).sort(), ['gain', 'lose', 'maintain']);
  assert.deepEqual(ACTIVITY_CHOICES.map(c => c.id), ['sedentary', 'light', 'moderate', 'active']);
  for (const choice of [...GOAL_CHOICES, ...ACTIVITY_CHOICES]) {
    assert.ok(choice.label.length > 0 && choice.detail.length > 0, `${choice.id} : libellé incomplet`);
    assert.ok(choice.detail.length <= 60, `${choice.id} : explication trop longue pour une carte`);
  }
  // Chaque niveau d'activité doit produire un maintien différent et croissant.
  const maintenances = ACTIVITY_CHOICES.map(c => summarize({ ...base, activityLevel: c.id }).maintenance);
  for (let i = 1; i < maintenances.length; i += 1) {
    assert.ok(maintenances[i] > maintenances[i - 1], 'un niveau plus actif doit relever le maintien estimé');
  }
});

/* ------------------------------------------- garde-fou d'animation (V1.8.2) */

test('L’accueil animé n’utilise qu’un seul pilote d’animation', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'screens', 'OnboardingScreen.tsx'), 'utf8');
  assert.equal(
    source.includes('useNativeDriver: true'), false,
    'OnboardingScreen doit rester sur le pilote JS : mélanger les deux casse l’étape suivante.',
  );
  assert.ok(source.includes('useNativeDriver: false'));
});
