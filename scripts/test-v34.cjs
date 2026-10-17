const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const {
  readPremium, unlockedState, readMacroGoals, macroGoalsIssue, goalsFromPreset, goalsKcal,
  effectiveMacroGoals, MACRO_PRESETS, PREMIUM_FEATURES, PREMIUM_PRODUCT_ID, PREMIUM_PRICE_LABEL, STAYS_FREE,
} = require('../.test-dist/domain/premium.js');
const { periodReport, durationLabel, signedKcal } = require('../.test-dist/domain/report.js');

/**
 * V5.0 — le premium.
 *
 * Vérifié ici : le statut se relit sans jamais deviner un achat ; les objectifs
 * de macros sont bornés ; les bilans ne comptent ni les jours sans repas, ni
 * les jours d'exemple, ni des macros incomplètes ; et surtout, rien de ce qui
 * était gratuit n'a été verrouillé.
 */

/* ------------------------------ Le statut ------------------------------ */

test('Le statut premium : un fichier abîmé ou inconnu donne « non débloqué »', () => {
  assert.deepEqual(readPremium(undefined), { unlocked: false });
  assert.deepEqual(readPremium(null), { unlocked: false });
  assert.deepEqual(readPremium('oui'), { unlocked: false });
  assert.deepEqual(readPremium([true]), { unlocked: false });
  assert.deepEqual(readPremium({ unlocked: 'true' }), { unlocked: false }, 'une chaîne n’est pas un achat');
  assert.deepEqual(readPremium({ unlocked: 1 }), { unlocked: false });
  assert.equal(readPremium({ unlocked: true }).unlocked, true);
  assert.equal(readPremium({ unlocked: true, source: 'store' }).source, 'store');
  assert.equal(readPremium({ unlocked: true, source: 'pirate' }).source, undefined, 'une source inconnue est ignorée');
});

test('Débloquer garde la source et la date', () => {
  const state = unlockedState('test', new Date('2026-10-17T10:00:00Z'));
  assert.deepEqual(state, { unlocked: true, source: 'test', unlockedAt: '2026-10-17T10:00:00.000Z' });
  assert.deepEqual(readPremium(state), state, 'ce qui est écrit se relit à l’identique');
});

test('Le premium annonce deux fonctions, un prix, et ce qui reste gratuit', () => {
  assert.deepEqual(PREMIUM_FEATURES.map(f => f.id), ['etiquette', 'journee', 'bilans', 'objectifs']);
  assert.equal(PREMIUM_PRODUCT_ID, 'premium_vie');
  assert.equal(PREMIUM_PRICE_LABEL, '14,99 €');
  for (const word of ['scan', 'recherche', 'plats maison', 'activités', 'poids', 'repères automatiques']) {
    assert.ok(STAYS_FREE.includes(word), `« ${word} » est dit gratuit`);
  }
});

/* --------------------------- Objectifs de macros --------------------------- */

test('Les objectifs de macros : bornes, arrondis, valeurs absentes', () => {
  assert.deepEqual(readMacroGoals({ protein: 120.4, carbs: 250, fat: 70.6 }), { protein: 120, carbs: 250, fat: 71 });
  assert.equal(readMacroGoals({ protein: 120, carbs: 250 }), null, 'une valeur manque');
  assert.equal(readMacroGoals({ protein: 4, carbs: 250, fat: 70 }), null, 'sous le minimum');
  assert.equal(readMacroGoals({ protein: 120, carbs: 801, fat: 70 }), null, 'au-dessus du maximum');
  assert.equal(readMacroGoals({ protein: '120', carbs: 250, fat: 70 }), null, 'un texte n’est pas un nombre');
  assert.equal(readMacroGoals({ protein: NaN, carbs: 250, fat: 70 }), null);
  assert.equal(readMacroGoals(null), null);
  assert.equal(macroGoalsIssue({ protein: 120, carbs: 250, fat: 70 }), null);
  assert.match(macroGoalsIssue({ protein: 2, carbs: 250, fat: 70 }), /protéines/);
  assert.match(macroGoalsIssue({ protein: 120, carbs: 250, fat: NaN }), /lipides/);
});

test('Les modèles donnent des grammes cohérents avec le repère calorique', () => {
  const balanced = goalsFromPreset(2000, MACRO_PRESETS[0]);
  assert.deepEqual(balanced, { protein: 100, carbs: 250, fat: 67 });
  assert.ok(Math.abs(goalsKcal(balanced) - 2000) <= 10, 'les grammes redonnent le repère à quelques kcal près');
  for (const preset of MACRO_PRESETS) {
    const { protein, carbs, fat } = preset.share;
    assert.equal(protein + carbs + fat, 100, `${preset.label} fait 100 %`);
    assert.ok(Math.abs(goalsKcal(goalsFromPreset(2400, preset)) - 2400) <= 12, preset.label);
  }
});

test('Sans premium, les repères automatiques servent toujours, même si des objectifs sont enregistrés', () => {
  const auto = { protein: 105, carbs: 240, fat: 63 };
  const custom = { protein: 150, carbs: 200, fat: 60 };
  assert.deepEqual(effectiveMacroGoals(auto, custom, false), { goals: auto, custom: false });
  assert.deepEqual(effectiveMacroGoals(auto, null, true), { goals: auto, custom: false });
  assert.deepEqual(effectiveMacroGoals(auto, custom, true), { goals: custom, custom: true });
});

/* --------------------------------- Bilans --------------------------------- */

const TODAY = '2026-10-17';
const profile = { firstName: '', sexForFormula: 'female', age: 30, heightCm: 170, weightKg: 70, activityLevel: 'light', goal: 'maintain', targetMode: 'manual', manualTarget: 2000 };
const journal = { sessions: [], stepsByDay: {} };
const at = (back) => new Date(2026, 9, 17 - back, 12, 0, 0).toISOString();
let counter = 0;
const meal = (back, kcal, macros = { protein: 80, carbs: 200, fat: 60 }, complete = true, id = `m${++counter}`) => ({
  id, createdAt: at(back), moment: 'Déjeuner', description: 'repas', method: 'manual',
  items: [{ foodId: 'x', name: 'x', quantity: 1, calories: { min: kcal, estimated: kcal, max: kcal }, macros, confidence: 'Moyenne', macrosComplete: complete }],
  calories: { min: kcal, estimated: kcal, max: kcal }, macros,
});

test('Le bilan : les jours sans repas ne sont pas des jours à zéro', () => {
  const meals = [meal(0, 2500), meal(1, 1500), meal(3, 2000)];
  const r = periodReport(meals, profile, journal, true, TODAY, 7);
  assert.equal(r.days.length, 7);
  assert.equal(r.days[6].day, TODAY, 'la dernière case est aujourd’hui');
  assert.equal(r.recordedDays, 3);
  assert.equal(r.avgKcal, 2000, '(2500 + 1500 + 2000) / 3, pas / 7');
  assert.equal(r.days[0].target, 2000, 'repère manuel');
  assert.equal(r.avgTarget, 2000);
  assert.equal(r.gapKcal, 0);
  assert.equal(r.daysAbove, 1, 'seul le jour à 2 500 dépasse');
});

test('Le bilan : un bilan vide reste vide, sans chiffre inventé', () => {
  const r = periodReport([], profile, journal, true, TODAY, 30);
  assert.equal(r.days.length, 30);
  assert.equal(r.recordedDays, 0);
  assert.equal(r.avgKcal, null);
  assert.equal(r.gapKcal, null);
  assert.equal(r.macros, null);
  assert.equal(r.previous, null);
});

test('Le bilan : les journées d’exemple ne comptent jamais', () => {
  const r = periodReport([meal(0, 900, undefined, true, 'demo-lunch'), meal(1, 2100)], profile, journal, true, TODAY, 7);
  assert.equal(r.recordedDays, 1);
  assert.equal(r.avgKcal, 2100);
});

test('Le bilan : les macros ignorent les journées incomplètes et le disent', () => {
  const meals = [
    meal(0, 2000, { protein: 90, carbs: 200, fat: 70 }),
    meal(1, 2000, { protein: 110, carbs: 220, fat: 50 }),
    meal(2, 1800, { protein: 5, carbs: 10, fat: 1 }, false),
  ];
  const r = periodReport(meals, profile, journal, true, TODAY, 7);
  assert.deepEqual(r.macros, { protein: 100, carbs: 210, fat: 60, days: 2 });
  assert.equal(r.macrosPartialDays, 1);
  assert.equal(r.avgKcal, 1933, 'les kcal, elles, comptent les trois jours');
});

test('Le bilan : la comparaison exige trois jours renseignés de chaque côté', () => {
  const current = [meal(0, 2000), meal(1, 2000), meal(2, 2000)];
  const before = [meal(7, 2200), meal(8, 2200), meal(9, 2200)];
  const r = periodReport([...current, ...before], profile, journal, true, TODAY, 7);
  assert.deepEqual(r.previous, { avgKcal: 2200, deltaKcal: -200 });
  const few = periodReport([...current, meal(7, 2200), meal(8, 2200)], profile, journal, true, TODAY, 7);
  assert.equal(few.previous, null, 'deux jours avant : pas de comparaison');
  const fewNow = periodReport([meal(0, 2000), meal(1, 2000), ...before], profile, journal, true, TODAY, 7);
  assert.equal(fewNow.previous, null, 'deux jours maintenant : pas de comparaison');
});

test('Le bilan : l’activité additionne minutes et jours actifs', () => {
  const sessions = [
    { id: 'a', day: TODAY, kind: 'walk', minutes: 30, note: '' },
    { id: 'b', day: '2026-10-15', kind: 'run', minutes: 45, note: '' },
  ];
  const r = periodReport([meal(0, 2000)], profile, { sessions, stepsByDay: {} }, true, TODAY, 7);
  assert.equal(r.activity.minutes, 75);
  assert.equal(r.activity.activeDays, 2);
  assert.ok(r.activity.activeKcal > 0, 'les kcal viennent de l’estimation de l’appli');
  assert.equal(periodReport([meal(0, 2000)], profile, journal, true, TODAY, 7).activity.activeDays, 0);
});

test('Les durées et les écarts s’écrivent comme on les lit', () => {
  assert.equal(durationLabel(45), '45 min');
  assert.equal(durationLabel(60), '1 h');
  assert.equal(durationLabel(200), '3 h 20');
  assert.equal(durationLabel(125), '2 h 05');
  assert.equal(signedKcal(70), '+70');
  assert.equal(signedKcal(-70), '−70', 'un vrai signe moins');
  assert.equal(signedKcal(0), '0');
  assert.equal(signedKcal(-0.4), '0');
});

/* ----------------------- Le gratuit n’a pas bougé ----------------------- */

test('Rien de gratuit n’est verrouillé : ces écrans ne connaissent pas le premium', () => {
  for (const file of [
    'src/components/UnifiedFoodSearch.tsx', 'src/components/OcrReader.tsx',
    'src/components/RecipeBuilder.tsx', 'src/components/FoodEntryForms.tsx', 'src/components/AddMealModal.tsx',
    'src/components/ActivityModal.tsx', 'src/components/QuickActivity.tsx', 'src/components/WeightCard.tsx',
    'src/components/AvatarPicker.tsx', 'src/components/AddSheet.tsx', 'src/screens/JournalScreen.tsx',
  ]) {
    const src = read(file);
    assert.ok(!/premium|usePaywall|PremiumLock/i.test(src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')), `${file} ne dépend pas du premium`);
  }
});

test('Les repères automatiques de macros et le graphique des 7 jours restent gratuits', () => {
  const today = read('src/screens/TodayScreen.tsx');
  assert.ok(today.includes('macroTargets(profile, target)'), 'les repères automatiques servent de base');
  assert.ok(today.includes('effectiveMacroGoals('), 'et les objectifs perso ne passent que par le filtre premium');
  const progress = read('src/screens/ProgressScreen.tsx');
  assert.ok(progress.includes('Calories saisies') && progress.includes('<WeightCard />'), 'graphique et poids inchangés');
  assert.ok(progress.includes('premium.unlocked ? (') && progress.includes('<PeriodReportCard />'), 'le bilan est derrière le premium');
  assert.ok(progress.includes('feature="bilans"'), 'et sa version verrouillée s’ouvre sur l’écran du premium');
});

test('Le profil propose les objectifs de macros et le statut, avec « Restaurer mes achats »', () => {
  const profileScreen = read('src/screens/ProfileScreen.tsx');
  assert.ok(profileScreen.includes('<MacroGoalsSection />') && profileScreen.includes('<PremiumStatus />'));
  assert.ok(read('src/components/PremiumStatus.tsx').includes('Restaurer mes achats'));
  assert.ok(read('src/components/PremiumModal.tsx').includes('Restaurer mes achats'), 'aussi sur l’écran du premium');
  assert.ok(read('src/components/MacroGoalsSection.tsx').includes('Revenir aux repères automatiques'));
});

/* ----------------------- Persistance et sécurité ----------------------- */

test('Le premium est enregistré, et effacer le profil n’y touche jamais', () => {
  const ctx = read('src/state/AppContext.tsx');
  assert.ok(ctx.includes('storyHistory, premium, macroGoals, dayTemplates, labelMacroReads };'), 'écrit avec le reste de l’état');
  assert.ok(ctx.includes('setPremium(readPremium(parsed.premium))'), 'relu défensivement');
  assert.ok(ctx.includes('setMacroGoals(readMacroGoals(parsed.macroGoals))'));
  for (const name of ['startFresh', 'resetProfile', 'restoreDemo', 'updateProfile']) {
    const start = ctx.indexOf(`const ${name} = useCallback`);
    assert.ok(start > 0, name);
    const body = ctx.slice(start, ctx.indexOf('\n  }, [', start) + 1 || start + 400);
    assert.ok(!/Premium|MacroGoals/.test(body), `${name} ne touche ni au premium ni aux objectifs`);
  }
  assert.ok(!/premium/i.test(ctx.slice(ctx.indexOf('const exportData'), ctx.indexOf('const value = useMemo'))), 'la sauvegarde n’exporte pas le statut d’achat');
});

test('Aucune version publiée ne peut débloquer le premium sans paiement', () => {
  const purchases = read('src/services/purchases.ts');
  assert.ok(purchases.includes('export const TEST_MODE = typeof __DEV__ !== \'undefined\' && __DEV__'));
  assert.ok(purchases.includes('STORE_CONNECTED = false'), 'les stores ne sont pas branchés');
  const buy = purchases.slice(purchases.indexOf('export async function buyPremium'), purchases.indexOf('export async function restorePurchases'));
  assert.ok(buy.includes('if (TEST_MODE) return { status: \'unlocked\', source: \'test\' }'));
  assert.ok(buy.includes('return { status: \'unavailable\' }'), 'hors test : indisponible');
  // Le seul appel qui débloque passe par le résultat d’un achat ou d’une restauration.
  for (const file of ['src/components/PremiumModal.tsx', 'src/components/PremiumStatus.tsx']) {
    assert.ok(read(file).includes('unlockPremium(outcome.source)'), file);
  }
  const callers = ['src/screens', 'src/components', 'App.tsx'].flatMap(entry => {
    const full = path.join(__dirname, '..', entry);
    const files = fs.statSync(full).isDirectory() ? fs.readdirSync(full).map(f => path.join(entry, f)) : [entry];
    return files.filter(f => /\.tsx$/.test(f) && /unlockPremium\(/.test(read(f)));
  });
  assert.deepEqual(callers.sort(), ['src/components/PremiumModal.tsx', 'src/components/PremiumStatus.tsx']);
  // Le bouton « remettre en gratuit » n’existe qu’en mode test.
  assert.ok(read('src/components/PremiumStatus.tsx').includes('TEST_MODE && premium.unlocked'));
});

test('L’écran du premium ne s’ouvre jamais tout seul', () => {
  const app = read('App.tsx');
  assert.ok(app.includes('<PaywallProvider><AppShell /></PaywallProvider>'));
  assert.ok(!/openPaywall\(/.test(app), 'App.tsx ne l’ouvre pas');
  for (const file of ['src/screens/ProgressScreen.tsx', 'src/screens/ProfileScreen.tsx']) {
    assert.ok(!/useEffect\([^)]*openPaywall/.test(read(file)), `${file} : pas d’ouverture dans un effet`);
  }
  const lock = read('src/components/PremiumLock.tsx');
  assert.ok(lock.includes('onPress={() => openPaywall(feature)}'), 'seulement sur un appui');
});
