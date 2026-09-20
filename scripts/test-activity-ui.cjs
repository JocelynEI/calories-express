// Exercise the real form state and handlers. Native layout is not simulated.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
const profile = { firstName: 'Test', sexForFormula: 'male', age: 40, heightCm: 180, weightKg: 80, activityLevel: 'light', activityBudgetMode: 'daily', goal: 'lose', targetMode: 'automatic', manualTarget: 2200 };
const day = '2026-09-19';
let app;
const load = Module._load;
Module._load = function (name, ...args) {
  if (name === 'react-native') return { View: 'View', Text: 'Text', Switch: 'Switch', StyleSheet: { create: x => x } };
  if (name.endsWith('/FormControls')) return { Action: 'Action', Choice: 'Choice', Field: 'Field', form: {} };
  if (name.endsWith('/state/AppContext')) return { useApp: () => app };
  return load.call(this, name, ...args);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (module, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  module._compile(code, filename);
};
const { SessionEntryForm } = require('../src/components/SessionEntryForm.tsx');
const { DayEnergyForm } = require('../src/components/DayEnergyForm.tsx');
const { sessionEnergy, dailyEnergyPlan } = require('../src/domain/activity-energy.ts');
const { saveSession, setDayEnergy } = require('../src/domain/activity.ts');

async function mount(Component, props = {}, fixture = {}) {
  app = { profile, profileCompleted: true, activity: { sessions: [], stepsByDay: {} }, ...fixture };
  const saved = [], dirty = [], removed = [];
  let tree;
  await act(() => { tree = create(React.createElement(Component, { day, onSave: x => saved.push(x), onDirty: x => dirty.push(x), onCancel: () => {}, onRemove: () => removed.push(true), ...props })); });
  const field = label => tree.root.findByProps({ label });
  return {
    saved, dirty, removed, tree, field,
    change: (label, value) => act(() => field(label).props.onChange(value)),
    press: label => act(() => { const p = field(label).props; if (!p.disabled) p.onPress(); }),
    text: () => JSON.stringify(tree.toJSON()),
    close: () => act(() => tree.unmount()),
  };
}

test('Formulaire réel : un objectif invalide ne bloque plus les kcal de séance', async () => {
  const ui = await mount(SessionEntryForm, {}, { profile: { ...profile, age: 1 } });
  try {
    await ui.change('Durée de la séance (minutes)', '30');
    await ui.press('Enregistrer la séance et ses kcal');
    assert.equal(ui.saved.length, 1);
    assert.equal(sessionEnergy(ui.saved[0]).activeKcal, 72); // Marche lente, 2,8 MET.
    assert.equal(ui.saved[0].weightKg, 80);
    assert.ok(ui.dirty.includes(true)); assert.equal(ui.dirty.at(-1), false);
  } finally { await ui.close(); }
});
test('Formulaire réel : estimer sans profil complété en renseignant le poids', async () => {
  const ui = await mount(SessionEntryForm, {}, { profileCompleted: false });
  try {
    await ui.change('Durée de la séance (minutes)', '30');
    await ui.press('Enregistrer la séance et ses kcal');
    assert.equal(ui.saved.length, 0); assert.match(ui.text(), /poids/);
    await ui.change('Poids utilisé pour cette séance (kg)', '80');
    await ui.press('Enregistrer la séance et ses kcal');
    assert.equal(ui.saved.length, 1); assert.equal(sessionEnergy(ui.saved[0]).activeKcal, 72);
  } finally { await ui.close(); }
});
test('Formulaire réel : activité libre et calories montre sans poids, intégrées au bilan', async () => {
  const ui = await mount(SessionEntryForm, {}, { profileCompleted: false });
  try {
    await ui.press('Autre activité');
    assert.equal(ui.field('Saisir mes kcal').props.selected, true);
    await ui.change('Durée de la séance (minutes)', '35');
    await ui.change('Calories actives de cette séance (kcal)', '280');
    await ui.change('Provenance (facultatif)', 'Apple Watch');
    await ui.press('Enregistrer la séance et ses kcal');
    assert.equal(ui.saved.length, 1); assert.equal(ui.saved[0].weightKg, undefined);
    assert.equal(ui.saved[0].deviceName, 'Apple Watch');
    const journal = saveSession(app.activity, ui.saved[0]);
    assert.equal(dailyEnergyPlan(profile, journal, day, false).activity.activeKcal, 280);
    assert.equal(sessionEnergy(ui.saved[0]).source, 'reported');
  } finally { await ui.close(); }
});
test('Formulaire réel : durée et kcal absentes ne créent pas une séance vide', async () => {
  const ui = await mount(SessionEntryForm);
  try {
    await ui.press('Enregistrer la séance et ses kcal');
    assert.equal(ui.saved.length, 0);
    await ui.press('Saisir mes kcal');
    await ui.change('Durée de la séance (minutes)', '30');
    await ui.press('Enregistrer la séance et ses kcal');
    assert.equal(ui.saved.length, 0); assert.match(ui.text(), /calories actives/);
    await ui.change('Calories actives de cette séance (kcal)', '0');
    await ui.press('Enregistrer la séance et ses kcal');
    assert.equal(ui.saved.length, 1); assert.equal(ui.saved[0].reportedActiveKcal, 0);
  } finally { await ui.close(); }
});
test('Formulaire réel : correction montre → calcul conserve la séance et remplace sa source', async () => {
  const entry = { id: 'existing', day, kind: 'cycle', effort: 'moderate', minutes: 30, note: '', energySource: 'reported', reportedActiveKcal: 280, deviceName: 'Apple Watch', includeInGoal: true, includedInSteps: false };
  const ui = await mount(SessionEntryForm, { entry }, { activity: { sessions: [entry], stepsByDay: {} } });
  try {
    await ui.press('Estimer automatiquement');
    await ui.press('Enregistrer la modification');
    assert.equal(ui.saved.length, 1); assert.equal(ui.saved[0].id, 'existing');
    assert.equal(ui.saved[0].reportedActiveKcal, undefined); assert.equal(ui.saved[0].deviceName, undefined);
    assert.equal(sessionEnergy(ui.saved[0]).activeKcal, 240);
    assert.equal(saveSession(app.activity, ui.saved[0]).sessions.length, 1);
  } finally { await ui.close(); }
});
test('Formulaire réel : un total montre confirmé remplace les estimations', async () => {
  const ui = await mount(DayEnergyForm);
  try {
    await ui.change('Total des calories actives du jour (kcal)', '620');
    await ui.change('Kcal habituelles déjà couvertes par la base', '50');
    await ui.change('Provenance (facultatif)', 'Apple Watch');
    await ui.press('Utiliser ce total pour la journée'); assert.equal(ui.saved.length, 0);
    await ui.press('Je confirme : calories actives de cette journée, pas + séances inclus');
    await ui.press('Utiliser ce total pour la journée');
    assert.deepEqual(ui.saved, [{ activeKcal: 620, baselineActiveKcal: 50, deviceName: 'Apple Watch' }]);
    const journal = setDayEnergy(app.activity, day, ui.saved[0]);
    const p = dailyEnergyPlan(profile, journal, day); assert.equal(p.activity.activeKcal, 620); assert.equal(p.creditedKcal, 570);
    await ui.change('Total des calories actives du jour (kcal)', '700');
    assert.equal(ui.field('Utiliser ce total pour la journée').props.disabled, true);
  } finally { await ui.close(); }
});
test('Formulaire réel : retrait du total montre seulement après confirmation', async () => {
  const ui = await mount(DayEnergyForm, {}, { activity: { sessions: [], stepsByDay: {}, reportedEnergyByDay: { [day]: { activeKcal: 620, baselineActiveKcal: 50, deviceName: 'Apple Watch' } } } });
  try {
    await ui.press('Revenir au cumul des pas et séances'); assert.equal(ui.removed.length, 0);
    await ui.press('Garder le total de ma montre'); assert.equal(ui.removed.length, 0);
    await ui.press('Revenir au cumul des pas et séances');
    await ui.press('Confirmer le retour aux estimations'); assert.equal(ui.removed.length, 1);
  } finally { await ui.close(); }
});
