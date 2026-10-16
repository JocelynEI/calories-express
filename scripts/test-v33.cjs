const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const { avatarFor, kindTotals, TILE_KINDS, AVATAR_CHOICES } = require('../.test-dist/domain/activity-hero.js');
const { readProfile } = require('../.test-dist/domain/persistence.js');
const { groupMacros } = require('../.test-dist/domain/meals.js');

/**
 * V4.3 — ton personnage et la page Activités en tuiles.
 *
 * Vérifié ici : le personnage suit un choix explicite ou le profil rempli, jamais
 * une supposition ; il survit à l'enregistrement ; les tuiles comptent minutes et
 * kcal sans en inventer ; les pastilles de macros se taisent quand une valeur manque.
 */

const base = { firstName: '', sexForFormula: 'male', age: 40, heightCm: 178, weightKg: 84, activityLevel: 'light', goal: 'lose', targetMode: 'automatic', manualTarget: 2000 };

test('Le personnage : un choix explicite, sinon le profil rempli, sinon aucun', () => {
  assert.equal(avatarFor(base, false), null, 'profil vide : pas de supposition');
  assert.equal(avatarFor(base, true), 'homme');
  assert.equal(avatarFor({ ...base, sexForFormula: 'female' }, true), 'femme');
  assert.equal(avatarFor({ ...base, avatar: 'femme' }, true), 'femme', 'le choix l’emporte sur le profil');
  assert.equal(avatarFor({ ...base, avatar: 'aucun' }, true), null);
  assert.equal(avatarFor({ ...base, avatar: 'homme' }, false), 'homme', 'un choix explicite vaut même sans profil');
  assert.deepEqual(AVATAR_CHOICES.map(c => c.id).sort(), ['aucun', 'femme', 'homme']);
});

test('Le choix du personnage survit à l’enregistrement, et un faux choix est ignoré', () => {
  assert.equal(readProfile({ ...base, avatar: 'femme' }, base).avatar, 'femme');
  assert.equal(readProfile({ ...base, avatar: 'licorne' }, base).avatar, undefined);
  assert.ok(!('avatar' in readProfile(base, base)), 'un ancien profil reste identique');
});

test('Les tuiles additionnent minutes et kcal par activité, sans inventer de kcal', () => {
  const rows = [
    { session: { kind: 'walk', minutes: 30 }, estimate: { activeKcal: 110 } },
    { session: { kind: 'walk', minutes: 15 }, estimate: { activeKcal: 55 } },
    { session: { kind: 'swim', minutes: 20 }, estimate: null },
  ];
  const t = kindTotals(rows);
  assert.deepEqual(t.walk, { minutes: 45, kcal: 165 });
  assert.deepEqual(t.swim, { minutes: 20, kcal: 0 }, 'une séance sans estimation garde ses minutes');
  assert.equal(t.run, undefined);
  assert.equal(TILE_KINDS.length, 8);
});

const meal = (macros, complete = true) => ({ macros, items: [{ macrosComplete: complete }] });
test('Les pastilles de macros additionnent, et se taisent si une valeur manque', () => {
  assert.deepEqual(groupMacros([meal({ protein: 10.4, carbs: 40, fat: 5 }), meal({ protein: 2, carbs: 10.6, fat: 1 })]), { protein: 12, carbs: 51, fat: 6 });
  assert.equal(groupMacros([meal({ protein: 10, carbs: 40, fat: 5 }, false)]), null);
  assert.equal(groupMacros([]), null);
});

test('L’interface : en-tête avec personnage, tuiles en un appui, choix dans le profil', () => {
  const modal = read('src/components/ActivityModal.tsx');
  assert.ok(modal.includes('<UserAvatar choice={avatar}'), 'le personnage dans l’en-tête');
  assert.ok(modal.includes('onPress={() => pickKind(kind)}'), 'une tuile ouvre la séance déjà réglée');
  assert.ok(modal.includes('setIdea(kind)'));
  assert.ok(modal.includes('kcal brûlées en bougeant'));
  const profile = read('src/screens/ProfileScreen.tsx');
  assert.ok(profile.includes('Ton personnage') && profile.includes("patch('avatar', choice.id)"));
  assert.ok(read('src/components/MomentMeals.tsx').includes('<MacroDots meals={group.meals} />'));
});

test('Les images des personnages sont légères et sans fond', () => {
  for (const name of ['homme-face', 'homme-trois-quarts', 'femme-face', 'femme-trois-quarts']) {
    const file = path.join(__dirname, '..', 'assets', 'avatars', `${name}.png`);
    const size = fs.statSync(file).size;
    assert.ok(size < 200 * 1024, `${name} : ${Math.round(size / 1024)} Ko`);
    const buf = fs.readFileSync(file);
    assert.equal(buf[25], 6, `${name} : PNG avec couche transparente (RGBA)`);
  }
});
