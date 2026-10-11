const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const exists = (file) => fs.existsSync(path.join(__dirname, '..', file));
const home = read('src/screens/TodayScreen.tsx');
const plate = read('src/components/PlateMeals.tsx');

/**
 * V3.5 — l'accueil « L'assiette ».
 *
 * Ce qui est vérifié ici : chaque information n'a qu'une place, rien de ce que
 * l'ancien accueil permettait n'a disparu, et les morceaux remplacés ne
 * reviennent pas.
 */

test('Le total mangé est en tête de « Dans ton assiette », pas dans la jauge', () => {
  assert.ok(plate.includes('Dans ton assiette'), 'le titre de la carte');
  assert.ok(/total\.toLocaleString\('fr-FR'\)/.test(plate), 'le total est affiché en tête');
  assert.ok(home.includes('<PlateMeals meals={dayMeals} total={consumed}'), 'l’accueil lui passe le total du jour');
});

test('L’accueil montre trois repas au plus, et dit où sont les autres', () => {
  assert.match(plate, /PLATE_MEALS_SHOWN = 3/);
  assert.ok(plate.includes('dans le Journal'), 'les repas en plus sont annoncés, pas cachés');
});

test('Chaque repas garde la teinte de son moment, la même que dans le Journal', () => {
  assert.ok(plate.includes("import { toneFor } from './MealCard'"), 'une seule source pour les teintes');
  assert.ok(read('src/components/MealCard.tsx').includes('export function toneFor'));
});

test('Chaque repas se modifie d’un appui, avec un libellé complet', () => {
  assert.ok(plate.includes('onPress={() => onEdit(meal)}'));
  assert.ok(plate.includes('accessibilityLabel={`Modifier ${meal.description}'));
});

test('La ligne « Bougé » ouvre le détail de l’activité', () => {
  const start = home.indexOf('style={styles.moved}');
  const before = home.lastIndexOf('<MotionPressable', start);
  assert.ok(home.slice(before, start).includes('onPress={onActivity}'), 'pas, séances et montre restent joignables depuis l’accueil');
});

test('Les morceaux remplacés ne reviennent pas', () => {
  for (const file of ['src/components/DayBubbles.tsx', 'src/components/PremiumDayVisual.tsx']) {
    assert.equal(exists(file), false, `${file} ne doit plus exister`);
  }
  assert.equal(home.includes('Mieux manger'), false, 'l’assiette remplace l’illustration');
  assert.equal(read('src/components/MealCard.tsx').includes('compact'), false, 'la ligne resserrée a été remplacée par « Dans ton assiette »');
});

test('Les deux boutons tiennent la hauteur d’un doigt', () => {
  assert.match(home, /action: \{[^}]*minHeight: 52/);
  assert.match(home, /moved: \{[^}]*minHeight: 56/);
  assert.match(plate, /row: \{[^}]*minHeight: 56/);
});

test('Plus aucun style « absoluteFillObject », retiré de React Native 0.86 (V3.5.1)', () => {
  // Sur téléphone il valait `undefined` : le voile des photos du Journal perdait
  // sa position sans la moindre erreur à l'écran.
  for (const dir of ['src/components', 'src/screens']) {
    for (const name of fs.readdirSync(path.join(__dirname, '..', dir))) {
      assert.equal(read(`${dir}/${name}`).includes('absoluteFillObject'), false, `${dir}/${name}`);
    }
  }
  assert.ok(read('src/components/MealCard.tsx').includes('...StyleSheet.absoluteFill,'));
});
