const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ACTIVITY_EFFORTS, sessionEnergy, sessionEnergyIssue, dailyEnergyPlan, normallyIncludedInSteps } = require('../.test-dist/domain/activity-energy.js');
const { ACTIVITY_LABELS, saveSession, setDaySteps, setDayEnergy, readActivity, activityIssue } = require('../.test-dist/domain/activity.js');
const day = '2026-09-18', tomorrow = '2026-09-19';
const profile = { firstName: '', sexForFormula: 'male', age: 40, heightCm: 180, weightKg: 80, activityLevel: 'light', activityBudgetMode: 'daily', goal: 'lose', targetMode: 'automatic', manualTarget: 2200 };
const empty = () => ({ sessions: [], stepsByDay: {} });
const session = (extra = {}) => ({ id: 's1', day, kind: 'cycle', minutes: 30, note: '', effort: 'moderate', weightKg: 80, includeInGoal: true, energySource: 'estimated', ...extra });
const manual = (extra = {}) => session({ kind: 'other', energySource: 'reported', reportedActiveKcal: 280, deviceName: 'Apple Watch', weightKg: undefined, ...extra });
const report = (extra = {}) => ({ activeKcal: 620, baselineActiveKcal: 50, deviceName: 'Apple Watch', ...extra });

test('Toutes les activités proposées sauf Autre ont une estimation pour les trois intensités', () => {
  for (const kind of Object.keys(ACTIVITY_LABELS).filter(k => k !== 'other')) for (const effort of ['easy', 'moderate', 'brisk']) {
    const e = sessionEnergy(session({ kind, effort })); assert.ok(e && e.activeKcal > 0); assert.equal(e.source, 'estimated'); assert.ok(ACTIVITY_EFFORTS[kind][effort].code);
  }
  assert.ok(normallyIncludedInSteps('run')); assert.ok(normallyIncludedInSteps('walk')); assert.equal(normallyIncludedInSteps('swim'), false);
});
test('Séance automatique : manque de durée, poids ou type donne une action précise, pas un zéro', () => {
  assert.match(sessionEnergyIssue(session({ weightKg: undefined })), /poids/);
  assert.match(sessionEnergyIssue(session({ minutes: NaN })), /durée/);
  assert.match(sessionEnergyIssue(session({ kind: 'other' })), /Saisir mes kcal/);
  assert.equal(sessionEnergyIssue(session({ kind: 'walk' })), null);
  assert.equal(sessionEnergy(session({ kind: 'walk' })).activeKcal, 112);
});
test('Saisie montre : remplace le calcul, fonctionne sans poids et sur Autre activité', () => {
  const e = sessionEnergy(manual()); assert.equal(e.activeKcal, 280); assert.equal(e.source, 'reported'); assert.equal(e.grossKcal, null); assert.equal(e.label, 'Apple Watch');
  assert.equal(sessionEnergy(manual({ kind: 'swim', weightKg: 130, effort: 'brisk' })).activeKcal, 280);
  assert.equal(activityIssue(manual(), empty()), null);
  assert.equal(dailyEnergyPlan(profile, saveSession(empty(), manual()), day, false).activity.activeKcal, 280);
  assert.equal(dailyEnergyPlan(profile, saveSession(empty(), manual()), day, false).creditedKcal, 0);
});
test('Saisie montre : kcal zéro explicites acceptées ; valeurs absentes, négatives et excessives rejetées', () => {
  assert.equal(sessionEnergy(manual({ reportedActiveKcal: 0 })).activeKcal, 0);
  for (const value of [undefined, null, NaN, Infinity, -1, 10001, '280']) { assert.equal(sessionEnergy(manual({ reportedActiveKcal: value })), null); assert.ok(activityIssue(manual({ reportedActiveKcal: value }), empty())); }
});
test('Kcal de séance et pas distincts s’ajoutent, suivi source visible et déficit conservé', () => {
  let j = setDaySteps(empty(), day, 6000, { weightKg: 75, baselineSteps: 2000 }); //150/100
  j = saveSession(j, manual({ kind: 'swim', reportedActiveKcal: 280 }));
  j = saveSession(j, session({ id: 's2', kind: 'cycle', minutes: 20, weightKg: 75 })); //150
  const p = dailyEnergyPlan(profile, j, day);
  assert.equal(p.activity.estimatedSessionKcal, 150); assert.equal(p.activity.reportedSessionKcal, 280); assert.equal(p.activity.sessionKcal, 430);
  assert.equal(p.activity.activeKcal, 580); assert.equal(p.creditedKcal, 530); assert.equal(p.maintenance - p.target, 300);
});
test('Marche de la montre comprise dans les pas : dédoublonnage puis correction et suppression', () => {
  let j = setDaySteps(empty(), day, 6000, { weightKg: 75, baselineSteps: 2000 });
  j = saveSession(j, manual({ kind: 'walk', reportedActiveKcal: 200 }));
  assert.equal(dailyEnergyPlan(profile, j, day).activity.activeKcal, 200); assert.equal(dailyEnergyPlan(profile, j, day).activity.deduplicatedKcal, 150);
  j = saveSession(j, manual({ kind: 'walk', reportedActiveKcal: 250 })); assert.equal(j.sessions.length, 1); assert.equal(dailyEnergyPlan(profile, j, day).activity.activeKcal, 250);
  j = { ...j, sessions: [] }; assert.equal(dailyEnergyPlan(profile, j, day).activity.activeKcal, 150);
});
test('Basculer montre → estimation réutilise les paramètres et ignore les anciennes kcal saisies', () => {
  const initial = manual({ kind: 'cycle', weightKg: 80 });
  assert.equal(sessionEnergy(initial).activeKcal, 280);
  assert.equal(sessionEnergy({ ...initial, energySource: 'estimated' }).activeKcal, 240);
});
test('Total actif journalier remplace pas et séances, même quand on ajoute ensuite une séance', () => {
  let j = saveSession(setDaySteps(empty(), day, 6000, { weightKg: 75, baselineSteps: 2000 }), manual());
  j = setDayEnergy(j, day, report());
  let p = dailyEnergyPlan(profile, j, day);
  assert.equal(p.activity.activeKcal, 620); assert.equal(p.creditedKcal, 570); assert.ok(p.activity.report);
  j = saveSession(j, session({ id: 's2' })); p = dailyEnergyPlan(profile, j, day); assert.equal(p.activity.activeKcal, 620); assert.equal(p.creditedKcal, 570);
  assert.equal(p.activity.sessionKcal, 520); assert.equal(p.activity.steps, 6000);
});
test('Total montre : remplacer, zéro, autre jour et retrait retournent au calcul attendu', () => {
  let j = saveSession(empty(), manual()); j = setDayEnergy(j, day, report()); j = setDayEnergy(j, day, report({ activeKcal: 800 }));
  assert.equal(dailyEnergyPlan(profile, j, day).activity.activeKcal, 800);
  assert.equal(dailyEnergyPlan(profile, j, tomorrow).activity.activeKcal, 0);
  j = setDayEnergy(j, day, report({ activeKcal: 0 })); assert.equal(dailyEnergyPlan(profile, j, day).activity.activeKcal, 0); assert.equal(dailyEnergyPlan(profile, j, day).creditedKcal, 0);
  j = setDayEnergy(j, day, null); assert.equal(dailyEnergyPlan(profile, j, day).activity.activeKcal, 280); assert.equal(dailyEnergyPlan(profile, j, day).activity.report, null);
});
test('Séances habituelles exclues et modes fixe/manuel restent respectés avec un total montre', () => {
  const j = setDayEnergy(saveSession(empty(), manual({ includeInGoal: false })), day, report());
  assert.equal(dailyEnergyPlan(profile, j, day).creditedKcal, 340);
  for (const p of [{ ...profile, activityBudgetMode: 'fixed' }, { ...profile, targetMode: 'manual' }]) { const plan = dailyEnergyPlan(p, j, day); assert.equal(plan.activity.activeKcal, 620); assert.equal(plan.creditedKcal, 0); }
});
test('Profil avec repère invalide : kcal connues restent visibles, aucun crédit alimentaire calculé', () => {
  const p = dailyEnergyPlan({ ...profile, age: 1 }, saveSession(empty(), manual()), day);
  assert.equal(p.activity.activeKcal, 280); assert.equal(p.creditedKcal, 0); assert.ok(p.issue);
});
test('Migration complète : anciennes séances préservées, valeurs montre conservées au redémarrage', () => {
  const j = setDayEnergy(saveSession(saveSession(empty(), manual()), session({ id: 'old', energySource: undefined })), day, report());
  const restored = readActivity(JSON.parse(JSON.stringify(j)));
  assert.equal(restored.sessions.length, 2); assert.equal(sessionEnergy(restored.sessions.find(s => s.id === 's1')).activeKcal, 280);
  assert.deepEqual(restored.reportedEnergyByDay[day], report()); assert.equal(dailyEnergyPlan(profile, restored, day).activity.activeKcal, 620);
});
test('Un total montre endommagé ne supprime ni les pas ni les séances ; dates et limites validées', () => {
  const j = saveSession(empty(), manual());
  const restored = readActivity({ ...j, reportedEnergyByDay: { [day]: report({ activeKcal: -1 }) } });
  assert.equal(restored.sessions.length, 1); assert.equal(restored.reportedEnergyByDay, undefined);
  for (const patch of [{ activeKcal: NaN }, { activeKcal: 10001 }, { baselineActiveKcal: -1 }, { deviceName: null }]) assert.throws(() => setDayEnergy(j, day, report(patch)));
  assert.throws(() => setDayEnergy(j, '2999-01-01', report()));
});
test('Valeurs inconnues restent un bilan partiel, sauf avec un total journalier confirmé', () => {
  let j = saveSession(empty(), session({ kind: 'other', energySource: undefined, weightKg: undefined }));
  let p = dailyEnergyPlan(profile, j, day); assert.equal(p.activity.partial, true); assert.equal(p.activity.hasEnergy, false);
  j = setDayEnergy(j, day, report()); p = dailyEnergyPlan(profile, j, day); assert.equal(p.activity.partial, false); assert.equal(p.activity.hasEnergy, true);
});
