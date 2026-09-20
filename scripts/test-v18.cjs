const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dayKey, dayLabel, dayDistance, shiftDay, isValidDay, timestampForDay } = require('../.test-dist/domain/date.js');
const { saveWeight, readWeightLog, movingAverage, weightTrend, trendSentence, weightIssue } = require('../.test-dist/domain/weight.js');
const { mealsForDay, frequentMeals, repeatMeal, totalCalories, mealDay } = require('../.test-dist/domain/meals.js');
const { readMeal, readProfile } = require('../.test-dist/domain/persistence.js');
const { STORIES, readStoryHistory, markStorySeen, orderedStories, storyDuration } = require('../.test-dist/domain/stories.js');

const DEFAULT_PROFILE = { firstName: '', sexForFormula: 'female', age: 30, heightCm: 170, weightKg: 70, activityLevel: 'light', activityBudgetMode: 'fixed', goal: 'maintain', targetMode: 'automatic', manualTarget: 2200 };
const meal = (extra = {}) => ({
  id: 'm1', createdAt: '2026-09-18T12:30:00.000Z', moment: 'Déjeuner', method: 'phrase', description: 'Riz et poulet',
  items: [{ foodId: 'c1', name: 'Riz cuit', quantity: 150, calories: { min: 180, estimated: 200, max: 220 }, macros: { protein: 4, carbs: 42, fat: 1 }, confidence: 'Bonne' }],
  calories: { min: 180, estimated: 200, max: 220 }, macros: { protein: 4, carbs: 42, fat: 1 }, ...extra,
});

/* ------------------------------------------------------- navigation par date */

test('Une journée se déplace sans jamais dériver d’un jour', () => {
  assert.equal(shiftDay('2026-03-28', 1), '2026-03-29');
  // Passage à l'heure d'été en France : la journée reste entière.
  assert.equal(shiftDay('2026-03-28', 2), '2026-03-30');
  assert.equal(shiftDay('2026-01-01', -1), '2025-12-31');
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
  assert.equal(dayDistance('2026-09-19', '2026-09-12'), 7);
  assert.equal(dayDistance('2026-03-28', '2026-03-30'), -2);
});

test('Une journée invalide est refusée plutôt que réparée', () => {
  assert.equal(isValidDay('2026-02-30'), false, 'le 30 février n’existe pas');
  assert.equal(isValidDay('2026-13-01'), false);
  assert.equal(isValidDay('19-09-2026'), false);
  assert.equal(isValidDay(''), false);
  assert.equal(isValidDay(null), false);
  assert.ok(isValidDay('2026-02-28'));
});

test('Les libellés de journée restent lisibles', () => {
  const today = '2026-09-19';
  assert.equal(dayLabel(today, today), 'Aujourd’hui');
  assert.equal(dayLabel('2026-09-18', today), 'Hier');
  assert.equal(dayLabel('2026-09-17', today), 'Avant-hier');
  assert.match(dayLabel('2026-09-10', today), /septembre/);
});

test('Un repas ajouté sur une journée passée est daté de cette journée', () => {
  const now = new Date('2026-09-19T21:40:00');
  assert.equal(dayKey(new Date(timestampForDay('2026-09-16', now))), '2026-09-16');
  // Aujourd'hui conserve l'heure réelle.
  assert.equal(timestampForDay(dayKey(now), now), now.toISOString());
});

/* -------------------------------------------------------------------- poids */

test('Une pesée est bornée et ne peut pas être enregistrée dans le futur', () => {
  const today = '2026-09-19';
  assert.match(weightIssue(today, 12, today), /entre 35 et 300/);
  assert.match(weightIssue(today, 500, today), /entre 35 et 300/);
  assert.match(weightIssue('2026-09-20', 80, today), /à venir/);
  assert.equal(weightIssue(today, 79.4, today), null);
  assert.throws(() => saveWeight([], { day: '2026-09-20', kg: 80 }, today), /à venir/);
});

test('Une seule pesée par jour : la nouvelle remplace la précédente', () => {
  let log = saveWeight([], { day: '2026-09-18', kg: 80.2 }, '2026-09-19');
  log = saveWeight(log, { day: '2026-09-18', kg: 79.9 }, '2026-09-19');
  assert.equal(log.length, 1);
  assert.equal(log[0].kg, 79.9);
  log = saveWeight(log, { day: '2026-09-17', kg: 80.5 }, '2026-09-19');
  assert.deepEqual(log.map(entry => entry.day), ['2026-09-17', '2026-09-18'], 'le journal reste trié');
});

test('Une entrée abîmée ne fait pas perdre les pesées valides', () => {
  const log = readWeightLog([
    { day: '2026-09-15', kg: 80 },
    { day: 'hier', kg: 79 },
    { day: '2026-09-16', kg: 'beaucoup' },
    null,
    { day: '2026-09-17', kg: 79.5 },
  ]);
  assert.deepEqual(log.map(entry => entry.day), ['2026-09-15', '2026-09-17']);
  assert.deepEqual(readWeightLog('rien du tout'), []);
});

test('La moyenne mobile lisse ce que les points font sauter', () => {
  const days = ['2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19'];
  const raw = [80.4, 79.6, 80.6, 79.8, 80.2, 79.4, 79.8];
  let log = [];
  days.forEach((day, index) => { log = saveWeight(log, { day, kg: raw[index] }, '2026-09-19'); });
  const average = movingAverage(log, 7);
  assert.equal(average.length, log.length);
  const spread = values => Math.max(...values) - Math.min(...values);
  assert.ok(spread(average.map(entry => entry.kg)) < spread(raw), 'la moyenne doit varier moins que les pesées');
  assert.ok(Math.abs(average[average.length - 1].kg - 79.97) < 0.02);
});

test('Une tendance n’est annoncée qu’avec assez de pesées étalées', () => {
  const today = '2026-09-19';
  assert.equal(weightTrend([], 28, today), null);
  let court = saveWeight([], { day: '2026-09-18', kg: 80 }, today);
  court = saveWeight(court, { day: today, kg: 79 }, today);
  const bref = weightTrend(court, 28, today);
  assert.equal(bref.readable, false, 'deux jours ne suffisent pas à lire une tendance');
  assert.match(trendSentence(bref), /se construit/);

  let long = [];
  for (let index = 27; index >= 0; index -= 1) {
    long = saveWeight(long, { day: shiftDay(today, -index), kg: 82 - (27 - index) * 0.07 }, today);
  }
  const trend = weightTrend(long, 28, today);
  assert.ok(trend.readable);
  assert.ok(Math.abs(trend.kgPerWeek + 0.49) < 0.05, `pente inattendue : ${trend.kgPerWeek}`);
  assert.match(trendSentence(trend), /baisse/);
  // La phrase décrit le passé et le dit ; elle ne projette aucune date ni aucun poids futur.
  assert.match(trendSentence(trend), /pas une prévision/);
  assert.doesNotMatch(trendSentence(trend), /atteindra|tu auras|d’ici (le|la|\d)|dans \d+ semaines/, 'la phrase ne doit rien prédire');
});

/* ------------------------------------------------------------------- repas */

test('Les repas sont rattachés à leur journée locale, y compris le soir', () => {
  const soir = meal({ id: 'soir', createdAt: new Date(2026, 8, 18, 22, 30).toISOString() });
  assert.equal(mealDay(soir), '2026-09-18');
  const jour = mealsForDay([soir, meal({ id: 'autre', createdAt: new Date(2026, 8, 17, 9, 0).toISOString() })], '2026-09-18');
  assert.deepEqual(jour.map(entry => entry.id), ['soir']);
});

test('Refaire un repas recopie les aliments sans toucher à l’original', () => {
  const source = meal();
  const copie = repeatMeal(source, '2026-09-19', new Date('2026-09-19T08:00:00'));
  assert.notEqual(copie.id, source.id);
  assert.equal(mealDay(copie), '2026-09-19');
  assert.equal(copie.calories.estimated, source.calories.estimated);
  copie.items[0].quantity = 999;
  assert.equal(source.items[0].quantity, 150, 'l’original ne doit pas bouger');
});

test('Les repas habituels excluent la démonstration et la journée consultée', () => {
  const meals = [
    meal({ id: 'demo-lunch', createdAt: new Date(2026, 8, 17, 12, 0).toISOString() }),
    meal({ id: 'a', createdAt: new Date(2026, 8, 17, 8, 0).toISOString(), description: 'Café et tartines', moment: 'Petit-déjeuner' }),
    meal({ id: 'b', createdAt: new Date(2026, 8, 16, 8, 5).toISOString(), description: 'Café et tartines', moment: 'Petit-déjeuner' }),
    meal({ id: 'c', createdAt: new Date(2026, 8, 19, 8, 0).toISOString(), description: 'Jour consulté', moment: 'Petit-déjeuner' }),
  ];
  const templates = frequentMeals(meals, '2026-09-19');
  assert.deepEqual(templates.map(entry => entry.meal.id), ['a']);
  assert.equal(templates[0].times, 2, 'deux occurrences du même petit-déjeuner');
  assert.equal(totalCalories(meals), 800);
});

/* ------------------------------------------------------- relecture du stockage */

test('Un repas illisible est écarté, les autres sont gardés', () => {
  assert.equal(readMeal(null), null);
  assert.equal(readMeal({ id: 'x' }), null, 'sans date ni totaux, rien à afficher');
  assert.equal(readMeal(meal({ createdAt: 'jamais' })), null);
  assert.equal(readMeal(meal({ calories: { min: 1, estimated: 'beaucoup', max: 3 } })), null);
  assert.equal(readMeal(meal({ items: [] })), null);
  const lu = readMeal(meal({ moment: 'Brunch', method: 'télépathie' }));
  assert.equal(lu.moment, 'Snack', 'un moment inconnu ne fait pas planter l’écran');
  assert.equal(lu.method, 'phrase');
  assert.equal(readMeal(meal()).calories.estimated, 200);
});

test('Un profil abîmé retombe sur ses valeurs par défaut sans propager de NaN', () => {
  const lu = readProfile({ age: 'trente', heightCm: 175, weightKg: null, goal: 'maigrir', targetMode: 'manual', manualTarget: 1800 }, DEFAULT_PROFILE);
  assert.equal(lu.age, DEFAULT_PROFILE.age);
  assert.equal(lu.heightCm, 175);
  assert.equal(lu.weightKg, DEFAULT_PROFILE.weightKg);
  assert.equal(lu.goal, 'maintain', 'un objectif inconnu ne devient pas une perte de poids');
  assert.equal(lu.targetMode, 'manual');
  assert.equal(lu.manualTarget, 1800);
  assert.ok(Number.isFinite(lu.age) && Number.isFinite(lu.weightKg));
  assert.deepEqual(readProfile(undefined, DEFAULT_PROFILE), DEFAULT_PROFILE);
  assert.equal(readProfile({ firstName: 'x'.repeat(200) }, DEFAULT_PROFILE).firstName, '', 'un prénom aberrant est ignoré');
});

/* --------------------------------------------------------------- séquences */

test('Chaque séquence est jouable et finit sur Jaws', () => {
  assert.ok(STORIES.length >= 5);
  const ids = new Set();
  for (const story of STORIES) {
    assert.equal(ids.has(story.id), false, `identifiant en double : ${story.id}`);
    ids.add(story.id);
    assert.ok(story.scenes.length >= 3, `${story.id} est trop courte`);
    assert.equal(story.scenes[story.scenes.length - 1].art, 'jaws', `${story.id} ne se termine pas sur Jaws`);
    for (const scene of story.scenes) {
      assert.ok(scene.headline.length > 0 && scene.headline.length <= 40, `titre trop long : ${scene.headline}`);
      assert.ok(scene.caption.length > 20 && scene.caption.length <= 220, `légende hors limites : ${scene.caption}`);
      assert.equal(scene.videoUri, undefined, 'aucune scène ne doit dépendre d’un fichier distant');
    }
    const seconds = storyDuration(story) / 1000;
    assert.ok(seconds >= 12 && seconds <= 90, `${story.id} dure ${seconds} s`);
  }
});

test('Aucune séquence ne propose de compenser un repas', () => {
  const interdits = /compens|br[ûu]ler (les|ces|tes) calories|rattraper (ce|ton) repas|punition m[ée]rit/i;
  for (const story of STORIES) {
    for (const scene of story.scenes) {
      const texte = `${scene.headline} ${scene.caption}`;
      // « ne propose jamais de compenser » est une phrase de refus, pas une invitation.
      if (interdits.test(texte)) {
        assert.match(texte, /ne (te )?(propose|demande)|jamais|pas de/i, `formulation à revoir : ${texte}`);
      }
    }
  }
});

/**
 * Garde-fou d'animation (V1.8.2).
 *
 * `progress` est animé sur le pilote JS, parce que le lecteur l'écoute et
 * anime des largeurs en pourcentage. Si une scène lance une boucle avec
 * `useNativeDriver: true` et la place dans la même vue animée qu'une valeur
 * dérivée de `progress`, React Native déplace tout le nœud vers le natif, et
 * la scène suivante échoue avec « Attempting to run JS driven animation on
 * animated node that has been moved to native ». C'est arrivé en V1.8 dans la
 * scène finale de Jaws. La règle est donc simple et vérifiable : un seul
 * pilote, le JS, dans les fichiers du lecteur de séquences.
 */
test('Les séquences n’utilisent qu’un seul pilote d’animation', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  for (const file of ['StoryScene.tsx', 'StoryPlayer.tsx']) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', file), 'utf8');
    assert.equal(
      source.includes('useNativeDriver: true'), false,
      `${file} doit rester sur le pilote JS : mélanger les deux pilotes casse la scène suivante.`,
    );
    assert.ok(source.includes('useNativeDriver: false'), `${file} doit déclarer explicitement son pilote.`);
  }
});

test('L’historique des séquences ignore ce qu’il ne connaît pas', () => {
  assert.deepEqual(readStoryHistory({ seen: ['repere', 'inconnue', 42] }).seen, ['repere']);
  assert.deepEqual(readStoryHistory(null).seen, []);
  const history = markStorySeen({ seen: [] }, 'repere');
  assert.deepEqual(history.seen, ['repere']);
  assert.equal(markStorySeen(history, 'repere'), history, 'revoir une séquence ne change pas l’état');
  assert.equal(markStorySeen(history, 'inexistante'), history);
  const order = orderedStories(history);
  assert.equal(order[order.length - 1].id, 'repere', 'les séquences déjà vues passent en fin de liste');
  assert.equal(order.length, STORIES.length, 'aucune séquence n’est cachée');
});
