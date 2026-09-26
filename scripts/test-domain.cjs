const assert = require('node:assert/strict');
const {
  calculateBmr,
  calculateDailyTarget,
  estimatePhrase,
  gaugeMessage,
  suggestFoods,
  totalRecognized,
} = require('../.test-dist/domain/calories.js');

const breakfast = estimatePhrase('bol de lait chocolaté + madeleine aux pépites');
assert.equal(breakfast.length, 2, 'le petit-déjeuner doit reconnaître deux aliments');
assert.equal(totalRecognized(breakfast).calories.estimated, 370, 'le test historique doit produire 370 kcal');

const quantities = estimatePhrase('2 bananes et un yaourt');
assert.equal(quantities.length, 2, 'la phrase avec quantité doit reconnaître deux aliments');
assert.equal(quantities.find((item) => item.foodId === 'P009').quantity, 2, 'la quantité numérique doit être conservée');
assert.equal(totalRecognized(quantities).calories.estimated, 320, 'deux bananes et un yaourt doivent produire 320 kcal');

assert.equal(suggestFoods('ban')[0].id, 'P009', 'ban doit suggérer Banane en premier');
assert.equal(suggestFoods('pain au cho')[0].id, 'P014', 'une saisie partielle doit suggérer Pain au chocolat');

const naturalSentence = estimatePhrase('poulet avec du riz');
assert.equal(naturalSentence.length, 2, 'les connecteurs naturels doivent séparer deux aliments');
assert.ok(naturalSentence.some((item) => item.foodId === 'P028'), 'le poulet doit être reconnu');
assert.ok(naturalSentence.some((item) => item.foodId === 'P027'), 'le riz doit être reconnu');

const profile = {
  firstName: '', sexForFormula: 'male', age: 28, heightCm: 175, weightKg: 82,
  activityLevel: 'moderate', goal: 'lose', targetMode: 'automatic', manualTarget: 2200,
};
assert.equal(calculateBmr(profile), 1779, 'le calcul Mifflin-St Jeor doit être stable');
assert.equal(calculateDailyTarget(profile), 2457, 'l’objectif automatique doit intégrer activité et objectif');
assert.equal(calculateDailyTarget({ ...profile, targetMode: 'manual', manualTarget: 2100 }), 2100, 'l’objectif manuel doit être prioritaire');

assert.equal(gaugeMessage(0, 2000).tone, 'navy');
assert.equal(gaugeMessage(1900, 2000).tone, 'sage');
assert.equal(gaugeMessage(2300, 2000).tone, 'gold');

const { greeting, readExperienceSettings } = require('../.test-dist/domain/experience.js');
assert.equal(greeting('Jocelyn', 9), 'Bonjour Jocelyn');
assert.equal(greeting('Jocelyn', 19), 'Bonsoir Jocelyn');
assert.equal(greeting('  ', 10), 'Bonjour');
assert.equal(greeting('  Jo  ', 3), 'Bonsoir Jo');
assert.deepEqual(readExperienceSettings(null), { motion: 'system', welcome: true, activityPrompts: true, onboardingDone: false, testJournal: 'unknown' });
assert.deepEqual(readExperienceSettings({ animations: false, welcome: false }), { motion: 'off', welcome: false, activityPrompts: true, onboardingDone: false, testJournal: 'unknown' });
assert.deepEqual(readExperienceSettings({ animations: 'false' }), { motion: 'system', welcome: true, activityPrompts: true, onboardingDone: false, testJournal: 'unknown' });
const { energyPlan, compareIntake, profileIssue, goalMismatch } = require('../.test-dist/domain/energy.js');
const plan = energyPlan(profile);
assert.equal(plan.maintenance, 2757, 'le maintien inclut déjà l’activité habituelle');
assert.equal(plan.maintenance - plan.target, 300, 'le déficit est appliqué une seule fois');
assert.equal(plan.direction, 'deficit');
const manual = { ...profile, targetMode: 'manual', manualTarget: 2100 };
assert.equal(energyPlan(manual).target, 2100, 'une valeur manuelle reste finale, pas de second -300');
assert.equal(energyPlan(manual).plannedDifference, 657, 'le déficit manuel découle du maintien et du repère réellement utilisé');
assert.equal(energyPlan({ ...profile, goal: 'gain' }).plannedDifference, -250);
assert.equal(energyPlan({ ...profile, goal: 'maintain' }).plannedDifference, 0);
assert.deepEqual(compareIntake(2200, 2100, 2400), { toTarget: -100, toMaintenance: 200 }, 'au-dessus du repère mais sous le maintien');
assert.deepEqual(compareIntake(2500, 2100, 2400), { toTarget: -400, toMaintenance: -100 }, 'au-dessus des deux repères');
assert.deepEqual(compareIntake(2100, 2100, 2400), { toTarget: 0, toMaintenance: 300 });
assert.ok(!('actualDeficit' in compareIntake(400, 2100, 2400)), 'un journal partiel ne mesure pas un déficit réel');
assert.equal(profileIssue(profile), null);
assert.ok(profileIssue({ ...profile, age: 16 }));
assert.ok(profileIssue({ ...profile, weightKg: Infinity }));
assert.ok(profileIssue({ ...manual, manualTarget: 800 }), 'les anciens objectifs très bas ne sont pas acceptés');
assert.ok(profileIssue({ ...manual, manualTarget: NaN }));
assert.equal(goalMismatch(manual), null);
assert.ok(goalMismatch({ ...manual, manualTarget: 3000 }), 'un objectif manuel en surplus ne doit pas être décrit comme un déficit');
assert.equal(gaugeMessage(2200, 2100).label, 'Au-dessus du repère', 'aucune qualification d’excédent énergétique à partir de la seule cible');
console.log('42 assertions réussies : repas, suggestions, objectifs, bilan pédagogique, profil et préférences.');
